import { create } from "zustand";
import { entryRepository, type EntryUpsertInput } from "../data/entryRepository";
import { getDiscoveryPick, pickFromWatchlist } from "../lib/recommendation";
import { getRegion } from "../lib/region";
import type {
  CustomListRecord,
  DiscoveryPick,
  EntryRecord,
  RandomFilter,
  RecommendationReasoning,
  WatchEntry
} from "../types/watch";

type AppTheme = "light" | "dark";

const THEME_STORAGE_KEY = "watchlist-theme";

function getInitialTheme(): AppTheme {
  if (typeof window === "undefined") return "dark";

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

interface WatchStore {
  entries: WatchEntry[];
  customLists: CustomListRecord[];
  tonight?: DiscoveryPick;
  tonightReasoning?: RecommendationReasoning;
  tonightLoading: boolean;
  tonightError?: string;
  recentSuggestionKeys: string[];
  shufflePick?: WatchEntry;
  shuffleReasoning?: RecommendationReasoning;
  recentShuffleIds: string[];
  randomFilter: RandomFilter;
  theme: AppTheme;
  load: () => Promise<void>;
  loadCustomLists: () => Promise<void>;
  upsertEntry: (input: EntryUpsertInput) => Promise<string>;
  updateEntry: (id: string, patch: Partial<EntryRecord>) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  addWatch: (entryId: string, watchedDate: string, ratingOverride?: number, notesOverride?: string) => Promise<void>;
  setEpisodeWatched: (entryId: string, season: number, episode: number, watched: boolean) => Promise<void>;
  importLibrary: (payload: Parameters<typeof entryRepository.importData>[0]) => Promise<void>;
  clearLibrary: () => Promise<void>;
  createCustomList: (name: string) => Promise<string>;
  assignListsToTitle: (titleId: string, listIds: string[]) => Promise<void>;
  setRandomFilter: (filter: Partial<RandomFilter>) => void;
  rerollTonight: () => Promise<void>;
  rerollShuffle: () => void;
  setTheme: (theme: AppTheme) => void;
}

const defaultFilter: RandomFilter = {
  type: "both",
  includeStatuses: ["want_to_watch", "watching"],
  genres: [],
  includeListIds: [],
  excludeListIds: []
};

export const useWatchStore = create<WatchStore>((set, get) => ({
  entries: [],
  customLists: [],
  tonight: undefined,
  tonightReasoning: undefined,
  tonightLoading: false,
  tonightError: undefined,
  recentSuggestionKeys: [],
  shufflePick: undefined,
  shuffleReasoning: undefined,
  recentShuffleIds: [],
  randomFilter: defaultFilter,
  theme: getInitialTheme(),

  async load() {
    const entries = await entryRepository.list();
    set({ entries });
  },

  async loadCustomLists() {
    const customLists = await entryRepository.listCustomLists();
    set({ customLists });
  },

  async upsertEntry(input) {
    const entryId = await entryRepository.upsertEntry(input);
    await get().load();
    return entryId;
  },

  async updateEntry(id, patch) {
    await entryRepository.updateEntry(id, patch);
    await get().load();
  },

  async removeEntry(id) {
    await entryRepository.removeEntry(id);
    await get().load();
  },

  async addWatch(entryId, watchedDate, ratingOverride, notesOverride) {
    await entryRepository.addWatch(entryId, watchedDate, ratingOverride, notesOverride);
    await get().load();
  },

  async setEpisodeWatched(entryId, season, episode, watched) {
    await entryRepository.setEpisodeProgress(entryId, season, episode, watched, watched ? new Date().toISOString() : undefined);
    await get().load();
  },

  async importLibrary(payload) {
    await entryRepository.importData(payload);
    await get().load();
    await get().loadCustomLists();
  },

  async clearLibrary() {
    await entryRepository.clear();
    set({
      entries: [],
      customLists: [],
      tonight: undefined,
      tonightReasoning: undefined,
      recentSuggestionKeys: [],
      shufflePick: undefined,
      shuffleReasoning: undefined,
      recentShuffleIds: []
    });
  },

  async createCustomList(name) {
    const listId = await entryRepository.createCustomList(name);
    await get().loadCustomLists();
    return listId;
  },

  async assignListsToTitle(titleId, listIds) {
    await entryRepository.assignListsToTitle(titleId, listIds);
    await get().load();
  },

  setRandomFilter(filter) {
    set((state) => ({
      randomFilter: {
        ...state.randomFilter,
        ...filter
      }
    }));
  },

  async rerollTonight() {
    const { entries, randomFilter, recentSuggestionKeys } = get();
    set({ tonightLoading: true, tonightError: undefined });
    try {
      const result = await getDiscoveryPick(entries, randomFilter.type, randomFilter.genres, recentSuggestionKeys, getRegion());
      set({
        tonight: result.pick,
        tonightReasoning: result.reasoning,
        recentSuggestionKeys: result.recentKeys,
        tonightLoading: false,
        tonightError: result.pick ? undefined : "Couldn't find anything trending that's available to stream in your region right now."
      });
    } catch (err) {
      set({ tonightLoading: false, tonightError: err instanceof Error ? err.message : "Something went wrong talking to TMDB." });
    }
  },

  rerollShuffle() {
    const { entries, randomFilter, recentShuffleIds } = get();
    const result = pickFromWatchlist(entries, randomFilter, recentShuffleIds);
    set({ shufflePick: result.pick, shuffleReasoning: result.reasoning, recentShuffleIds: result.recentIds });
  },

  setTheme(theme) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    set({ theme });
  }
}));
