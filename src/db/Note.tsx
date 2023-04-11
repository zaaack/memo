import asyncReplace from "@egoist/async-replace";
import { db, Image } from ".";
import { syncHelper } from "../sync/sync-helper";
import { imageToBlobURL } from "../utils";
import { Category } from "./Category";

export interface Note {
  id?: number;
  categoryId: number;
  title: string;
  content: string;
  syncedAt: number;
  createdAt: number;
  updatedAt: number;
  trashedAt: number; // 放到回收站
  removedAt: number; //彻底删除
  topAt: number; // 置顶时间
  images: string[];
}

class NoteService {
  empty(partial?: Partial<Note>): Note {
    return {
      title: "",
      content: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      removedAt: 0,
      trashedAt: 0,
      syncedAt: 0,
      categoryId: 0,
      images: [],
      topAt: 0,
      ...partial,
    };
  }
  async getEditNote(
    id: string,
    catId = 0
  ): Promise<{
    note?: Note;
    title: string;
    content: string;
    cat?: Category;
    images: Image[];
  }> {
    if (id === "new") {
      return {
        note: Note.empty({
          categoryId: catId,
        }),
        title: "",
        content: "",
        cat: undefined,
        images: [],
      };
    }
    let note = await db.notes.get(Number(id));
    let cat: Category | undefined;
    let images: Image[] = [];
    let title = "";
    let content = "";
    if (note) {
      images = await db.images.where("noteId").equals(note.id!).toArray();
      // setContent(note.content)
      title = note.title;
      content = note.content.replace(
        /<custom-image\s+id="(\w+?)"\s*\/>/g,
        (_, id) => {
          let img: Image | undefined = images.find((i) => i.id === id);
          return `<div><img src="${imageToBlobURL(img)}" alt="${
            img?.id
          }" id="aaa" /></div>`;
        }
      );
      images.forEach((i) => (i.url = ""));
      console.timeEnd("setContent");
      cat = await db.categories.get(note.categoryId);
    }
    return { note, cat, images, title, content };
  }
  async saveEditNote(
    note: Note,
    {
      title,
      content,
      images: oldImages,
    }: { title: string; content: string; images: Image[] }
  ) {
    note.title = title;
    let newImages: string[] = [];
    note.content = await asyncReplace(
      content,
      /<img\s+src="([^>]+?)"(?:\s+alt="(\w+?)")?[^>]*?\/?>/g,
      async (_, url, id) => {
        if (url.startsWith("data:")) {
          let i = 10;
          while (i--) {
            try {
              id = Math.random().toString(36).slice(2);
              await db.images.add({ id, url }, id);
              break;
            } catch (error) {
              console.error(error);
            }
          }
        }
        newImages.push(id);
        return `<custom-image id="${id}" />`;
      }
    );
    if (oldImages) {
      for (const img of oldImages) {
        if (!newImages.includes(img.id!)) {
          await db.images.delete(img.id);
        }
      }
    }
    note.images = newImages;
    note.updatedAt = Date.now()
    if (note?.id) {
      await db.notes.put(note, note.id);
    } else {
      note.id = (await db.notes.add(note)) as number;
    }
    // NOTE: 由于 hook create 拿不到id, 添加必须手动更新 syncInfo
    // 测试时会手动设置id, 所以 put 也当 create
    syncHelper.updateNoteSyncInfo(note)
    return note
  }
  async trash(notes: Note[]) {
    // await db.notes.bulkPut(
    //   notes.map(n => {
    //     n.trashedAt = Date.now()
    //     return n
    //   })
    // )
    for (const n of notes) {
      n.trashedAt = n.updatedAt = Date.now()
      await db.notes.update(n.id!, n)
      syncHelper.updateNoteSyncInfo(n)
    }
  }
  async move(notes:Note[], catId: number) {
    await db.notes.bulkPut(notes.map(n => {
      n.categoryId = catId
      n.updatedAt = Date.now()
      syncHelper.updateNoteSyncInfo(n)
      return n
    }))
  }
  async toggleTop(notes:Note[]) {
    const isAllTop = notes.every((c) => c.topAt);
    db.notes.bulkPut(notes.map(n => {
      n.topAt = isAllTop ? 0 : Date.now()
      n.updatedAt = Date.now()
      syncHelper.updateNoteSyncInfo(n)
      return n
    }))
  }
  async untrash(notes: Note[]) {
    await db.notes.bulkPut(notes.map(n => {
      n.trashedAt = 0
      n.updatedAt = Date.now()
      syncHelper.updateNoteSyncInfo(n)
      return n
    }))
  }
  async remove(selectedNotes: Note[]) {
    await db.notes.bulkPut(
      selectedNotes.map((n) => {
        n.removedAt = Date.now();
        n.content = "";
        n.title = "";
        n.images = []
        n.updatedAt = Date.now()
        syncHelper.updateNoteSyncInfo(n)
        return n;
      })
    );

    await db.images.bulkDelete(
      ([] as string[]).concat(...selectedNotes.map((s) => s.images))
    );
  }
}

export const Note = new NoteService();
