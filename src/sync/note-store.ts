import type { Note, NoteInfo } from "./remote-db";

export interface NoteStore {
  getFolders(): Promise<string[]>;
  deleteFolder(path: string): Promise<void>;
  addFolder(path: string): Promise<void>;
  getNotes(path: string): Promise<NoteInfo[]>;
  getOrCreateNote(noteInfo: NoteInfo): Promise<Note>;

}
