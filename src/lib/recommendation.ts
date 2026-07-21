import { isFavorite } from "./entryTags";
import { getGenreMap, getTmdbTitleDetail, getTmdbTrending, getWatchProviders } from "./tmdb";
import type { DiscoveryPick, RandomFilter, RecommendationReasoning, TmdbSearchItem, WatchEntry } from "../types/watch";

const RECENT_BUCKET_SIZE = 6;
const BASED_ON_LIMIT = 3;
const FALLBACK_POOL_SIZE = 10;
const AVAILABILITY_CHECK_LIMIT = 20;

export interface ShuffleResult {
  pick?: WatchEntry;
  reasoning: RecommendationReasoning;
  recentIds: string[];
}

export function pickFromWatchlist(entries: WatchEntry[], filter: RandomFilter, recentIds: string[]): ShuffleResult {
  const pool = entries
    .filter((entry) => filter.type === "both" || entry.type === filter.type)
    .filter((entry) => filter.includeStatuses.includes(entry.status))
    .filter((entry) => !filter.genres.length || entry.genres.some((genre) => filter.genres.includes(genre)));

  if (!pool.length) {
    return { pick: undefined, reasoning: { predictedRating: undefined, basedOnTitles: [] }, recentIds };
  }

  const fresherPool = pool.filter((entry) => !recentIds.includes(entry.id));
  const source = fresherPool.length ? fresherPool : pool;
  const pick = source[Math.floor(Math.random() * source.length)];
  const nextRecent = [pick.id, ...recentIds.filter((id) => id !== pick.id)].slice(0, RECENT_BUCKET_SIZE);
  const reasoning = explainByGenres(
    pick.genres,
    entries.filter((entry) => entry.id !== pick.id)
  );

  return { pick, reasoning, recentIds: nextRecent };
}

export function explainByGenres(genres: string[], entries: WatchEntry[]): RecommendationReasoning {
  const related = entries.filter(
    (entry) => entry.status === "watched" && typeof entry.rating === "number" && entry.genres.some((genre) => genres.includes(genre))
  ) as Array<WatchEntry & { rating: number }>;

  if (!related.length) {
    return { predictedRating: undefined, basedOnTitles: [] };
  }

  const predictedRating = Number((related.reduce((sum, entry) => sum + entry.rating, 0) / related.length).toFixed(1));
  const basedOnTitles = [...related]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, BASED_ON_LIMIT)
    .map((entry) => entry.title);

  return { predictedRating, basedOnTitles };
}

async function fetchTrendingPool(typeFilter: "movie" | "tv" | "both"): Promise<TmdbSearchItem[]> {
  if (typeFilter === "both") {
    const [movies, tv] = await Promise.all([getTmdbTrending("movie", "week"), getTmdbTrending("tv", "week")]);
    return [...movies, ...tv];
  }
  return getTmdbTrending(typeFilter, "week");
}

function favoredGenreWeights(entries: WatchEntry[]): Map<string, number> {
  const weights = new Map<string, number>();
  for (const entry of entries) {
    const liked = entry.status === "watched" && ((entry.rating ?? 0) >= 4 || isFavorite(entry));
    if (!liked) continue;
    for (const genre of entry.genres) {
      weights.set(genre, (weights.get(genre) ?? 0) + 1);
    }
  }
  return weights;
}

export interface DiscoveryResult {
  pick?: DiscoveryPick;
  reasoning: RecommendationReasoning;
  recentKeys: string[];
}

interface ScoredItem {
  item: TmdbSearchItem;
  score: number;
}

async function isAvailableInRegion(item: TmdbSearchItem, region: string): Promise<boolean> {
  try {
    const providers = await getWatchProviders(item.tmdbId, item.mediaType, region);
    return providers.flatrate.length > 0 || providers.rent.length > 0 || providers.buy.length > 0;
  } catch {
    return false;
  }
}

async function filterAvailableInRegion(pool: ScoredItem[], region: string): Promise<ScoredItem[]> {
  const capped = pool.slice(0, AVAILABILITY_CHECK_LIMIT);
  const checks = await Promise.all(capped.map((entry) => isAvailableInRegion(entry.item, region)));
  return capped.filter((_, index) => checks[index]);
}

export async function getDiscoveryPick(
  entries: WatchEntry[],
  typeFilter: "movie" | "tv" | "both",
  genreFilter: string[],
  recentKeys: string[],
  region: string
): Promise<DiscoveryResult> {
  const libraryKeys = new Set(
    entries.filter((entry): entry is WatchEntry & { tmdbId: number } => typeof entry.tmdbId === "number").map((entry) => `${entry.type}-${entry.tmdbId}`)
  );

  const pool = await fetchTrendingPool(typeFilter);
  const candidates = pool.filter((item) => !libraryKeys.has(`${item.mediaType}-${item.tmdbId}`));

  if (!candidates.length) {
    return { pick: undefined, reasoning: { predictedRating: undefined, basedOnTitles: [] }, recentKeys };
  }

  const mediaTypesInPool = new Set(candidates.map((item) => item.mediaType));
  const genreMaps = await Promise.all(Array.from(mediaTypesInPool).map((mediaType) => getGenreMap(mediaType)));
  const mergedGenreMap = new Map<number, string>();
  for (const map of genreMaps) {
    for (const [id, name] of map) mergedGenreMap.set(id, name);
  }

  function genreNamesOf(item: TmdbSearchItem): string[] {
    return item.genreIds.map((id) => mergedGenreMap.get(id)).filter((name): name is string => Boolean(name));
  }

  const genreFiltered = genreFilter.length ? candidates.filter((item) => genreNamesOf(item).some((name) => genreFilter.includes(name))) : candidates;
  const workingPool = genreFiltered.length ? genreFiltered : candidates;

  const favoredWeights = favoredGenreWeights(entries);

  function scoreOf(item: TmdbSearchItem): number {
    return genreNamesOf(item).reduce((sum, name) => sum + (favoredWeights.get(name) ?? 0), 0);
  }

  const scored = workingPool.map((item) => ({ item, score: scoreOf(item) }));
  const maxScore = Math.max(...scored.map((entry) => entry.score));
  const topPool = maxScore > 0 ? scored.filter((entry) => entry.score === maxScore) : scored.slice(0, Math.min(FALLBACK_POOL_SIZE, scored.length));

  const keyOf = (item: TmdbSearchItem) => `${item.mediaType}-${item.tmdbId}`;

  let availablePool = await filterAvailableInRegion(topPool, region);
  if (!availablePool.length) {
    const topKeys = new Set(topPool.map((entry) => keyOf(entry.item)));
    const remaining = scored.filter((entry) => !topKeys.has(keyOf(entry.item)));
    availablePool = await filterAvailableInRegion(remaining, region);
  }

  if (!availablePool.length) {
    return { pick: undefined, reasoning: { predictedRating: undefined, basedOnTitles: [] }, recentKeys };
  }

  const fresh = availablePool.filter((entry) => !recentKeys.includes(keyOf(entry.item)));
  const finalPool = fresh.length ? fresh : availablePool;
  const chosen = finalPool[Math.floor(Math.random() * finalPool.length)].item;

  const detail = await getTmdbTitleDetail(chosen.tmdbId, chosen.mediaType);
  const pick: DiscoveryPick = {
    tmdbId: detail.tmdbId,
    mediaType: detail.mediaType,
    title: detail.title,
    year: detail.year,
    posterUrl: detail.posterUrl,
    synopsis: detail.synopsis,
    genres: detail.genres,
    runtimeMinutes: detail.runtimeMinutes
  };

  const reasoning = explainByGenres(pick.genres, entries);
  const key = keyOf(chosen);
  const nextRecent = [key, ...recentKeys.filter((existing) => existing !== key)].slice(0, RECENT_BUCKET_SIZE);

  return { pick, reasoning, recentKeys: nextRecent };
}
