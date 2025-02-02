import { CheckList, Dialog } from "antd-mobile";
import { useCallback, useEffect, useRef } from "react";
import { Category } from "../db/Category";
import { createHashHistory } from "history";
import { remoteDb, type NoteInfo } from "../sync/remote-db";
export const history = createHashHistory()
export function useScrollToLoadMore(cb: () => void, deps?: any[]) {
  let _cb = useEvent(cb)
  useEffect(() => {
    let last = 100;
    let handleScroll = () => {
      let now =
        document.body.scrollHeight - window.scrollY - window.innerHeight;
      if (now < 50 && last >= 50) {
        try {
          _cb();
        } catch (error) {
          console.error(error)
        }
      }
      last = now;
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, deps);
}
export function useEvent<T extends any[], R extends any>(
  cb: (...args: T) => R
): (...args: T) => R {
  let cbRef = useRef<(...args: T) => R>();
  cbRef.current = cb;
  return useCallback((...args: T) => {
    return cbRef.current?.(...args) as any;
  }, []);
}

export async function moveNote({
  notes,
  onMove,
  folders,
}: {
  notes: NoteInfo[];
  onMove?: () => void;
  folders?: string[];
}) {
  folders = folders ?? (await remoteDb.getFolders()) ?? [];
  Dialog.alert({
    content: (
      <CheckList
        defaultValue={notes.length === 1 ? [notes[0].folder] : []}
        onChange={(e) => {
          notes.forEach((n) => {
            remoteDb.moveNote(n, e[0].toString())
          })
          onMove?.();
          Dialog.clear();
        }}
      >
        {folders
          .map((c) => {
            return (
              <CheckList.Item key={c} value={c}>
                {c}
              </CheckList.Item>
            );
          })}
      </CheckList>
    ),
    closeOnMaskClick: true,
    confirmText: "取消",
  });
}
