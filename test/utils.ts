import path from "path";
import "fake-indexeddb/auto";
import "mock-local-storage";
(global as any)["self"] = global;
import { v2 as webdav } from "webdav-server";
import assert from "node:assert/strict";
import Express from "express";
import { startWebdav } from "./start-webdav.js";
import { getProxyServer } from "../start-proxy.js";
import tp from "timekeeper";
import { fs } from "foy";
import { db } from "../src/db";
import Dexie from "dexie";
import { remoteDb } from "../src/sync/remote-db";
import { kv, SyncInfo } from "../src/kv";
import { sleep } from "../src/utils";
import { Note } from "../src/db/Note.js";

export type DBExport ={
  table: string
  rows: any[]
}[]
export async function exportDb(db: Dexie) {
  return db.transaction<DBExport>("r", db.tables, () => {
    return Promise.all(
      db.tables.map((table) =>
        table.toArray().then((rows) => ({ table: table.name, rows: rows }))
      )
    );
  });
}
export function importDb(data: DBExport, db: Dexie) {
  return db.transaction("rw", db.tables, () => {
    return Promise.all(
      data.map((t) =>
        db
          .table(t.table)
          .clear()
          .then(() => db.table(t.table).bulkAdd(t.rows))
      )
    );
  });
}
const remoteDir = "./test/store/temp";
// const vfs = new webdav.VirtualFileSystem()

const startDate = new Date(2023, 3, 9);
export function testBefore() {
  beforeAll(async () => {
    if (process.env.UPDATE_SNAPS) {
      await fs.rmrf("./test/snaps");
    }
    getProxyServer(3020);
  });
  let stopServer: () => any;
  beforeEach(async () => {
    console.log("beforeEach start");

    await fs.rmrf(remoteDir);
    await fs.mkdirp(remoteDir);
    stopServer = await startWebdav({
      port: 2300,
      dir: remoteDir,
    });
    await db.clean(true);
    kv.settings.set({
      webdav: { url: "http://127.0.0.1:2300", user: "user", pass: "user" },
    });
    remoteDb.proxyUrl = `http://127.0.0.1:3020/proxy`;
    remoteDb.updateConfig();
    console.log("beforeEach end");
    await sleep(20)
  });
  afterEach(async () => {
    // return new Promise((res) => server.close(res))
    return stopServer();
  });
}

export interface Snap {
  db: {
    table: string;
    rows: any[];
  }[];
  syncInfo: SyncInfo;
  remoteFiles: {
    [path: string]: any;
  };
}
type Asserts = {
  notesCount: number;
  imagesCount: number;
  remoteFilesCount: {
    [k: string]: number;
  };
};
export async function test(
  name: string,
  cb: (
    testSnap: (name: string, asserts?: Asserts) => Promise<Snap>
  ) => Promise<any>
) {
  it(name, async () => {
    let timeIncer = 1;
    let nameIncer = 1;
    let testSnap = async (name2: string, asserts?: Asserts) => {
      let snap: Snap = {
        db: await exportDb(db),
        syncInfo: kv.syncInfo.get(),
        remoteFiles: {} as { [path: string]: any },
      };
      const table = (name: string) => snap.db.find((t) => t.table === name)!;
      await fs.iter(remoteDir, async (file, stat) => {
        if (stat.isFile()) {
          snap.remoteFiles[path.relative(remoteDir, file)] = await fs.readJson(
            file
          );
        }
      });

      const replaceTime = (r:Note) => {
        for (const key in r) {
          const v = r[key];
          if (key.endsWith("At")) {
            r[key] = new Date(v).toISOString();
          }
        }
      }
      table('notes').rows.forEach(replaceTime);
      for (const k in snap.remoteFiles) {
          const d = snap.remoteFiles[k];
          if (k.includes('memo/note_')) {
            for (const n of d.data) {
              replaceTime(n)
            }
          }
      }
      const snapName = `${name}.${nameIncer++}_${name2}`
      const snapFile = `./test/snaps/${snapName}.snap.json`;
      const tempSnapFile = `./test/snaps/temp/${snapName}.snap.json`
      console.log("snap", snapName);
      if (process.env.UPDATE_SNAPS) {
        await fs.outputJson(snapFile, snap, {
          space: 2,
        });
      } else {
        await fs.outputJson(tempSnapFile, snap, {
          space: 2,
        });
        expect(
          JSON.parse(JSON.stringify(snap))).withContext(`${snapName}`).toEqual(await fs.readJson(snapFile),)
      }
      if (asserts) {
        expect(
          table("notes").rows.length).withContext(`${snapName}.db.notes.count`).toBe(asserts.notesCount,)
        expect(
          table("images").rows.length,).withContext(`${snapName}.db.images.count`).toBe(asserts.imagesCount)
        for (const k in asserts.remoteFilesCount) {
          expect(
            snap.remoteFiles[k].length).withContext(`${snapName}.${k}.count`).toBe(asserts.remoteFilesCount[k])
        }
      }
      tp.travel(new Date(startDate.getTime() + 60 * 1000 * timeIncer++));
      console.log("travel", new Date().toISOString());
      return snap;
    };
    tp.freeze(startDate);
    await cb(testSnap);
    await testSnap("end");
  });
}

{
  // mock Math.random
  let uid = 1;
  Math.random = () => {
    return 1/(++uid);
  };
}
export const FakeImg = '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">';
