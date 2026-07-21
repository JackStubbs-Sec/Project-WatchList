import { db } from "./db";
import type {
  CustomListItemRecord,
  CustomListRecord,
  EntryRecord,
  EpisodeProgressRecord,
  RandomFilter,
  SeasonSummary,
  TitleRecord,
  TmdbTitleDetail,
  WatchEntry,
  WatchLogRecord,
  WatchStats
} from "../types/watch";

export interface EntryUpsertInput {
  entryId?: string;
  title: TmdbTitleDetail | {
    tmdbId?: number;
    mediaType: "movie" | "tv";
    title: string;
    year?: number;
    posterUrl?: string;
    genres?: string[];
    synopsis?: string;
    runtimeMinutes?: number;
    episodeLengthMinutes?: number;
    totalEpisodes?: number;
    seasons?: SeasonSummary[];
    cast?: string[];
    directorOrCreator?: string;
  };
  status: EntryRecord["status"];
  rating?: number;
  notes?: string;
  tags?: string[];
  firstWatchedDate?: string;
  isRewatch?: boolean;
  listIds?: string[];
}

function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags?.length) return [];
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
}

function toMonthKey(isoDate: string): string {
  const date = new Date(isoDate);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

async function composeEntries(): Promise<WatchEntry[]> {
  const [titles, entries, watches, progressRows, lists, listItems] = await Promise.all([
    db.titles.toArray(),
    db.entries.orderBy("updatedAt").reverse().toArray(),
    db.watches.toArray(),
    db.episodeProgress.toArray(),
    db.customLists.toArray(),
    db.customListItems.toArray()
  ]);

  const titleById = new Map(titles.map((title) => [title.id, title]));
  const watchesByEntry = new Map<string, WatchLogRecord[]>();
  const progressByEntry = new Map<string, EpisodeProgressRecord[]>();
  const listNameById = new Map(lists.map((list) => [list.id, list.name]));
  const listIdsByTitle = new Map<string, string[]>();

  for (const watch of watches) {
    const bucket = watchesByEntry.get(watch.entryId) ?? [];
    bucket.push(watch);
    watchesByEntry.set(watch.entryId, bucket);
  }

  for (const row of progressRows) {
    const bucket = progressByEntry.get(row.entryId) ?? [];
    bucket.push(row);
    progressByEntry.set(row.entryId, bucket);
  }

  for (const item of listItems) {
    const bucket = listIdsByTitle.get(item.titleId) ?? [];
    if (!bucket.includes(item.listId)) {
      bucket.push(item.listId);
    }
    listIdsByTitle.set(item.titleId, bucket);
  }

  return entries
    .map((entry) => {
      const title = titleById.get(entry.titleId);
      if (!title) return undefined;

      const watchHistory = (watchesByEntry.get(entry.id) ?? []).sort((a, b) => b.watchedDate.localeCompare(a.watchedDate));
      const episodeProgress = (progressByEntry.get(entry.id) ?? []).sort((a, b) => {
        if (a.season === b.season) return a.episode - b.episode;
        return a.season - b.season;
      });
      const listIds = listIdsByTitle.get(entry.titleId) ?? [];

      return {
        id: entry.id,
        titleId: title.id,
        tmdbId: title.tmdbId,
        title: title.title,
        type: title.mediaType,
        status: entry.status,
        year: title.year,
        posterUrl: title.posterUrl,
        genres: title.genres,
        synopsis: title.synopsis,
        runtimeMinutes: title.runtimeMinutes,
        episodeLengthMinutes: title.episodeLengthMinutes,
        totalEpisodes: title.totalEpisodes,
        seasons: title.seasons,
        cast: title.cast,
        directorOrCreator: title.directorOrCreator,
        rating: entry.rating,
        notes: entry.notes,
        tags: entry.tags ?? [],
        firstWatchedDate: entry.firstWatchedDate,
        rewatchCount: Math.max(0, watchHistory.length - 1),
        watchHistory,
        episodeProgress,
        listIds,
        listNames: listIds.map((id) => listNameById.get(id)).filter(Boolean) as string[],
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      } satisfies WatchEntry;
    })
    .filter(Boolean) as WatchEntry[];
}

export const entryRepository = {
  async list(): Promise<WatchEntry[]> {
    return composeEntries();
  },

  async upsertEntry(input: EntryUpsertInput): Promise<string> {
    const now = new Date().toISOString();
    const titleId = input.title.tmdbId ? `tmdb-${input.title.mediaType}-${input.title.tmdbId}` : `manual-${crypto.randomUUID()}`;

    const existingTitle = await db.titles.get(titleId);
    const title: TitleRecord = {
      id: titleId,
      tmdbId: input.title.tmdbId,
      mediaType: input.title.mediaType,
      title: input.title.title,
      year: input.title.year,
      posterUrl: input.title.posterUrl,
      genres: input.title.genres ?? [],
      synopsis: input.title.synopsis,
      runtimeMinutes: input.title.runtimeMinutes,
      episodeLengthMinutes: input.title.episodeLengthMinutes,
      totalEpisodes: input.title.totalEpisodes,
      seasons: input.title.seasons,
      cast: input.title.cast ?? [],
      directorOrCreator: input.title.directorOrCreator,
      createdAt: existingTitle?.createdAt ?? now,
      updatedAt: now
    };

    const entryId = input.entryId ?? crypto.randomUUID();
    const existingEntry = await db.entries.get(entryId);
    const entry: EntryRecord = {
      id: entryId,
      titleId,
      status: input.status,
      rating: input.rating,
      notes: input.notes,
      firstWatchedDate: input.firstWatchedDate,
      isRewatch: Boolean(input.isRewatch),
      tags: normalizeTags(input.tags),
      createdAt: existingEntry?.createdAt ?? now,
      updatedAt: now
    };

    await db.transaction("rw", db.titles, db.entries, db.customListItems, async () => {
      await db.titles.put(title);
      await db.entries.put(entry);

      if (input.listIds) {
        const previous = await db.customListItems.where("titleId").equals(titleId).toArray();
        for (const oldItem of previous) {
          await db.customListItems.delete(oldItem.id);
        }

        for (const listId of input.listIds) {
          await db.customListItems.put({
            id: `${listId}-${titleId}`,
            listId,
            titleId
          });
        }
      }
    });

    return entryId;
  },

  async updateEntry(id: string, patch: Partial<EntryRecord>): Promise<void> {
    const nextPatch: Partial<EntryRecord> = {
      ...patch,
      updatedAt: new Date().toISOString()
    };
    if (patch.tags !== undefined) {
      nextPatch.tags = normalizeTags(patch.tags);
    }
    await db.entries.update(id, nextPatch);
  },

  async removeEntry(id: string): Promise<void> {
    await db.transaction("rw", db.entries, db.watches, db.episodeProgress, async () => {
      await db.watches.where("entryId").equals(id).delete();
      await db.episodeProgress.where("entryId").equals(id).delete();
      await db.entries.delete(id);
    });
  },

  async addWatch(entryId: string, watchedDate: string, ratingOverride?: number, notesOverride?: string): Promise<void> {
    const now = new Date().toISOString();
    await db.watches.put({
      id: crypto.randomUUID(),
      entryId,
      watchedDate,
      ratingOverride,
      notesOverride,
      createdAt: now
    });
    await db.entries.update(entryId, { updatedAt: now });
  },

  async setEpisodeProgress(entryId: string, season: number, episode: number, watched: boolean, watchedDate?: string): Promise<void> {
    const id = `${entryId}-${season}-${episode}`;
    await db.episodeProgress.put({ id, entryId, season, episode, watched, watchedDate });
    await db.entries.update(entryId, { updatedAt: new Date().toISOString() });
  },

  async listCustomLists(): Promise<CustomListRecord[]> {
    return db.customLists.orderBy("name").toArray();
  },

  async createCustomList(name: string): Promise<string> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("List name is required.");
    }

    const existing = await db.customLists.filter((row) => row.name.toLowerCase() === trimmed.toLowerCase()).first();
    if (existing) return existing.id;

    const id = crypto.randomUUID();
    await db.customLists.put({ id, name: trimmed, createdAt: new Date().toISOString() });
    return id;
  },

  async assignListsToTitle(titleId: string, listIds: string[]): Promise<void> {
    const uniqueIds = Array.from(new Set(listIds));
    await db.transaction("rw", db.customListItems, async () => {
      const old = await db.customListItems.where("titleId").equals(titleId).toArray();
      for (const row of old) {
        await db.customListItems.delete(row.id);
      }
      for (const listId of uniqueIds) {
        await db.customListItems.put({ id: `${listId}-${titleId}`, listId, titleId } as CustomListItemRecord);
      }
    });
  },

  async listGenres(): Promise<string[]> {
    const titles = await db.titles.toArray();
    const genres = new Set<string>();
    for (const title of titles) {
      for (const genre of title.genres) {
        const trimmed = genre.trim();
        if (trimmed) genres.add(trimmed);
      }
    }
    return Array.from(genres).sort((a, b) => a.localeCompare(b));
  },

  async clear(): Promise<void> {
    await db.transaction("rw", [db.titles, db.entries, db.watches, db.episodeProgress, db.customLists, db.customListItems], async () => {
      await db.customListItems.clear();
      await db.customLists.clear();
      await db.episodeProgress.clear();
      await db.watches.clear();
      await db.entries.clear();
      await db.titles.clear();
    });
  },

  async exportData(): Promise<{
    version: number;
    titles: TitleRecord[];
    entries: EntryRecord[];
    watches: WatchLogRecord[];
    episodeProgress: EpisodeProgressRecord[];
    customLists: CustomListRecord[];
    customListItems: CustomListItemRecord[];
  }> {
    const [titles, entries, watches, episodeProgress, customLists, customListItems] = await Promise.all([
      db.titles.toArray(),
      db.entries.toArray(),
      db.watches.toArray(),
      db.episodeProgress.toArray(),
      db.customLists.toArray(),
      db.customListItems.toArray()
    ]);

    return {
      version: 2,
      titles,
      entries,
      watches,
      episodeProgress,
      customLists,
      customListItems
    };
  },

  async importData(payload: {
    titles?: TitleRecord[];
    entries?: EntryRecord[];
    watches?: WatchLogRecord[];
    episodeProgress?: EpisodeProgressRecord[];
    customLists?: CustomListRecord[];
    customListItems?: CustomListItemRecord[];
  }): Promise<void> {
    await db.transaction("rw", [db.titles, db.entries, db.watches, db.episodeProgress, db.customLists, db.customListItems], async () => {
      if (Array.isArray(payload.titles)) await db.titles.bulkPut(payload.titles);
      if (Array.isArray(payload.entries)) await db.entries.bulkPut(payload.entries);
      if (Array.isArray(payload.watches)) await db.watches.bulkPut(payload.watches);
      if (Array.isArray(payload.episodeProgress)) await db.episodeProgress.bulkPut(payload.episodeProgress);
      if (Array.isArray(payload.customLists)) await db.customLists.bulkPut(payload.customLists);
      if (Array.isArray(payload.customListItems)) await db.customListItems.bulkPut(payload.customListItems);
    });
  },

  async computeStats(): Promise<WatchStats> {
    const entries = await composeEntries();
    const watched = entries.filter((entry) => entry.status === "watched");
    const watchedMovies = watched.filter((entry) => entry.type === "movie").length;
    const watchedShows = watched.filter((entry) => entry.type === "tv").length;
    const ratings = entries.map((entry) => entry.rating).filter((value): value is number => typeof value === "number");

    let totalWatchMinutes = 0;
    for (const entry of watched) {
      if (entry.type === "movie") {
        totalWatchMinutes += entry.runtimeMinutes ?? 0;
      } else {
        const watchedEpisodes = entry.episodeProgress.filter((row) => row.watched).length;
        totalWatchMinutes += watchedEpisodes * (entry.episodeLengthMinutes ?? 0);
      }
    }

    const genreCount = new Map<string, number>();
    for (const entry of watched) {
      for (const genre of entry.genres) {
        genreCount.set(genre, (genreCount.get(genre) ?? 0) + 1);
      }
    }

    const monthly = new Map<string, number>();
    for (const entry of entries) {
      const dates = entry.watchHistory.map((watch) => watch.watchedDate);
      if (!dates.length && entry.firstWatchedDate) {
        dates.push(entry.firstWatchedDate);
      }

      for (const date of dates) {
        monthly.set(toMonthKey(date), (monthly.get(toMonthKey(date)) ?? 0) + 1);
      }
    }

    const topRated = entries
      .filter((entry): entry is WatchEntry & { rating: number } => typeof entry.rating === "number")
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)
      .map((entry) => ({ id: entry.id, title: entry.title, rating: entry.rating }));

    return {
      watchedMovies,
      watchedShows,
      totalWatchHours: Number((totalWatchMinutes / 60).toFixed(1)),
      averageRating: ratings.length ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(2)) : undefined,
      topGenres: Array.from(genreCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([genre, count]) => ({ genre, count })),
      monthlyActivity: Array.from(monthly.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, count]) => ({ month, count })),
      topRated
    };
  },

  filterForRandom(entries: WatchEntry[], filter: RandomFilter): WatchEntry[] {
    return entries.filter((entry) => {
      if (filter.type !== "both" && entry.type !== filter.type) return false;
      if (!filter.includeStatuses.includes(entry.status)) return false;
      if (filter.genres.length && !entry.genres.some((genre) => filter.genres.includes(genre))) return false;

      const runtime = entry.type === "movie" ? entry.runtimeMinutes : entry.episodeLengthMinutes;
      if (typeof filter.runtimeMaxMinutes === "number" && typeof runtime === "number" && runtime > filter.runtimeMaxMinutes) return false;
      if (typeof filter.yearFrom === "number" && typeof entry.year === "number" && entry.year < filter.yearFrom) return false;
      if (typeof filter.yearTo === "number" && typeof entry.year === "number" && entry.year > filter.yearTo) return false;
      if (typeof filter.minRating === "number" && (entry.rating ?? 0) < filter.minRating) return false;

      if (filter.includeListIds.length && !filter.includeListIds.some((id) => entry.listIds.includes(id))) return false;
      if (filter.excludeListIds.length && filter.excludeListIds.some((id) => entry.listIds.includes(id))) return false;
      return true;
    });
  }
};
