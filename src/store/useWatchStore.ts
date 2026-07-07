import { create } from "zustand";
import { entryRepository } from "../data/entryRepository";
import { pickTonight } from "../lib/recommendation";
import type { TonightFilter, WatchEntry } from "../types/watch";

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
  tonight?: WatchEntry;
  recentSuggestionIds: string[];
  tonightFilter: TonightFilter;
  theme: AppTheme;
  load: () => Promise<void>;
  addEntry: (entry: WatchEntry) => Promise<void>;
  updateEntry: (id: string, patch: Partial<WatchEntry>) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  importEntries: (entries: WatchEntry[]) => Promise<void>;
  clearLibrary: () => Promise<void>;
  setTonightFilter: (filter: Partial<TonightFilter>) => void;
  rerollTonight: () => void;
  setTheme: (theme: AppTheme) => void;
}

const defaultFilter: TonightFilter = {
  favoriteOnly: false,
  recommendedOnly: false
};

export const useWatchStore = create<WatchStore>((set, get) => ({
  entries: [],
  tonight: undefined,
  recentSuggestionIds: [],
  tonightFilter: defaultFilter,
  theme: getInitialTheme(),

  async load() {
    const entries = await entryRepository.list();
    set({ entries });
  },

  async addEntry(entry) {
    await entryRepository.create(entry);
    await get().load();
  },

  async updateEntry(id, patch) {
    await entryRepository.update(id, patch);
    await get().load();
  },

  async removeEntry(id) {
    await entryRepository.remove(id);
    await get().load();
  },

  async importEntries(entries) {
    await entryRepository.bulkUpsert(entries);
    await get().load();
  },

  async clearLibrary() {
    await entryRepository.clear();
    set({ entries: [], tonight: undefined, recentSuggestionIds: [] });
  },

  setTonightFilter(filter) {
    set((state) => ({
      tonightFilter: {
        ...state.tonightFilter,
        ...filter
      }
    }));
  },

  rerollTonight() {
    const { entries, tonightFilter, recentSuggestionIds } = get();
    const result = pickTonight(entries, tonightFilter, recentSuggestionIds);
    set({ tonight: result.pick, recentSuggestionIds: result.recentIds });
  },

  setTheme(theme) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    set({ theme });
  }
}));
