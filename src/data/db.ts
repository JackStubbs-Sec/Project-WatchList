import Dexie, { type EntityTable } from "dexie";
import type { WatchEntry } from "../types/watch";

export class WatchListDb extends Dexie {
  entries!: EntityTable<WatchEntry, "id">;

  constructor() {
    super("watchlist-db");
    this.version(1).stores({
      entries: "id, title, status, type, genre, updatedAt, createdAt"
    });
  }
}

export const db = new WatchListDb();
