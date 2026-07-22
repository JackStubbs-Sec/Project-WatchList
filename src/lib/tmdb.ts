import { getStoredTmdbApiKey } from "./tmdbKey";
import type { NetworkInfo, TmdbEpisode, TmdbSearchItem, TmdbTitleDetail, WatchType } from "../types/watch";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const TMDB_PROVIDER_LOGO_BASE = "https://image.tmdb.org/t/p/w92";

interface TmdbSearchResponseItem {
  id: number;
  media_type?: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
}

function getApiKey(): string | undefined {
  const stored = getStoredTmdbApiKey().trim();
  if (stored) return stored;

  const fromEnv = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
  return fromEnv?.trim() || undefined;
}

function buildPosterUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return `${TMDB_IMAGE_BASE}${path}`;
}

function detectMediaType(rawType?: string): WatchType | undefined {
  if (rawType === "movie") return "movie";
  if (rawType === "tv") return "tv";
  return undefined;
}

function parseYear(isoDate?: string): number | undefined {
  if (!isoDate) return undefined;
  const year = Number(isoDate.slice(0, 4));
  return Number.isFinite(year) ? year : undefined;
}

async function tmdbFetch<T>(path: string): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("TMDB API key missing. Add one in Profile > TMDB API Key.");
  }

  const response = await fetch(`${TMDB_BASE}${path}${path.includes("?") ? "&" : "?"}api_key=${encodeURIComponent(apiKey)}`);
  if (!response.ok) {
    throw new Error("TMDb request failed.");
  }

  return response.json() as Promise<T>;
}

export async function searchTmdb(query: string): Promise<TmdbSearchItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const data = await tmdbFetch<{ results: TmdbSearchResponseItem[] }>(`/search/multi?query=${encodeURIComponent(trimmed)}&include_adult=false`);

  return data.results
    .map((row) => {
      const mediaType = detectMediaType(row.media_type);
      if (!mediaType) return undefined;

      const label = row.title ?? row.name;
      if (!label) return undefined;

      return {
        tmdbId: row.id,
        mediaType,
        title: label,
        year: parseYear(row.release_date ?? row.first_air_date),
        releaseDate: row.release_date || row.first_air_date || undefined,
        posterUrl: buildPosterUrl(row.poster_path),
        synopsis: row.overview || undefined,
        genreIds: row.genre_ids ?? []
      } satisfies TmdbSearchItem;
    })
    .filter(Boolean) as TmdbSearchItem[];
}

export async function getTmdbTitleDetail(tmdbId: number, mediaType: WatchType): Promise<TmdbTitleDetail> {
  const [detail, credits] = await Promise.all([
    tmdbFetch<any>(`/${mediaType}/${tmdbId}`),
    tmdbFetch<any>(`/${mediaType}/${tmdbId}/credits`)
  ]);

  const crew = Array.isArray(credits?.crew) ? credits.crew : [];
  const cast = Array.isArray(credits?.cast)
    ? credits.cast.slice(0, 6).map((row: any) => row?.name).filter((value: unknown): value is string => typeof value === "string")
    : [];

  let directorOrCreator: string | undefined;
  if (mediaType === "movie") {
    const director = crew.find((row: any) => row?.job === "Director");
    directorOrCreator = typeof director?.name === "string" ? director.name : undefined;
  } else {
    const creator = Array.isArray(detail?.created_by) ? detail.created_by[0] : undefined;
    directorOrCreator = typeof creator?.name === "string" ? creator.name : undefined;
  }

  return {
    tmdbId,
    mediaType,
    title: detail.title ?? detail.name,
    year: parseYear(detail.release_date ?? detail.first_air_date),
    releaseDate: detail.release_date || detail.first_air_date || undefined,
    posterUrl: buildPosterUrl(detail.poster_path),
    genres: Array.isArray(detail.genres)
      ? detail.genres.map((row: any) => row?.name).filter((value: unknown): value is string => typeof value === "string")
      : [],
    synopsis: typeof detail.overview === "string" ? detail.overview : undefined,
    runtimeMinutes: typeof detail.runtime === "number" ? detail.runtime : undefined,
    episodeLengthMinutes: Array.isArray(detail.episode_run_time) && typeof detail.episode_run_time[0] === "number" ? detail.episode_run_time[0] : undefined,
    totalEpisodes: typeof detail.number_of_episodes === "number" ? detail.number_of_episodes : undefined,
    seasons: Array.isArray(detail.seasons)
      ? detail.seasons
          .filter((row: any) => typeof row?.season_number === "number" && typeof row?.episode_count === "number" && row.episode_count > 0)
          .map((row: any) => ({
            seasonNumber: row.season_number,
            episodeCount: row.episode_count,
            name: typeof row.name === "string" ? row.name : `Season ${row.season_number}`
          }))
          .sort((a: { seasonNumber: number }, b: { seasonNumber: number }) => a.seasonNumber - b.seasonNumber)
      : undefined,
    cast,
    directorOrCreator,
    networks: Array.isArray(detail.networks)
      ? detail.networks
          .map((row: any): NetworkInfo | undefined => (typeof row?.name === "string" ? { name: row.name } : undefined))
          .filter((row: NetworkInfo | undefined): row is NetworkInfo => Boolean(row))
      : undefined
  };
}

export async function getTmdbSeasonEpisodes(tmdbId: number, seasonNumber: number): Promise<TmdbEpisode[]> {
  const data = await tmdbFetch<{ episodes?: Array<{ episode_number: number; name?: string; air_date?: string }> }>(`/tv/${tmdbId}/season/${seasonNumber}`);
  return (data.episodes ?? []).map((row) => ({
    episodeNumber: row.episode_number,
    name: row.name || `Episode ${row.episode_number}`,
    airDate: row.air_date || undefined
  }));
}

export async function getTmdbSimilar(tmdbId: number, mediaType: WatchType): Promise<TmdbSearchItem[]> {
  const data = await tmdbFetch<{ results: TmdbSearchResponseItem[] }>(`/${mediaType}/${tmdbId}/similar`);
  return data.results.slice(0, 8).map((row) => ({
    tmdbId: row.id,
    mediaType,
    title: row.title ?? row.name ?? "Untitled",
    year: parseYear(row.release_date ?? row.first_air_date),
    releaseDate: row.release_date || row.first_air_date || undefined,
    posterUrl: buildPosterUrl(row.poster_path),
    synopsis: row.overview || undefined,
    genreIds: row.genre_ids ?? []
  }));
}

export async function getTmdbTrending(mediaType: WatchType, timeWindow: "day" | "week" = "day"): Promise<TmdbSearchItem[]> {
  const data = await tmdbFetch<{ results: TmdbSearchResponseItem[] }>(`/trending/${mediaType}/${timeWindow}`);
  return data.results.slice(0, 20).map((row) => ({
    tmdbId: row.id,
    mediaType,
    title: row.title ?? row.name ?? "Untitled",
    year: parseYear(row.release_date ?? row.first_air_date),
    releaseDate: row.release_date || row.first_air_date || undefined,
    posterUrl: buildPosterUrl(row.poster_path),
    synopsis: row.overview || undefined,
    genreIds: row.genre_ids ?? []
  }));
}

let genreMapCache: Partial<Record<WatchType, Map<number, string>>> = {};

export async function getGenreMap(mediaType: WatchType): Promise<Map<number, string>> {
  const cached = genreMapCache[mediaType];
  if (cached) return cached;

  const data = await tmdbFetch<{ genres: Array<{ id: number; name: string }> }>(`/genre/${mediaType}/list`);
  const map = new Map(data.genres.map((genre) => [genre.id, genre.name] as const));
  genreMapCache = { ...genreMapCache, [mediaType]: map };
  return map;
}

interface TmdbWatchProviderResponseItem {
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
}

interface TmdbWatchProvidersResponse {
  id: number;
  results?: Record<
    string,
    {
      link?: string;
      flatrate?: TmdbWatchProviderResponseItem[];
      rent?: TmdbWatchProviderResponseItem[];
      buy?: TmdbWatchProviderResponseItem[];
    }
  >;
}

export interface WatchProviderOption {
  providerId: number;
  providerName: string;
  logoUrl?: string;
}

export interface WatchProviders {
  link?: string;
  flatrate: WatchProviderOption[];
  rent: WatchProviderOption[];
  buy: WatchProviderOption[];
  /** False when TMDB/JustWatch has no provider data for this title in ANY region yet (e.g. a brand-new release), as opposed to data existing but simply not covering the requested region. */
  indexed: boolean;
}

function toProviderOptions(rows: TmdbWatchProviderResponseItem[] | undefined): WatchProviderOption[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    providerId: row.provider_id,
    providerName: row.provider_name,
    logoUrl: row.logo_path ? `${TMDB_PROVIDER_LOGO_BASE}${row.logo_path}` : undefined
  }));
}

export async function getWatchProviders(tmdbId: number, mediaType: WatchType, region: string): Promise<WatchProviders> {
  const data = await tmdbFetch<TmdbWatchProvidersResponse>(`/${mediaType}/${tmdbId}/watch/providers`);
  const indexed = Boolean(data.results && Object.keys(data.results).length > 0);
  const regionData = data.results?.[region];

  if (!regionData) {
    return { link: undefined, flatrate: [], rent: [], buy: [], indexed };
  }

  return {
    link: regionData.link,
    flatrate: toProviderOptions(regionData.flatrate),
    rent: toProviderOptions(regionData.rent),
    buy: toProviderOptions(regionData.buy),
    indexed
  };
}

interface TmdbProviderCatalogResponseItem {
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
  display_priorities?: Record<string, number>;
  display_priority?: number;
}

export async function getWatchProviderCatalog(mediaType: WatchType, region: string): Promise<WatchProviderOption[]> {
  const data = await tmdbFetch<{ results: TmdbProviderCatalogResponseItem[] }>(`/watch/providers/${mediaType}?watch_region=${encodeURIComponent(region)}`);

  return data.results
    .slice()
    .sort((a, b) => {
      const priorityA = a.display_priorities?.[region] ?? a.display_priority ?? 999;
      const priorityB = b.display_priorities?.[region] ?? b.display_priority ?? 999;
      return priorityA - priorityB;
    })
    .map((row) => ({
      providerId: row.provider_id,
      providerName: row.provider_name,
      logoUrl: row.logo_path ? `${TMDB_PROVIDER_LOGO_BASE}${row.logo_path}` : undefined
    }));
}
