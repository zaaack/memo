import {
  FolderAddOutlined,
  SettingOutlined,
  ToTopOutlined,
} from "@ant-design/icons";
import { cx } from "@emotion/css";
import {
  Button,
  CapsuleTabs,
  Card,
  Checkbox,
  CheckList,
  Dialog,
  FloatingBubble,
  SafeArea,
  SearchBar,
  TabBar,
} from "antd-mobile";
import {
  AddOutline,
  CheckOutline,
  CloseOutline,
  DeleteOutline,
  SetOutline,
} from "antd-mobile-icons";
import { CapsuleTab } from "antd-mobile/es/components/capsule-tabs/capsule-tabs";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useCallback, useEffect, useId, useState } from "react";
import { Link, useBeforeUnload } from "react-router-dom";
import { db, Image } from "../db";
import { Category } from "../db/Category";
import { Note } from "../db/Note";
import css from "./index.module.scss";
import { Cat, CatGroup } from "../lib/Cat";
import { NavBar } from "../lib/NavBar";
import { syncHelper } from "../sync/sync-helper";
import { imageToBlobURL, toText } from "../utils";
import {
  useLongPress,
  LongPressCallbackMeta,
  LongPressDetectEvents,
} from "use-long-press";
import { Header } from "./Header";
import { toColumnNotes, useCachedLiveQuery } from "./utils";
import { NoteCard } from "./NoteCard";
import { ActionBar, ActionBarItem } from "../lib/ActionBar";
import Dexie from "dexie";
import { kv } from "../kv";
import { isEmpty } from "../lib/is";
import { moveNote, useScrollToLoadMore } from "../lib/utils";

export interface Props {}
function Memo(props: Props) {
  const [curCatId, _setCatId] = useState(kv.curCatId.get(-1));
  let setCatId = (id: number) => {
    _setCatId(id);
    kv.curCatId.set(id);
    setLimit(30);
  };
  const categories = useCachedLiveQuery(
    "categories",
    () => {
      return db.categories.orderBy("sort").toArray();
    },
    { defaults: [] },
    []
  );
  useEffect(() => {
    if (
      categories?.some((c) => c.id === Category.all().id) &&
      curCatId === -1 &&
      isEmpty(kv.curCatId.get())
    ) {
      setCatId(categories[0].id!);
    }
  }, [categories]);
  const [limit, setLimit] = useState(30);
  const [search, setSearch] = useState("");
  const data = useCachedLiveQuery(
    "homeNotes",
    async () => {
      console.log("queryNotes", limit);
      console.time("notes");
      let notes: Note[] = [];
      let topNotes: Note[] = [];
      if (!search) {
        topNotes = await (
          await db.notes.where("topAt").above(0).reverse().toArray()
        ).filter((c) => (curCatId >= 0 ? c.categoryId === curCatId : true));
      }
      if (curCatId === -1 || search) {
        // notes = await Note.find(limit)
        notes = await db.notes
          .orderBy("updatedAt")
          .reverse()
          .filter((a) => {
            return (
              a.trashedAt === 0 &&
              (search ? toText(a.content).includes(search) : true)
            );
          })
          .limit(limit)
          .toArray();
      } else {
        console.log("curCatId", curCatId);
        // notes = await Note.find(limit, { catId:curCatId})
        notes = await db.notes
          .where("[categoryId+updatedAt]")
          .between(
            [curCatId, Dexie.minKey],
            [curCatId, Dexie.maxKey],
            true,
            true
          )
          .reverse()
          .filter((a) => a.trashedAt === 0)
          .limit(limit)
          .toArray();
      }
      notes = topNotes.concat(
        notes.filter((n) => !topNotes.some((t) => t.id === n.id))
      );
      console.timeEnd("notes");
      let noteImages = new Map<number, Image>(
        (
          await Promise.all(
            notes.map(async (n) => {
              let img = n.images[0] && (await db.images.get(n.images[0]));
              if (img) return [n, img];
              return null as any;
            })
          )
        ).filter(Boolean)
      );
      return { notes, noteImages };
    },
    {
      defaults: { notes: [], noteImages: new Map() },
      toCache(c) {
        return {
          notes: c.notes.slice(0, 30).map((n) => ({
            ...n,
            content: toText(n.content).slice(0, 80),
          })),
        };
      },
      fromCache(c) {
        return { notes: c.notes, noteImages: new Map() };
      },
    },
    [curCatId, limit, search]
  );
  useScrollToLoadMore(() => {
    console.log("loadmore");
    setLimit((l) => l + 30);
  });
  const [checkStates, setCheckStates] = useState<Map<number, Note>>(new Map());
  const [bulkEditMode, setBulkEditMode] = useState(false);
  let onLongPress = useCallback((e: any, meta: any) => {
    let n = meta.context as Note;
    setCheckStates(new Map([[n.id!, n]]));
    setBulkEditMode(true);
  }, []);
  let bindLongPress = useLongPress(onLongPress, {
    detect: LongPressDetectEvents.BOTH,
  });
  return (
    <div className={cx(css.root, search && css.search)}>
      <Header
        curCatId={curCatId}
        search={search}
        onCatChange={setCatId}
        onClearSearch={() => setSearch("")}
        onSearch={setSearch}
        categories={categories}
      />

      <div className={css.notes}>
        {toColumnNotes(data?.notes)?.map((n) => {
          const img = data?.noteImages.get(n.id!);
          return (
            <NoteCard
              bindLongPress={bindLongPress}
              bulkEditMode={bulkEditMode}
              note={n}
              img={img}
              search={search}
              key={n.id}
              checked={checkStates.has(n.id!)}
              onCheck={(e) => {
                if (e) {
                  checkStates.set(n.id!, n);
                } else {
                  checkStates.delete(n.id!);
                }
                setCheckStates(new Map(checkStates));
              }}
            />
          );
        })}
      </div>
      {location.search.includes("debug") && (
        <FloatingBubble
          onClick={async (e) => {
            let notes: Note[] = [];
            let i = 0;
            for (const iterator of Array(500)) {
              let n = Note.empty();
              n.content = `${i++}_天生我才必有用`.repeat(100);
              n.categoryId = Math.max(curCatId, 0);
              notes.push(n);
            }
            let ids = await db.notes.bulkAdd(notes);
            console.log("addNotes", notes, ids);
            notes = await db.notes.toArray();
            notes.forEach((n) => {
              syncHelper.updateNoteSyncInfo(n);
            });
          }}
          style={{
            "--initial-position-bottom": "74px",
            "--initial-position-right": "24px",
            // '--edge-distance': '24px',
          }}
        >
          <AddOutline fontSize={32} />
        </FloatingBubble>
      )}
      <Link
        to={`/note/new?catId=${Math.max(curCatId, 0)}`}
        state={{ catId: Math.max(curCatId, 0) }}
      >
        <FloatingBubble
          style={{
            "--initial-position-bottom": "24px",
            "--initial-position-right": "24px",
            // '--edge-distance': '24px',
          }}
        >
          <AddOutline fontSize={32} />
        </FloatingBubble>
      </Link>
      {bulkEditMode && (
        <ActionBar>
          <ActionBarItem
            icon={<CloseOutline />}
            text="取消"
            onClick={() => {
              setCheckStates(new Map());
              setBulkEditMode(false);
            }}
          />
          <ActionBarItem
            icon={<CheckOutline />}
            text="全选"
            checked={checkStates.size === data?.notes.length}
            onClick={() => {
              if (checkStates.size === data?.notes.length) {
                setCheckStates(new Map());
              } else {
                setCheckStates(new Map(data?.notes.map((n) => [n.id!, n])));
              }
            }}
          />
          <ActionBarItem
            icon={<ToTopOutlined />}
            text={
              checkStates.size &&
              Array.from(checkStates.values()).every((c) => c.topAt)
                ? "取消置顶"
                : "置顶"
            }
            onClick={() => {
              let notes = Array.from(checkStates.values());
              Note.toggleTop(notes);
              setBulkEditMode(false);
              setCheckStates(new Map());
            }}
          />
          <ActionBarItem
            icon={<FolderAddOutlined />}
            text="移动"
            onClick={() => {
              moveNote({
                notes: Array.from(checkStates.values()),
                categories,
                onMove() {
                  setCheckStates(new Map());
                  setBulkEditMode(false);
                },
              });
            }}
          />
          <ActionBarItem
            icon={<DeleteOutline />}
            text="删除"
            onClick={() => {
              let notes = Array.from(checkStates.values());
              Note.trash(notes);
              setBulkEditMode(false);
              setCheckStates(new Map());
            }}
          />
        </ActionBar>
      )}
    </div>
  );
}

export default Memo;
