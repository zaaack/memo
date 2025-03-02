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
import { folderApi } from "./folder-api";
import { fileApi } from "./file-api";

export interface FolderMeta {
  locked: number;
  toped: string[];
}
export interface Meta {
  folderSort: string[];
}
export interface NoteInfo {
  folder: string;
  id: string;
  title: string;
  ctime: number
  lastmod: dayjs.Dayjs;
  toped?: boolean;
  cover?: string;
}
export interface Note extends NoteInfo {
  content: string;
}

class RemoteDB {
  // client?: WebDAVClient;
  constructor() {
  }
  async getFolders() {
    let meta = await this.getMeta()
    let folders = await folderApi.list()
    if (!folders) {
      throw new Error('fetch folders failed')
    }
    if (!folders.folders.some(f=>f.name === '默认')) {
      await folderApi.put('默认')
    }
    folders = await folderApi.list();
      return folders.folders
        ?.filter((f) => f.name !== ".trash")
        .sort((a, b) => {
          if (a.name === '默认') {
            return -1
          }
          return (
            meta.folderSort.indexOf(a.name) - meta.folderSort.indexOf(b.name)
          );
        })
        .map((f) => f.name);
  }
  async deleteFolder(folder: string) {
    let meta = await this.getMeta();
    meta.folderSort = meta.folderSort.filter((f) => f !== folder);
    await this.saveMeta(meta);
    await folderApi.delete(folder);
  }
  async addFolder(folder: string) {
    let meta = await this.getMeta();
    meta.folderSort.push(folder);
    await this.saveMeta(meta);
    await folderApi.put(folder);
  }
  async getNotes(folder: string) {
    let notes = await fileApi.list(folder)
    let meta = await this.getFolderMeta(folder);
    let n = notes.files
      ?.filter((f) => f.name.endsWith(".md"))
      .sort((a, b) => -a.mtime + b.mtime)
      .map<NoteInfo>((f) => {
        const [id, title] = f.name.replace(/\.\w+$/g, "").split("_");
        return {
          folder,
          id,
          title,
          ctime: f.ctime,
          lastmod: dayjs(f.mtime * 1000),
          toped: meta?.toped?.includes(id),
        };
      });
    console.log("notes", n);
    return n;
  }
  async getOrCreateNote(noteInfo: NoteInfo): Promise<Note | undefined> {
    if (!noteInfo.id) {
      return {
        ...noteInfo,
        id: dayjs().format("YYYYMMDDHHmmss"),
        content: "",
      };
    }
    let note = await fileApi.get({
      path: this.getNotePath(noteInfo),
    });
    if (!note) {
      return;
    }
    return {
      ...noteInfo,
      content: String(note),
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
    return `${note.folder}/assets/${note.id}`;
  }
  getImagePath(note: NoteInfo, fileName: string) {
    return `${this.getAssetsFolder(note)}/${fileName}`;
  }
  async saveImage(note: Note, file: File) {
    const fileName = file.name;
    if (
      await fileApi.put({
        path: this.getImagePath(note, fileName),
        image: file,
      })
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
    return `${note.folder}/${note.id}_${note.title}.md`;
  }
  async getMeta(): Promise<Meta> {
    try {
      let meta = await fileApi.getMeta()
      return meta;
    } catch(e) {
      console.error(e)
      return {
        folderSort: []
      }
    }
  }
  async saveMeta(meta: Meta) {
    await fileApi.setMeta(meta)
  }

  async getFolderMeta(folder: string): Promise<FolderMeta> {
    try {
      let meta = await fileApi.getMeta(folder)
      return meta;
    } catch (error) {
      console.error(error)
      return {
        locked:0,
        toped: [],
      }
    }
  }
  async saveFolderMeta(folder: string, meta: FolderMeta) {
    await fileApi.setMeta(meta, folder)
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
  async saveNote(note: Note, oldNote?: Note) {
    let meta = await this.getFolderMeta(note.folder);
    if (note.toped) {
      meta.toped.push(note.id);
      meta.toped = Array.from(new Set(meta.toped));
    } else {
      meta.toped = meta.toped.filter((id) => id !== note.id);
    }
    await this.aquireMetaLock(note.folder, meta);
    await this.saveNoteImages(note);
    if (oldNote) {
      await fileApi.rename(
        this.getNotePath(oldNote),
        this.getNotePath(note),
      ).catch(console.error);
    }
    const result = await fileApi.put({
      path: this.getNotePath(note),
      content: note.content,
    });
    await this.releaseMetaLock(note.folder, meta);
    return note;
  }
  async deleteNote(note: NoteInfo) {
    await fileApi.delete(this.getNotePath(note));
    await folderApi.delete(this.getAssetsFolder(note));
  }
  async trashNote(note: NoteInfo) {
    if (!note.id) return;
    let trashedNote = { ...note, folder: `.trash/${note.folder}` };
    await fileApi.rename(
      this.getNotePath(note),
      this.getNotePath(trashedNote),
    );
    await fileApi.rename(
      this.getAssetsFolder(note),
      this.getAssetsFolder(trashedNote)
    );
  }
  async restoreNote(trashedNote: NoteInfo) {
    let note = {
      ...trashedNote,
      folder: trashedNote.folder.replace(".trash/", ""),
    };
    await fileApi.rename(
      this.getNotePath(trashedNote),
      this.getNotePath(note)
    );
    await fileApi.rename(
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
    if (note.toped) {
      newMeta.toped.push(note.id);
    }
    await this.aquireMetaLock(folder, newMeta);

    let newNote = { ...note, folder };
    await fileApi.rename(
      this.getNotePath(note),
      this.getNotePath(newNote),
    );
    await fileApi.rename(
      this.getAssetsFolder(note),
      this.getAssetsFolder(newNote)
    );
    await this.releaseMetaLock(folder, newMeta);
  }
}

export const remoteDb = new RemoteDB();
