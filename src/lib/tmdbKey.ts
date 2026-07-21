const API_KEY_STORAGE_KEY = "watchlist-tmdb-api-key";

export function getStoredTmdbApiKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(API_KEY_STORAGE_KEY) ?? "";
}

export function setStoredTmdbApiKey(key: string): void {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  if (trimmed) {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
  } else {
    window.localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
}
