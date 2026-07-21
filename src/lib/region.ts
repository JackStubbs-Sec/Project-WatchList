const REGION_STORAGE_KEY = "watchlist-region";
const DEFAULT_REGION = "GB";

export function getRegion(): string {
  if (typeof window === "undefined") return DEFAULT_REGION;
  return window.localStorage.getItem(REGION_STORAGE_KEY) || DEFAULT_REGION;
}

export function setRegion(region: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REGION_STORAGE_KEY, region);
}
