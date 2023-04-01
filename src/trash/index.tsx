import {
  Button,
  CheckList,
  Dialog,
  Ellipsis,
  NoticeBar,
  TabBar,
} from "antd-mobile";
import { CloseOutline, DeleteOutline, UndoOutline } from "antd-mobile-icons";
import dayjs from "dayjs";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useState } from "react";
import { db } from "../db";
import { Note } from "../db/Note";
import { ActionBar, ActionBarItem } from "../lib/ActionBar";
import { NavBar } from "../lib/NavBar";
import { toText } from "../utils";
import { useScrollToLoadMore } from "../lib/utils";
import css from "./index.module.scss";
import { syncHelper } from "../sync/sync-helper";
export interface Props {}

export function Trash(props: Props) {
  const [limit, setLimit] = useState(500);
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);
  const notes = useLiveQuery(async () => {
    console.time("trashNotes");
    let notes = await db.notes
      .where("trashedAt")
      .above(0)
      .reverse()
      .and((x) => !x.removedAt)
      .limit(limit)
      .toArray();
    const now = Date.now();
    for (const n of notes) {
      if (now - n.trashedAt > 30 * 24 * 3600 * 1000) {
        await Note.remove([n])
      }
    }
    console.timeEnd("trashNotes");
    return notes;
  }, [limit]);
  useScrollToLoadMore(() => setLimit((l) => l + 100));
  return (
    <div>
      <NavBar
        right={
          !!selectedNotes.length && (
            <Button
              fill="none"
              onClick={(e) => {
                if (notes?.length === selectedNotes.length) {
                  setSelectedNotes([]);
                } else {
                  setSelectedNotes(notes || []);
                }
              }}
            >
              全选
            </Button>
          )
        }
      >
        回收站
      </NavBar>
      <NoticeBar content="回收站笔记将在30天后自动删除" color="alert" />
      <CheckList
        multiple
        value={selectedNotes.map((s) => String(s.id))}
        onChange={(v) => {
          let notesMap = new Map(notes?.map((n) => [n.id, n]));
          setSelectedNotes(
            v.map((i) => notesMap.get(Number(i))!).filter(Boolean)
          );
        }}
      >
        {notes?.map((n) => {
          return (
            <CheckList.Item key={n.id} value={String(n.id)}>
              <div className={css.title}>
                {n.title || toText(n.content).slice(0, 40)}
              </div>
              <div className={css.info}>
                删除于 {dayjs(n.trashedAt).format("YYYY/MM/DD HH:mm:ss")}
              </div>
            </CheckList.Item>
          );
        })}
      </CheckList>
      {!!selectedNotes.length && (
        <ActionBar>
          <ActionBarItem
            icon={<CloseOutline />}
            text="取消"
            onClick={() => {
              setSelectedNotes([]);
            }}
          />
          <ActionBarItem
            icon={<DeleteOutline />}
            text="删除"
            onClick={() => {
              Dialog.show({
                title: `确定要彻底删除这些笔记吗？该操作不可恢复`,
                closeOnAction: true,
                closeOnMaskClick: true,
                actions: [
                  [
                    {
                      text: "取消",
                      key: "cancel",
                    },
                    {
                      text: "删除",
                      bold: true,
                      key: "delete",
                      danger: true,
                      onClick() {
                        Note.remove(selectedNotes)
                        setSelectedNotes([]);
                      },
                    },
                  ],
                ],
              });
            }}
          />
          <ActionBarItem
            icon={<UndoOutline />}
            text="恢复"
            onClick={() => {
              Dialog.confirm({
                title: `确定要恢复这些笔记吗？`,
                confirmText: `恢复`,
                cancelText: `取消`,
                onConfirm() {
                  Note.untrash(selectedNotes)
                  setSelectedNotes([]);
                },
              });
            }}
          />
        </ActionBar>
      )}
    </div>
  );
}
