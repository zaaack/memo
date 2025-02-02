import axios from "axios";
import {
  AuthType,
  createClient,
  WebDAVClient,
  getPatcher,
  type BufferLike,
} from "webdav";
import { kv, Settings, SyncInfo } from "../utils/kv";
import { imageToBlobURL, sleep } from "../utils";
import dayjs from "dayjs";
import asyncReplace from "@egoist/async-replace";

export interface FolderMeta {
  id: number;
  locked: number;
  toped: number[];
}
export interface Meta {
  folderSort: string[];
}
export interface NoteInfo {
  folder: string;
  id: number;
  title: string;
  lastmod: dayjs.Dayjs;
  toped?: boolean;
  cover?: string;
}
export interface Note extends NoteInfo {
  content: string;
}

class RemoteDB {
  client?: WebDAVClient;
  proxyUrl =
    process.env.NODE_ENV === "development"
      ? `http://127.0.0.1:3000/api/proxy/`
      : "plus" in window || "_cordovaNative" in window
      ? ""
      : "/api/proxy/";
  constructor() {
    this.client = this.updateConfig();
  }
  private basePath = "WebdavMemo";
  updateConfig() {
    const conf = kv.settings.get().webdav;
    if (!conf) {
      return;
    }
    let client = (this.client = createClient(
      // `http://127.0.0.1:1900/`,
      conf.url ? `${this.proxyUrl}${conf.url}` : "https://www.example.com",
      // `http://127.0.0.1:3010/proxy/https://dav.jianguoyun.com/dav/`,
      {
        authType: AuthType.Password,
        username: conf.user,
        password: conf.pass,
        maxBodyLength: Number.MAX_SAFE_INTEGER,
        maxContentLength: Number.MAX_SAFE_INTEGER,
      }
    ));
    client
      .exists(this.basePath)
      .then(async (exists) => {
        if (!exists) {
          client.createDirectory(this.basePath);
          this.addFolder("默认");
        }
      })
      .catch(console.error);
    return client;
  }
  async test() {
    try {
      await this.client?.exists(this.basePath);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
  async getFolders() {
    let folders = await this.client?.getDirectoryContents(this.basePath);
    if (!Array.isArray(folders)) {
      folders = folders?.data;
    }
    if (!folders) {
      throw new Error('fetch folders failed')
    }
      return folders
        ?.filter(
          (f) =>
            f.type === "directory" &&
            f.basename !== ".trash" &&
            f.basename !== this.basePath
        )
        .sort((a, b) => -Date.parse(a.lastmod) + Date.parse(b.lastmod))
        .map((f) => f.basename);
  }
  async deleteFolder(folder: string) {
    let meta = await this.getMeta();
    meta.folderSort = meta.folderSort.filter((f) => f !== folder);
    await this.saveMeta(meta);
    await this.client?.deleteFile(`${this.basePath}/${folder}`);
  }
  async addFolder(folder: string) {
    let meta = await this.getMeta();
    meta.folderSort.push(folder);
    await this.saveMeta(meta);
    await this.client?.createDirectory(`${this.basePath}/${folder}`);
  }
  async getNotes(folder: string) {
    let notes = await this.client?.getDirectoryContents(
      `${this.basePath}/${folder}`
    );
    let meta = await this.getFolderMeta(folder);
    if (!Array.isArray(notes)) {
      notes = notes?.data;
    }
    let n = notes
      ?.filter((f) => f.type === "file" && f.filename.endsWith(".md"))
      .sort((a, b) => -Date.parse(a.lastmod) + Date.parse(b.lastmod))
      .map<NoteInfo>((f) => {
        let [id, titleWithExt] = f.basename.split("_", 2);
        return {
          folder,
          id: Number(id),
          title: titleWithExt.replace(/\.\w+$/g, ""),
          lastmod: dayjs(f.lastmod),
          toped: meta?.toped?.includes(Number(id)),
        };
      });
    console.log("notes", n);
    return n;
  }
  async getOrCreateNote(noteInfo: NoteInfo): Promise<Note | undefined> {
    if (!noteInfo.id) {
      return {
        ...noteInfo,
        content: "",
      };
    }
    let note = await this.client?.getFileContents(
      `${this.basePath}/${noteInfo.folder}/${noteInfo.id}_${noteInfo.title}.md`,
      {
        format: "text",
      }
    );
    if (!note) {
      return;
    }
    note = note.toString();
    return {
      ...noteInfo,
      content: note,
    };
  }
  async getNoteCover(note: NoteInfo) {
    try {
      // let imagesFolder = this.getAssetsFolder(note);
      // let images = await this.client?.getDirectoryContents(imagesFolder);
      // if (!Array.isArray(images)) {
      //   images = images?.data;
      // }
      // let imgInfo = images?.filter(
      //   (f) => f.type === "file" && f.filename.endsWith(".png")
      // )[0];
      // if (imgInfo) {
      //   let img = await this.client?.getFileContents(imgInfo.filename, {
      //     format: "binary",
      //   });
      //   return imageToBlobURL(imgInfo.filename, img as BufferLike);
      // }
    } catch (e) {
      return;
    }
  }
  getAssetsFolder(note: NoteInfo) {
    return `${this.basePath}/${note.folder}/assets`;
  }
  getImagePath(note: NoteInfo, fileName: string) {
    return `${this.getAssetsFolder(note)}/${fileName}`;
  }
  private async _getOrCreateJson<T = any>(url: string, data?: T) {
    if (await this.client?.exists(url)) {
      const result = await this.client?.getFileContents(url, {
        format: "text",
      });
      return result ? (JSON.parse(result.toString()) as T) : void 0;
    }
    if (data) {
      if (await this.client?.putFileContents(url, JSON.stringify(data))) {
        return data;
      }
    }
    return null;
  }
  async saveImage(note: Note, file: File) {
    const imagesFolder = this.getAssetsFolder(note);
    if (!(await this.client?.exists(imagesFolder))) {
      await this.client?.createDirectory(imagesFolder);
    }
    const fileName = file.name;
    const filePath = `${imagesFolder}/${fileName}`;
    if (
      await this.client?.putFileContents(filePath, await file.arrayBuffer())
    ) {
      return this.getImagePath(note, fileName);
    }
    return null;
  }
  async restoreNoteImages(note: Note) {
    // note.content = await asyncReplace(
    //   note.content,
    //   /<custom-image\s+src="(\w+?)"\s*\/>/g,
    //   async (_, src) => {
    //     let url = `${this.basePath}/${note.folder}/${src}`;
    //     let img = await this.client?.getFileContents(url, {
    //       format: "binary",
    //     });
    //     return `<img src="${imageToBlobURL(
    //       url,
    //       (img as BufferLike).toString("base64url")
    //     )}" />`;
    //   }
    // );
    return note;
  }
  async saveNoteImages(note: Note) {
    // note.content = await asyncReplace(
    //   note.content,
    //   /<img\s+src="([^>]+?)"[^>]*?\/?>/g,
    //   async (_, url) => {
    //     if (url.startsWith("data:")) {
    //       try {
    //         url = await this.saveImage(
    //           note,
    //           new File([url], Math.random().toString(36).slice(2) + ".png")
    //         );
    //       } catch (error) {
    //         console.error(error);
    //       }
    //     }
    //     return `<custom-image src="${url}" />`;
    //   }
    // );
  }
  getNotePath(note: NoteInfo) {
    return `${this.basePath}/${note.folder}/${note.id}_${note.title}.md`;
  }
  async getMeta() {
    const metaFile = `${this.basePath}/meta.json`;
    let meta = await this._getOrCreateJson<Meta>(metaFile, {
      folderSort: (await this.getFolders()) || [],
    });
    if (!meta) {
      throw new Error("get meta file error");
    }
    return meta;
  }
  async saveMeta(meta: Meta) {
    const metaFile = `${this.basePath}/meta.json`;
    await this.client?.putFileContents(metaFile, JSON.stringify(meta));
  }

  async getFolderMeta(folder: string) {
    const metaFile = `${this.basePath}/${folder}/meta.json`;
    let meta = await this._getOrCreateJson<FolderMeta>(metaFile, {
      id: 0,
      locked: 0,
      toped: [],
    });
    if (!meta) {
      throw new Error("get meta file error");
    }
    return meta;
  }
  async saveFolderMeta(folder: string, meta: FolderMeta) {
    const metaFile = `${this.basePath}/${folder}/meta.json`;
    await this.client?.putFileContents(metaFile, JSON.stringify(meta));
  }
  async aquireMetaLock(folder: string, meta: FolderMeta) {
    if (Date.now() - meta.locked < 1000 * 60 * 1) {
      throw new Error("locked, plz try after 1 minutes");
    }
    meta.locked = Date.now();
    await this.saveFolderMeta(folder, meta);
  }
  async releaseMetaLock(folder: string, meta: FolderMeta) {
    meta.locked = 0;
    await this.saveFolderMeta(folder, meta);
  }
  async saveNote(note: Note) {
    let meta = await this.getFolderMeta(note.folder);
    if (!note.id) {
      note.id = ++meta.id;
    }
    if (note.toped) {
      meta.toped.push(note.id);
      meta.toped = Array.from(new Set(meta.toped));
    } else {
      meta.toped = meta.toped.filter((id) => id !== note.id);
    }
    await this.aquireMetaLock(note.folder, meta);
    await this.saveNoteImages(note);
    const result = await this.client?.putFileContents(
      this.getNotePath(note),
      note.content,
      {
        overwrite: true,
      }
    );
    await this.releaseMetaLock(note.folder, meta);
    return note;
  }
  async deleteNote(note: NoteInfo) {
    await this.client?.deleteFile(this.getNotePath(note));
    await this.client?.deleteFile(
      `${this.basePath}/${note.folder}/${note.id}_images`
    );
  }
  async trashNote(note: NoteInfo) {
    if (!note.id) return;
    let trashedNote = { ...note, folder: `.trash/${note.folder}` };
    await this.client?.moveFile(
      this.getNotePath(note),
      this.getNotePath(trashedNote)
    );
    await this.client?.moveFile(
      this.getAssetsFolder(note),
      this.getAssetsFolder(trashedNote)
    );
  }
  async restoreNote(trashedNote: NoteInfo) {
    let note = {
      ...trashedNote,
      folder: trashedNote.folder.replace(".trash/", ""),
    };
    await this.client?.moveFile(
      this.getNotePath(trashedNote),
      this.getNotePath(note)
    );
    await this.client?.moveFile(
      this.getAssetsFolder(trashedNote),
      this.getAssetsFolder(note)
    );
  }
  async moveNote(note: NoteInfo, folder: string) {
    let meta = await this.getFolderMeta(note.folder);
    note.toped = meta?.toped?.includes(note.id);
    if (meta) {
      meta.toped = meta.toped.filter((id) => id !== note.id);
      await this.saveFolderMeta(note.folder, meta);
    }
    let newMeta = await this.getFolderMeta(folder);
    note.id = ++newMeta.id;
    if (note.toped) {
      newMeta.toped.push(note.id);
    }
    await this.aquireMetaLock(folder, newMeta);

    let newNote = { ...note, folder };
    await this.client?.moveFile(
      this.getNotePath(note),

      this.getNotePath(newNote)
    );
    await this.client?.moveFile(
      this.getAssetsFolder(note),
      this.getAssetsFolder(newNote)
    );
    await this.releaseMetaLock(folder, newMeta);
  }
}

export const remoteDb = new RemoteDB();
