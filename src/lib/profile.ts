const NAME_STORAGE_KEY = "watchlist-profile-name";

export function getProfileName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NAME_STORAGE_KEY) ?? "";
}

export function setProfileName(name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NAME_STORAGE_KEY, name.trim());
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((part) => part[0]!.toUpperCase()).join("");
}
