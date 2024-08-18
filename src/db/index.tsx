import Dexie, { Table } from "dexie";
import type { Note } from "./Note";
import type { Category } from "./Category";
import { sleep } from "../utils";
import { kv } from "../kv";
import { exportDB } from "dexie-export-import";

export interface Image {
  id: string;
  url: string;
}

export interface DbKv {
  id?: string
  value: any
}

export class MemoDB extends Dexie {
  // 'friends' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  notes!: Table<Note>;
  categories!: Table<Category>;
  images!: Table<Image>;
  kvs!: Table<DbKv>;

  constructor() {
    super("memo");
    this.version(1).stores({
      notes:
        "++id, updatedAt,categoryId,[categoryId+updatedAt], createdAt,trashedAt,topAt", // Primary key and indexed props
      categories: "++id, sort",
      images: "id, noteId",
      kvs: "id",
    });
  }

  async export() {
    await db.kvs.bulkPut([
      { id: "syncInfo", value: kv.syncInfo.get() },
      { id: "settings", value: kv.settings.get() },
    ]);
    return super.export()
  }
  async import(blob: Blob) {
    let ret = await super.import(blob);
    console.log("ret", ret);
    let syncInfo = await db.kvs.get("syncInfo");
    if (syncInfo) kv.syncInfo.set(syncInfo.value);
    let settings = await db.kvs.get("settings");
    if (settings) kv.settings.set(settings.value);
  }
  async clean(keepSettings: boolean) {
    await db.delete();
    kv.syncInfo.remove();
    kv.curFolder.remove();
    kv.folderCount.remove();
    if (!keepSettings) {
      kv.settings.remove();
    }
    kv.homeCache.remove();
    await db.open()
  };
}

export const db = new MemoDB();
db.open()
