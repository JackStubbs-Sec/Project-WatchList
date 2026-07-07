import { db } from "./db";
import type { WatchEntry } from "../types/watch";

export const entryRepository = {
  async list(): Promise<WatchEntry[]> {
    return db.entries.orderBy("updatedAt").reverse().toArray();
  },

  async create(entry: WatchEntry): Promise<void> {
    await db.entries.put(entry);
  },

  async update(id: string, patch: Partial<WatchEntry>): Promise<void> {
    await db.entries.update(id, patch);
  },

  async remove(id: string): Promise<void> {
    await db.entries.delete(id);
  },

  async bulkUpsert(entries: WatchEntry[]): Promise<void> {
    await db.entries.bulkPut(entries);
  },

  async clear(): Promise<void> {
    await db.entries.clear();
  }
};
