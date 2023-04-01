import { exportDb, importDb, FakeImg, test, testBefore } from "./utils";
import { Note } from "../src/db/Note";
import assert from "node:assert/strict";
import { syncHelper } from "../src/sync/sync-helper";
import { db, Image } from "../src/db";
import { kv } from "../src/kv";
import { sleep } from "../src/utils";
import { fs } from "foy";
import tp from 'timekeeper'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 2147483646;

describe("sync", () => {
  testBefore();
  async function putNote(id: number, { title,content }:{title?: string, content?: string} ={}) {
    tp.travel(Date.now() + 1)
    let n = await db.notes.get(id) || {...Note.empty(), id}
    let images = await (await db.images.bulkGet(n.images)).filter(Boolean) as Image[]
    await Note.saveEditNote(
      n,
      {
        title: title || `test${id}`,
        content: content || `test${id}c${FakeImg}|$${FakeImg}`,
        images,
      }
    );
  }
  async function sync() {
    tp.travel(Date.now() + 1)
    return syncHelper.sync();
  }
  test("sync_multi", async function (snap) {
    await putNote(1);
    await putNote(100);
    await putNote(101);
    await sync();
  });

  test("sync", async (testSnap) => {
    await putNote(1);
    await sync();
    let snap = await testSnap("add1");
    assert.equal(snap.db[0].rows.length, 1, "add1 notes length");

    await putNote(100);
    await sync();
    snap = await testSnap("add2");
    assert.equal(snap.db[0].rows.length, 2, "add2 notes length");

    await putNote(101);
    await sync();
    await testSnap("add3");

    await putNote(100, {
      title: "test100_changed",
      content: "test100_changed_content",
    });
    await sync();
    await testSnap("updated");

    await Note.trash([(await db.notes.get(101))!]);
    await sync();
    await testSnap("trashed");

    await Note.remove([(await db.notes.get(101))!]);
    await sync();
    await testSnap("removed");

    await db.clean(true);
    await sync();
    await testSnap("restore");
  });
  test("sync_much", async function (snap) {
    let id = 0;
    for (const i of Array(300)) {
      id++;
      await putNote(id,
        {
          title: `test${id}`,
          content: `test${id}c`,
        }
      );
    }
    await sync();
    await snap("upload");

    await db.clean(true);
    await sync();
    await snap("restore");
  });
  let _state: any
    async function backup() {
      let dbe = await exportDb(db)
      let si = kv.syncInfo.get()
      _state = { dbe, si }
    }
    async function restore() {
      await importDb(_state.dbe, db)
      kv.syncInfo.set(_state.si)
      _state=null
    }
  test("conflict", async (testSnap) => {

    await putNote(1);
    await putNote(100);
    await sync();
    await testSnap("init");
    await backup()
    await putNote(101);
    await sync(); // sync old note101 to server
    await restore(); // goto exports
    await putNote(101); // add new note101
    tp.travel(Date.now() + 1) // 同步conflict笔记必须加上延迟确保updatedAt 增加
    await sync();
    await testSnap("conflict_add"); // conflict add 101

    await backup()
    await putNote(100, {
      title: "updated",
      content: `updated${FakeImg}`,
    });
    await sync();
    console.log('updated', await db.notes.get(100))
    await restore()
    await putNote(100, {
      title: "updated2",
      content: `updated2${FakeImg}`,
    });
    console.log('updated2', await db.notes.get(100))
    await sync(); // conflict 100
    await testSnap("conflict_update"); // conflict add 101
  });
});
