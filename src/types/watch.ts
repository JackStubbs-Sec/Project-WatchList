export type WatchType = "movie" | "series";

export type WatchStatus = "watchlist" | "watching" | "completed" | "dropped";

export type SeriesLength = "short" | "long";

export const streamingPlatforms = ["netflix", "prime", "nowtv", "appletv", "paramount", "itvx", "channel4", "disney"] as const;

export type StreamingPlatform = (typeof streamingPlatforms)[number];

export type TonightStatusFilter = "not_watched" | "watching" | "watched" | "dropped" | "recommended" | "favourite";

export interface WatchEntry {
  id: string;
  title: string;
  type: WatchType;
  status: WatchStatus;
  genre: string;
  platform?: StreamingPlatform;
  totalSeasons?: number;
  season?: number;
  episode?: number;
  isFavorite: boolean;
  isRecommended: boolean;
  rating?: number;
  review?: string;
  notes?: string;
  seriesLength?: SeriesLength;
  createdAt: string;
  updatedAt: string;
  lastWatchedAt?: string;
}

export interface TonightFilter {
  type?: WatchType;
  genre?: string;
  status?: TonightStatusFilter;
  favoriteOnly: boolean;
  recommendedOnly: boolean;
  seriesLength?: SeriesLength;
}

export interface SearchFilter {
  type?: WatchType;
  status?: WatchStatus;
  favoriteOnly: boolean;
  recommendedOnly: boolean;
  minRating?: number;
}
