import axios from "axios";
import { AuthType, createClient, WebDAVClient, getPatcher } from "webdav";
import { db, Image } from "../db";
import { Category } from "../db/Category";
import { Note } from "../db/Note";
import { kv, Settings, SyncInfo } from "../kv";
import { sleep } from "../utils";
import { Note100, NoteImages } from "./sync-helper";
// getPatcher().patch('request', (opts: any) => {
//   console.log('patch')
//   return axios({...opts, timeout: 0})
// })
const WaitHack = 0
class RemoteDB {
  client: WebDAVClient;
  proxyUrl = process.env.NODE_ENV === "development"
  ? `http://127.0.0.1:3010/proxy`
  : "/proxy"
  constructor() {
    this.client = this.updateConfig();
  }
  updateConfig() {
    const conf = kv.settings.get().webdav;
    return (this.client = createClient(
      // `http://127.0.0.1:1900/`,
      conf.url ? `${this.proxyUrl}/${conf.url}` : "",
      // `http://127.0.0.1:3010/proxy/https://dav.jianguoyun.com/dav/`,
      {
        authType: AuthType.Password,
        username: conf.user,
        password: conf.pass,
        maxBodyLength: Number.MAX_SAFE_INTEGER,
        maxContentLength:Number.MAX_SAFE_INTEGER,
      }
    ));
  }
  async test() {
    try {
      await this.client.exists("/memo");
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
  private async _tryGetJson<T>(fn: string, defaults: T) {
    try {
      let rf = await this.client.getFileContents(fn, { format: "text" });
      await sleep(WaitHack);
      return JSON.parse(rf as string) as T;
    } catch (err) {
      return defaults;
    }
  }
  private async _putJson(file: string, data: any) {
    await this.client.putFileContents(
      file,
      JSON.stringify(data),
      { overwrite: true, contentLength: false, data: JSON.stringify(data), }
    );
  }
  note100Filename(id100: number) {
    if (id100 % 100 !== 1) throw new Error("invalid id100:" + id100);
    return `note_${id100}-${id100 + 100 - 1}.json`;
  }
  noteImagesFilename(id: number) {
    return `noteImages_${id}.json`;
  }
  async getSyncInfo() {
    return this._tryGetJson<SyncInfo>(`/memo/syncInfo.json`, {
      notes:{},
      categories: { updatedAt: new Date(0).toISOString() }
    });
  }
  async setSyncInfo(info: SyncInfo) {
    await this._putJson(
      `/memo/syncInfo.json`,
      info,
    );
    await sleep(WaitHack);
  }
  async getNoteImages(note: Note) {
    if (!note.images.length) return { data: [] }
    return this._tryGetJson<NoteImages>(
      "/memo/" + this.noteImagesFilename(note.id!),
      { data: [] }
    );
  }
  async getNote100(id100: number) {
    return this._tryGetJson<Note100>("/memo/" + this.note100Filename(id100), {
      data: [],
    });
  }
  async setNoteImages(id: number, ni: NoteImages) {
    if (!ni.data.length) {
      try {
        await this.client.deleteFile("/memo/" + this.noteImagesFilename(id))
      } catch (error:any) {
        if (!error.message.includes('404')) {
          console.error(error)
        }
      }
      return
    }
    await this._putJson(
      "/memo/" + this.noteImagesFilename(id),
      ni,
    );
    await sleep(WaitHack);
  }
  async setNote100(id100: number, note100: Note100) {
    await this._putJson(
      "/memo/" + this.note100Filename(id100),
      note100,
    );
    await sleep(WaitHack);
  }
  async setCategories(cats: Category[]) {
    await this._putJson(
      "/memo/categories.json",
      cats,
    );
    await sleep(WaitHack);
  }
  async getCategories() {
    return this._tryGetJson<Category[]>("/memo/categories.json", [])
  }
  async updateRemoteImages(ln: Note, rn?: Note) {
    if ((rn?.images || []).join(",") !== ln.images.join(",")) {
      let images = (
        await Promise.all(ln.images.map((i) => db.images.get(i)))
      ).filter<Image>(Boolean as any);
      let noteImages: NoteImages = {
        data: images,
      };
      await remoteDb.setNoteImages(ln.id!, noteImages);
    }
  }
  async updateLocalNoteAndImages(rn: Note, ln?: Note) {
    if (!ln) {
      let images = await remoteDb.getNoteImages(rn);
      await db.images.bulkAdd(images.data);
      await db.notes.add(rn);
    } else {
      await db.notes.update(rn.id!, rn);
      if (ln.images.join(",") !== rn.images.join(",")) {
        let images = await remoteDb.getNoteImages(rn);
        let localDeletes: string[] = [];
        let localAdds: Image[] = [];
        for (const imgId of ln.images) {
          if (!images.data.some((d) => d.id === imgId)) {
            localDeletes.push(imgId);
          }
        }
        for (const img of images.data) {
          if (!ln.images.some((id) => id === img.id)) {
            localAdds.push(img);
          }
        }
        await db.images.bulkDelete(localDeletes);
        await db.images.bulkAdd(localAdds);
      }
    }
  }
  async lock() {
    let lock = await this._tryGetJson("/memo/memo.lock", { timeout: 0 });
    if (!lock || Date.now() >= lock.timeout) {
      await this._putJson(
        "/memo/memo.lock",
        { timeout: Date.now() + 1 * 60 * 1000 },
      );
      await sleep(WaitHack);
    } else {
      throw new Error("memo sync is locked");
    }
  }
  async unlock() {
    await this._putJson(
      "/memo/memo.lock",
      { timeout: 0 },
    );
    await sleep(WaitHack);
  }
}

export const remoteDb = new RemoteDB();
