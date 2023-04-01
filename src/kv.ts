import { Image } from "./db";
import { Note } from "./db/Note";
import { Field, Kv } from "./lib/kv";
// note_1-100.json
// note_101-200.json
// ...
// categories.json
// noteImages_<noteId>.json

export type SyncState = {
  updatedAt: string;
  syncedAt?: string;
}
export interface SyncInfo {
  notes: {[id100Str: string]:SyncState}
  categories: SyncState
}
export interface Settings {
  webdav: {
    url: string;
    user: string;
    pass: string;
  };
}
class MemoKv extends Kv {
  syncInfo = new Field<SyncInfo, SyncInfo>(this, "syncInfo", () => ({
    notes: {},
    categories: {
      updatedAt: new Date(0).toISOString(),
    }
  }));
  settings = new Field<Settings, Settings>(this, "settings", () =>({
    webdav: {
      url: "",
      user: "",
      pass: "",
    },
  }));
  folderCount = new Field(this, "folderCount", ()=>({} as { [k: number]: number }));
  curCatId = new Field<number>(this, "curCatId");
  homeCache = new Field<{
    [k: string]: any
  }, {
    [k: string]: any
  }>(this, "homeCache", ()=>({}));
}

export const kv = new MemoKv();
