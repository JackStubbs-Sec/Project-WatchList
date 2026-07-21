import Dexie, { type EntityTable } from "dexie";
import type {
  CustomListItemRecord,
  CustomListRecord,
  EntryRecord,
  EpisodeProgressRecord,
  TitleRecord,
  WatchLogRecord
} from "../types/watch";

interface LegacyWatchEntry {
  id: string;
  title: string;
  type?: "movie" | "series";
  status?: "watchlist" | "watching" | "completed" | "dropped";
  genre?: string;
  totalSeasons?: number;
  season?: number;
  episode?: number;
  rating?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  lastWatchedAt?: string;
}

export class WatchListDb extends Dexie {
  titles!: EntityTable<TitleRecord, "id">;
  entries!: EntityTable<EntryRecord, "id">;
  watches!: EntityTable<WatchLogRecord, "id">;
  episodeProgress!: EntityTable<EpisodeProgressRecord, "id">;
  customLists!: EntityTable<CustomListRecord, "id">;
  customListItems!: EntityTable<CustomListItemRecord, "id">;

  constructor() {
    super("watchlist-db");
    this.version(1).stores({
      entries: "id, title, status, type, genre, updatedAt, createdAt"
    });

    this.version(2)
      .stores({
        titles: "id, tmdbId, mediaType, title, year, updatedAt",
        entries: "id, titleId, status, rating, updatedAt",
        watches: "id, entryId, watchedDate, createdAt",
        episodeProgress: "id, entryId, season, episode, watched",
        customLists: "id, name, createdAt",
        customListItems: "id, listId, titleId"
      })
      .upgrade(async (transaction) => {
        const legacyRows = await transaction.table("entries").toArray() as LegacyWatchEntry[];

        for (const oldEntry of legacyRows) {
          if (!oldEntry?.id || !oldEntry?.title) continue;

          const now = new Date().toISOString();
          const createdAt = oldEntry.createdAt ?? now;
          const updatedAt = oldEntry.updatedAt ?? createdAt;
          const titleId = `legacy-title-${oldEntry.id}`;
          const mediaType = oldEntry.type === "series" ? "tv" : "movie";
          const rawStatus = oldEntry.status;
          const status = rawStatus === "watching" || rawStatus === "completed"
            ? (rawStatus === "completed" ? "watched" : "watching")
            : "want_to_watch";

          await transaction.table("titles").put({
            id: titleId,
            mediaType,
            title: oldEntry.title,
            genres: oldEntry.genre ? [oldEntry.genre] : [],
            cast: [],
            createdAt,
            updatedAt
          } satisfies TitleRecord);

          await transaction.table("entries").put({
            id: oldEntry.id,
            titleId,
            status,
            rating: oldEntry.rating,
            notes: oldEntry.notes,
            firstWatchedDate: oldEntry.lastWatchedAt,
            isRewatch: false,
            tags: [],
            createdAt,
            updatedAt
          } satisfies EntryRecord);

          if (oldEntry.lastWatchedAt) {
            await transaction.table("watches").put({
              id: `legacy-watch-${oldEntry.id}`,
              entryId: oldEntry.id,
              watchedDate: oldEntry.lastWatchedAt,
              ratingOverride: oldEntry.rating,
              notesOverride: oldEntry.notes,
              createdAt: updatedAt
            } satisfies WatchLogRecord);
          }

          if (mediaType === "tv" && oldEntry.season && oldEntry.episode) {
            await transaction.table("episodeProgress").put({
              id: `legacy-ep-${oldEntry.id}-${oldEntry.season}-${oldEntry.episode}`,
              entryId: oldEntry.id,
              season: oldEntry.season,
              episode: oldEntry.episode,
              watched: true,
              watchedDate: oldEntry.lastWatchedAt
            } satisfies EpisodeProgressRecord);
          }
        }
      });
  }
}

export const db = new WatchListDb();
