import type { TonightFilter, WatchEntry } from "../types/watch";

const RECENT_BUCKET_SIZE = 5;

export function pickTonight(
  entries: WatchEntry[],
  filter: TonightFilter,
  recentIds: string[]
): { pick?: WatchEntry; recentIds: string[] } {
  const pool = entries
    .filter((entry) => {
      switch (filter.status) {
        case "not_watched":
          return entry.status === "watchlist";
        case "watching":
          return entry.status === "watching";
        case "watched":
          return entry.status === "completed";
        case "dropped":
          return entry.status === "dropped";
        case "recommended":
          return entry.isRecommended;
        case "favourite":
          return entry.isFavorite;
        default:
          return entry.status === "watchlist" || entry.status === "watching";
      }
    })
    .filter((entry) => !filter.type || entry.type === filter.type)
    .filter((entry) => !filter.genre || entry.genre.toLowerCase() === filter.genre.toLowerCase())
    .filter((entry) => !filter.favoriteOnly || entry.isFavorite)
    .filter((entry) => !filter.recommendedOnly || entry.isRecommended)
    .filter((entry) => !filter.seriesLength || entry.seriesLength === filter.seriesLength);

  if (!pool.length) {
    return { pick: undefined, recentIds };
  }

  const fresherPool = pool.filter((entry) => !recentIds.includes(entry.id));
  const source = fresherPool.length ? fresherPool : pool;
  const pick = source[Math.floor(Math.random() * source.length)];
  const nextRecent = [pick.id, ...recentIds.filter((id) => id !== pick.id)].slice(0, RECENT_BUCKET_SIZE);

  return { pick, recentIds: nextRecent };
}
