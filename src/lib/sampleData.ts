import { entryRepository } from "../data/entryRepository";
import { getTmdbTitleDetail, searchTmdb } from "./tmdb";
import type { WatchStatus, WatchType } from "../types/watch";

interface SampleTitle {
  title: string;
  type: WatchType;
  status: WatchStatus;
  rating?: number;
  notes?: string;
  tags?: string[];
  seedWatchedEpisodes?: number;
}

const SAMPLE_TITLES: SampleTitle[] = [
  { title: "Inception", type: "movie", status: "watched", rating: 4.5, notes: "Mind-bending and endlessly rewatchable.", tags: ["favorite"] },
  { title: "The Dark Knight", type: "movie", status: "watched", rating: 5, notes: "Heath Ledger's Joker is unmatched.", tags: ["favorite", "recommended"] },
  { title: "Parasite", type: "movie", status: "watched", rating: 4.5, notes: "Perfect social commentary, incredible tonal shifts.", tags: ["recommended"] },
  { title: "La La Land", type: "movie", status: "watched", rating: 3.5, notes: "Beautiful visuals, bittersweet ending." },
  { title: "Barbie", type: "movie", status: "watched", rating: 3, notes: "Fun but a little uneven in the back half." },
  { title: "Dune: Part Two", type: "movie", status: "want_to_watch" },
  { title: "Oppenheimer", type: "movie", status: "want_to_watch" },
  { title: "Everything Everywhere All at Once", type: "movie", status: "want_to_watch" },
  { title: "Breaking Bad", type: "tv", status: "watching", seedWatchedEpisodes: 4 },
  { title: "The Bear", type: "tv", status: "watching", seedWatchedEpisodes: 3 },
  { title: "Chernobyl", type: "tv", status: "watched", rating: 5, notes: "Devastating and meticulously made.", tags: ["favorite"] },
  { title: "Fleabag", type: "tv", status: "watched", rating: 4.5, notes: "Sharp writing, incredible central performance.", tags: ["recommended"] },
  { title: "The Last of Us", type: "tv", status: "want_to_watch" },
  { title: "Severance", type: "tv", status: "want_to_watch" }
];

export interface SeedProgress {
  completed: number;
  total: number;
  current: string;
}

export async function seedSampleLibrary(onProgress?: (progress: SeedProgress) => void): Promise<{ added: string[]; skipped: string[] }> {
  const added: string[] = [];
  const skipped: string[] = [];

  for (let index = 0; index < SAMPLE_TITLES.length; index += 1) {
    const sample = SAMPLE_TITLES[index];
    onProgress?.({ completed: index, total: SAMPLE_TITLES.length, current: sample.title });

    try {
      const results = await searchTmdb(sample.title);
      const match =
        results.find((item) => item.mediaType === sample.type && item.title.toLowerCase() === sample.title.toLowerCase()) ??
        results.find((item) => item.mediaType === sample.type);

      if (!match) {
        skipped.push(sample.title);
        continue;
      }

      const detail = await getTmdbTitleDetail(match.tmdbId, match.mediaType);
      const entryId = await entryRepository.upsertEntry({
        title: detail,
        status: sample.status,
        rating: sample.rating,
        notes: sample.notes,
        tags: sample.tags,
        firstWatchedDate: sample.status === "watched" ? new Date().toISOString() : undefined
      });

      if (sample.status === "watched") {
        await entryRepository.addWatch(entryId, new Date().toISOString(), sample.rating, sample.notes);
      }

      if (sample.seedWatchedEpisodes) {
        for (let episode = 1; episode <= sample.seedWatchedEpisodes; episode += 1) {
          await entryRepository.setEpisodeProgress(entryId, 1, episode, true, new Date().toISOString());
        }
      }

      added.push(sample.title);
    } catch {
      skipped.push(sample.title);
    }
  }

  onProgress?.({ completed: SAMPLE_TITLES.length, total: SAMPLE_TITLES.length, current: "" });
  return { added, skipped };
}
