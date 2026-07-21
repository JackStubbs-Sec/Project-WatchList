import type { WatchEntry } from "../types/watch";

export const RESERVED_TAGS = ["favorite", "recommended", "dropped"] as const;
export type ReservedTag = (typeof RESERVED_TAGS)[number];

export function hasTag(entry: Pick<WatchEntry, "tags">, tag: ReservedTag): boolean {
  return (entry.tags ?? []).includes(tag);
}

export function isFavorite(entry: Pick<WatchEntry, "tags">): boolean {
  return hasTag(entry, "favorite");
}

export function isRecommended(entry: Pick<WatchEntry, "tags">): boolean {
  return hasTag(entry, "recommended");
}

export function isDropped(entry: Pick<WatchEntry, "tags">): boolean {
  return hasTag(entry, "dropped");
}

export function withTag(tags: string[] | undefined, tag: ReservedTag, on: boolean): string[] {
  const withoutTag = (tags ?? []).filter((value) => value !== tag);
  return on ? [...withoutTag, tag] : withoutTag;
}

export function userTags(entry: Pick<WatchEntry, "tags">): string[] {
  return (entry.tags ?? []).filter((tag) => !RESERVED_TAGS.includes(tag as ReservedTag));
}
