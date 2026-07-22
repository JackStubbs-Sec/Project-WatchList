export type WatchType = "movie" | "tv";

export type WatchStatus = "want_to_watch" | "watching" | "watched";

export interface SeasonSummary {
  seasonNumber: number;
  episodeCount: number;
  name: string;
}

export interface NetworkInfo {
  name: string;
}

export interface TitleRecord {
  id: string;
  tmdbId?: number;
  mediaType: WatchType;
  title: string;
  year?: number;
  releaseDate?: string;
  posterUrl?: string;
  genres: string[];
  synopsis?: string;
  runtimeMinutes?: number;
  episodeLengthMinutes?: number;
  totalEpisodes?: number;
  seasons?: SeasonSummary[];
  cast: string[];
  directorOrCreator?: string;
  networks?: NetworkInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface EntryRecord {
  id: string;
  titleId: string;
  status: WatchStatus;
  rating?: number;
  notes?: string;
  firstWatchedDate?: string;
  isRewatch: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WatchLogRecord {
  id: string;
  entryId: string;
  watchedDate: string;
  ratingOverride?: number;
  notesOverride?: string;
  createdAt: string;
}

export interface EpisodeProgressRecord {
  id: string;
  entryId: string;
  season: number;
  episode: number;
  watched: boolean;
  watchedDate?: string;
}

export interface CustomListRecord {
  id: string;
  name: string;
  createdAt: string;
}

export interface CustomListItemRecord {
  id: string;
  listId: string;
  titleId: string;
}

export interface WatchEntry {
  id: string;
  titleId: string;
  tmdbId?: number;
  title: string;
  type: WatchType;
  status: WatchStatus;
  year?: number;
  releaseDate?: string;
  posterUrl?: string;
  genres: string[];
  synopsis?: string;
  runtimeMinutes?: number;
  episodeLengthMinutes?: number;
  totalEpisodes?: number;
  seasons?: SeasonSummary[];
  cast: string[];
  directorOrCreator?: string;
  networks?: NetworkInfo[];
  rating?: number;
  notes?: string;
  tags: string[];
  firstWatchedDate?: string;
  rewatchCount: number;
  watchHistory: WatchLogRecord[];
  episodeProgress: EpisodeProgressRecord[];
  listIds: string[];
  listNames: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RandomFilter {
  type: "movie" | "tv" | "both";
  includeStatuses: WatchStatus[];
  genres: string[];
  runtimeMaxMinutes?: number;
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  includeListIds: string[];
  excludeListIds: string[];
}

export interface SearchFilter {
  query: string;
  type: "movie" | "tv" | "both";
  status?: WatchStatus;
  minRating?: number;
  genre?: string;
}

export interface RecommendationReasoning {
  predictedRating?: number;
  basedOnTitles: string[];
}

export interface WatchStats {
  watchedMovies: number;
  watchedShows: number;
  totalWatchHours: number;
  averageRating?: number;
  topGenres: Array<{ genre: string; count: number }>;
  monthlyActivity: Array<{ month: string; count: number }>;
  topRated: Array<{ id: string; title: string; rating: number }>;
}

export interface TmdbSearchItem {
  tmdbId: number;
  mediaType: WatchType;
  title: string;
  year?: number;
  releaseDate?: string;
  posterUrl?: string;
  synopsis?: string;
  genreIds: number[];
}

export interface TmdbEpisode {
  episodeNumber: number;
  name: string;
  airDate?: string;
}

export interface DiscoveryPick {
  tmdbId: number;
  mediaType: WatchType;
  title: string;
  year?: number;
  releaseDate?: string;
  posterUrl?: string;
  synopsis?: string;
  genres: string[];
  runtimeMinutes?: number;
}

export interface TmdbTitleDetail {
  tmdbId: number;
  mediaType: WatchType;
  title: string;
  year?: number;
  releaseDate?: string;
  posterUrl?: string;
  genres: string[];
  synopsis?: string;
  runtimeMinutes?: number;
  episodeLengthMinutes?: number;
  totalEpisodes?: number;
  seasons?: SeasonSummary[];
  cast: string[];
  directorOrCreator?: string;
  networks?: NetworkInfo[];
}
