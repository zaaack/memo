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
  CenterPopup,
  Checkbox,
  CheckList,
  Dialog,
  FloatingBubble,
  Loading,
  SafeArea,
  SearchBar,
  Space,
  TabBar,
} from "antd-mobile";
import {
  AddOutline,
  CheckOutline,
  CloseOutline,
  DeleteOutline,
  SetOutline,
} from "antd-mobile-icons";
import React, { useCallback, useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import css from "./index.module.scss";
import { useLongPress, LongPressDetectEvents } from "use-long-press";
import { Header } from "./Header";
import { toColumnNotes } from "./utils";
import { NoteCard } from "./NoteCard";
import { ActionBar, ActionBarItem } from "../components/ActionBar";
import { kv } from "../utils/kv";
import { isEmpty } from "../utils/is";
import { moveNote, useScrollToLoadMore } from "../utils/utils";
import { useQuery } from "../utils/hooks";
import { remoteDb, type Note, type NoteInfo } from "../sync/remote-db";
import LoadingPage from "../components/LoadingPage";

export interface Props {}
function Memo(props: Props) {
  const [curFolder, _curFolder] = useState(kv.curFolder.get("默认"));
  let setCurFolder = (f: string) => {
    _curFolder(f);
    kv.curFolder.set(f);
    // setLimit(30);
  };
  const folders = useQuery(() => {
    return remoteDb.getFolders();
  }, []);
  const [search, setSearch] = useState("");
  const notes = useQuery(async () => {
    console.time("notes");
    let notes: NoteInfo[] = (await remoteDb.getNotes(curFolder)) || [];
    let topNotes: NoteInfo[] = notes.filter((n) => n.toped);
    notes = topNotes.concat(notes.filter((n) => !n.toped));
    await Promise.all(
      notes.map(async (n) => {
        // n.cover = await remoteDb.getNoteCover(n);
        return n;
      })
    );
    console.timeEnd("notes");
    console.log("notes", notes.length);
    return notes;
  }, [curFolder, search]);
  console.log("data", notes.data);
  useScrollToLoadMore(() => {
    console.log("loadmore");
    // setLimit((l) => l + 30);
  });
  const [checkStates, setCheckStates] = useState<Map<number, NoteInfo>>(
    new Map()
  );
  const [bulkEditMode, setBulkEditMode] = useState(false);
  let onLongPress = useCallback((e: any, meta: any) => {
    let n = meta.context as Note;
    setCheckStates(new Map([[n.id!, n]]));
    setBulkEditMode(true);
  }, []);
  let bindLongPress = useLongPress(onLongPress, {
    detect: LongPressDetectEvents.BOTH,
  });

  if (folders.isLoading) {
    return <LoadingPage />;
  }
  return (
    <div className={cx(css.root, search && css.search)}>
      <Header
        curFolder={curFolder}
        search={search}
        onFolderChange={setCurFolder}
        onClearSearch={() => setSearch("")}
        onSearch={setSearch}
        folders={folders.data || []}
      />

      <div
        className={css.notes}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        {toColumnNotes(notes.data || [])?.map((n) => {
          return (
            <NoteCard
              bindLongPress={bindLongPress}
              bulkEditMode={bulkEditMode}
              note={n}
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
      <Link to={`/note/${curFolder}/新笔记`}>
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
            checked={checkStates.size === notes.data?.length}
            onClick={() => {
              if (checkStates.size === notes.data?.length) {
                setCheckStates(new Map());
              } else {
                setCheckStates(new Map(notes.data?.map((n) => [n.id!, n])));
              }
            }}
          />
          <ActionBarItem
            icon={<ToTopOutlined />}
            text={
              checkStates.size &&
              Array.from(checkStates.values()).every((c) => c.toped)
                ? "取消置顶"
                : "置顶"
            }
            onClick={async () => {
              let checkedNotes = Array.from(checkStates.values());
              let meta = await remoteDb.getFolderMeta(curFolder);
              if (meta) {
                meta.toped = meta.toped.filter(
                  (id) => !checkedNotes.some((n) => n.id === id)
                );
                if (checkedNotes.some((n) => !n.toped)) {
                  meta.toped.push(...checkedNotes.map((n) => n.id!));
                }
                remoteDb.saveFolderMeta(curFolder, meta).then(() => {
                  notes.invalid();
                });
              }
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
                folders: folders.data || [],
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
            onClick={async () => {
              let ns = Array.from(checkStates.values());
              Promise.all(ns.map((n) => remoteDb.trashNote(n))).finally(() => notes.invalid());
              setBulkEditMode(false);
              setCheckStates(new Map())
            }}
          />
        </ActionBar>
      )}
    </div>
  );
}

export default Memo;
