// import dayjs from "dayjs";
// import { AuthType, createClient } from "webdav";
// import { db, Image } from "../db";
// import { Category } from "../db/Category";
// import { Note } from "../db/Note";
// import { kv, SyncInfo } from "../kv";
// import { sleep } from "../utils";
// import { remoteDb } from "./remote-db";

// export interface Note100 {
//   data: Exclude<Note, "content">[];
// }

// export interface NoteImages {
//   data: Image[];
// }

// db.notes.hook("updating", async (changes: any, id, n, t) => {
//   console.log('update.note', changes, id)
//   // if (!syncHelper.isSyncing) {
//   //   let now = Date.now()
//   //   changes["updatedAt"] = now
//   //   let newN = { ...n, ...changes };
//   //   console.log('update updated', changes, id, new Error().stack)
//   //   await t.table('notes').update(id, { updatedAt: now})
//   //   syncHelper.updateNoteSyncInfo(newN);
//   // }
// });

// class SyncHelper {
//   isSyncing = false;
//   updateNoteSyncInfo(note: Note) {
//     if (this.isSyncing === true) return;
//     if (!note.id) throw new Error(`invalid note.id`);
//     let id100 = Math.floor((note.id - 1) / 100) * 100 + 1;
//     let syncInfo = kv.syncInfo.get();
//     let syncState = syncInfo.notes[id100];
//     if (!syncState) {
//       syncState = syncInfo.notes[id100] = {
//         updatedAt: new Date(0).toISOString(),
//       };
//     }
//     syncState.updatedAt = dayjs(
//       Math.max(note.updatedAt, dayjs(syncState.updatedAt).valueOf())
//     ).toISOString();
//     kv.syncInfo.set(syncInfo);
//   }
//   updateCategorySyncInfo() {
//     let syncInfo = kv.syncInfo.get();
//     syncInfo.categories = syncInfo.categories || { updatedAt: "" };
//     syncInfo.categories.updatedAt = new Date().toISOString();
//     kv.syncInfo.set(syncInfo);
//   }
//   async sync() {
//     if (Date.now() - Number(localStorage.lock) > 3 * 1000) {
//       console.log("delete lock", localStorage.lock);
//       delete localStorage.lock;
//     }
//     if (localStorage.lock) return;
//     localStorage.lock = Date.now();
//     const client = remoteDb.client;
//     if (!client) return
//     const exists = await client?.exists("memo");
//     if (!exists) {
//       const created = await client?.createDirectory("memo");
//       console.log("created", created);
//     }

//     // 储存冲突笔记最后添加避免id冲突
//     const conflictNotes: Note[] = [];
//     // let lock = await client.lock("/memo");
//     // console.info("lock", lock);
//     try {
//       this.isSyncing = true;
//       await remoteDb.lock();
//       const now = Date.now();
//       const localSyncInfo = kv.syncInfo.get();
//       if (!localSyncInfo) return;
//       let remoteSyncInfo = await remoteDb.getSyncInfo();

//       for (const _id100Str in localSyncInfo.notes) {
//         const id100 = Number(_id100Str);
//         const s = localSyncInfo.notes[id100];
//         let rs = remoteSyncInfo.notes[id100];
//         if (id100 < 0 || id100 % 100 !== 1)
//           throw Error("invalid note id100:" + id100);
//         if (s.updatedAt === rs?.updatedAt) {
//           // 本地无更新且和服务端一致
//           continue;
//         } else if (
//           !rs ||
//           !s.syncedAt ||
//           new Date(s.updatedAt) >= new Date(s.syncedAt) // 包含更新时的update
//         ) {
//           // 本地有更新
//           const remoteNote100 = await remoteDb.getNote100(id100);
//           const remoteNote100Map = new Map(
//             remoteNote100.data.map((d) => [d.id, d])
//           );
//           const localNote100 = await db.notes
//             .where("id")
//             .between(id100, id100 + 100, true, false)
//             .toArray();
//           const localNote100Map = new Map(localNote100.map((n) => [n.id, n]));
//           async function updateRemoteNoteAndImages(n: Note, rn?: Note) {
//             n.syncedAt = now;
//             await db.notes.update(n.id!, { syncedAt: now });
//             remoteNote100Map.set(n.id!, n);
//             await remoteDb.updateRemoteImages(n, rn);
//           }
//           // 服务端无更新, 直接用本地覆盖服务端
//           if (!rs || s.syncedAt === rs.syncedAt) {
//             for (const n of localNote100) {
//               let rn = remoteNote100Map.get(n.id!);
//               if (!rn || n.updatedAt !== rn.updatedAt) {
//                 /*await*/ updateRemoteNoteAndImages(n, rn);
//               }
//             }
//           } else {
//             // 服务端有更新,
//             for (let i = id100; i < id100 + 100; i++) {
//               let n = localNote100Map.get(i); // 笔记一直存在，即使删除也有fake note 储存删除信息
//               let rn = remoteNote100Map.get(i);
//               if (
//                 n &&
//                 (!rn ||
//                   (rn.syncedAt === n.syncedAt && n.updatedAt > n.syncedAt!))
//               ) {
//                 // 服务端无更新且本地有更新, 直接覆盖服务端
//                 /*await*/ updateRemoteNoteAndImages(n, rn);
//               } else if (
//                 (rn && n && n.updatedAt === rn.updatedAt) ||
//                 (!n && !rn)
//               ) {
//                 // 本地和服务端一致，跳过
//                 continue;
//               } else if (
//                 rn &&
//                 (!n ||
//                   (n.syncedAt &&
//                     n.syncedAt < rn.syncedAt! &&
//                     n.updatedAt <= n.syncedAt))
//               ) {
//                 // 服务端有更新, 本地无笔记或者笔记上次更新后未修改，可以直接更新本地
//                 /*await*/ remoteDb.updateLocalNoteAndImages(rn, n);
//               } else if (
//                 rn &&
//                 n &&
//                 (!n.syncedAt ||
//                   (n.syncedAt < rn.syncedAt! && n.updatedAt > n.syncedAt))
//               ) {
//                 // 服务端有更新，本地有笔记且有未同步修改，以较新版为准，创建冲突笔记
//                 // final note, conflict note
//                 if (rn.updatedAt > n.updatedAt) {
//                   // 服务端更新直接覆盖本地
//                   /*await*/ remoteDb.updateLocalNoteAndImages(rn, n);
//                   conflictNotes.push(n);
//                 } else {
//                   // 本地更新同步到服务端
//                   /*await*/ updateRemoteNoteAndImages(n, rn);
//                   conflictNotes.push(rn);
//                 }
//                 // 储存冲突笔记放最后添加
//               }
//             }
//             s.updatedAt = new Date(
//               Math.max(
//                 new Date(s.updatedAt).getTime(),
//                 new Date(rs.updatedAt).getTime()
//               )
//             ).toISOString();
//           }
//           remoteNote100.data = Array.from(remoteNote100Map.values());
//           /*await*/ remoteDb.setNote100(id100, remoteNote100);
//           s.syncedAt = new Date(now).toISOString();
//           kv.syncInfo.set(localSyncInfo);
//           /*await*/ remoteDb.setSyncInfo(localSyncInfo);
//         } else if (
//           rs &&
//           new Date(s.syncedAt) < new Date(rs.syncedAt!) &&
//           new Date(s.updatedAt) < new Date(rs.updatedAt)
//         ) {
//           // 本地无更新，服务端有更新
//           const remoteNote100 = await remoteDb.getNote100(id100);
//           const localNote100 = await db.notes
//             .where("id")
//             .between(id100, id100 + 100, true, false)
//             .toArray();
//           const localNote100Map = new Map(localNote100.map((n) => [n.id, n]));
//           for (const rn of remoteNote100.data) {
//             let ln = localNote100Map.get(rn.id);
//             if (!ln || ln.updatedAt !== rn.updatedAt) {
//               /*await*/ remoteDb.updateLocalNoteAndImages(rn, ln);
//             }
//           }
//           s.updatedAt = rs.updatedAt;
//           s.syncedAt = rs.syncedAt;
//           kv.syncInfo.set(localSyncInfo);
//         }
//       }
//       // 更新服务端新增文件到本地
//       for (const _id100Str in remoteSyncInfo.notes) {
//         const id100 = Number(_id100Str);
//         if (!localSyncInfo.notes[_id100Str]) {
//           const remoteNote100 = await remoteDb.getNote100(id100);
//           const localNote100 = await db.notes
//             .where("id")
//             .between(id100, id100 + 100, true, false)
//             .toArray();
//           const localNote100Map = new Map(localNote100.map((n) => [n.id, n]));
//           for (const rn of remoteNote100.data) {
//             let ln = localNote100Map.get(rn.id);
//             if (!ln || ln.updatedAt !== rn.updatedAt) {
//               /*await*/ remoteDb.updateLocalNoteAndImages(rn, ln);
//             }
//           }
//           localSyncInfo.notes[_id100Str] = remoteSyncInfo.notes[_id100Str];
//           kv.syncInfo.set(localSyncInfo);
//         }
//       }
//       // 更新 categories
//       if (
//         remoteSyncInfo.categories?.updatedAt !==
//         localSyncInfo.categories?.updatedAt
//       ) {
//         let [lc, rc] = [localSyncInfo.categories, remoteSyncInfo.categories];
//         if (lc.updatedAt > rc.updatedAt) {
//           let cats = await db.categories.toArray();
//           /*await*/ remoteDb.setCategories(cats);
//           remoteSyncInfo.categories = lc;
//           /*await*/ remoteDb.setSyncInfo(remoteSyncInfo);
//         } else {
//           let rcats = await remoteDb.getCategories();
//           /*await*/ db.categories.bulkPut(rcats);
//           localSyncInfo.categories = lc;
//           kv.syncInfo.set(localSyncInfo);
//         }
//       }

//       this.isSyncing = false;
//       for (let cn of conflictNotes) {
//         delete cn.id;
//         cn.title = `[冲突_${dayjs().format("YYYY/MM/DD HH:mm:ss")}]${cn.title}`;
//         cn.createdAt = Date.now();
//         cn.updatedAt = Date.now();
//         cn.syncedAt = 0;
//         cn.id = (await db.notes.add(cn)) as number;
//         this.updateNoteSyncInfo(cn);
//       }
//     } catch (error) {
//       console.error(error);
//     } finally {
//       delete localStorage.lock;
//       await remoteDb.unlock();
//       this.isSyncing = false;
//       // await client.unlock("/memo", lock.token);
//       // 同步新创建的冲突笔记
//       if (conflictNotes.length) {
//         await this.sync();
//       }
//     }
//   }
// }

// export const syncHelper = new SyncHelper();
