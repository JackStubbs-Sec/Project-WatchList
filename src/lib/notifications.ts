import { getTmdbSeasonSummaries } from "./tmdb";
import type { WatchEntry } from "../types/watch";

const ACKNOWLEDGED_STORAGE_KEY = "watchlist-acknowledged-seasons";
const LAST_CHECK_STORAGE_KEY = "watchlist-season-check-last";
const CACHED_NOTIFICATIONS_STORAGE_KEY = "watchlist-cached-notifications";
const RECHECK_INTERVAL_MS = 12 * 60 * 60 * 1000;

export interface NewSeasonNotification {
  entryId: string;
  tmdbId: number;
  title: string;
  posterUrl?: string;
  newSeasonNumber: number;
}

function getAcknowledgedMap(): Record<number, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ACKNOWLEDGED_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function setAcknowledgedMap(map: Record<number, number>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACKNOWLEDGED_STORAGE_KEY, JSON.stringify(map));
}

export function acknowledgeSeasons(notifications: NewSeasonNotification[]): void {
  if (!notifications.length) return;
  const map = getAcknowledgedMap();
  for (const notification of notifications) {
    map[notification.tmdbId] = Math.max(map[notification.tmdbId] ?? 0, notification.newSeasonNumber);
  }
  setAcknowledgedMap(map);
}

export function shouldRecheckNotifications(): boolean {
  if (typeof window === "undefined") return false;
  const last = window.localStorage.getItem(LAST_CHECK_STORAGE_KEY);
  if (!last) return true;
  return Date.now() - Number(last) > RECHECK_INTERVAL_MS;
}

function markNotificationsChecked(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_CHECK_STORAGE_KEY, String(Date.now()));
}

export function getCachedNotifications(): NewSeasonNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CACHED_NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setCachedNotifications(notifications: NewSeasonNotification[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHED_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
}

function watchedMaxSeason(entry: WatchEntry): number | undefined {
  const watchedSeasons = entry.episodeProgress.filter((row) => row.watched).map((row) => row.season);
  return watchedSeasons.length ? Math.max(...watchedSeasons) : undefined;
}

function knownMaxSeason(entry: WatchEntry): number | undefined {
  return entry.seasons?.length ? Math.max(...entry.seasons.map((season) => season.seasonNumber)) : undefined;
}

/** Fetches fresh season data for every eligible TV entry and diffs it against what the user has already watched/seen. Network-bound — call sparingly (see shouldRecheckNotifications). */
export async function checkForNewSeasons(entries: WatchEntry[]): Promise<NewSeasonNotification[]> {
  const acknowledged = getAcknowledgedMap();
  const candidates = entries.filter(
    (entry): entry is WatchEntry & { tmdbId: number } =>
      entry.type === "tv" && (entry.status === "want_to_watch" || entry.status === "watched") && typeof entry.tmdbId === "number"
  );

  const results = await Promise.all(
    candidates.map(async (entry): Promise<NewSeasonNotification | undefined> => {
      try {
        const seasons = await getTmdbSeasonSummaries(entry.tmdbId);
        if (!seasons.length) return undefined;

        const currentMax = Math.max(...seasons.map((season) => season.seasonNumber));
        const baseline = Math.max(watchedMaxSeason(entry) ?? -1, knownMaxSeason(entry) ?? -1, acknowledged[entry.tmdbId] ?? -1);

        if (currentMax > baseline) {
          return { entryId: entry.id, tmdbId: entry.tmdbId, title: entry.title, posterUrl: entry.posterUrl, newSeasonNumber: currentMax };
        }
        return undefined;
      } catch {
        return undefined;
      }
    })
  );

  markNotificationsChecked();
  const notifications = results.filter((result): result is NewSeasonNotification => Boolean(result));
  setCachedNotifications(notifications);
  return notifications;
}
