import { CheckList, Dialog } from "antd-mobile";
import { useCallback, useEffect, useRef } from "react";
import { db, Image } from "../db";
import { Category } from "../db/Category";
import { Note } from "../db/Note";
import { syncHelper } from "../sync/sync-helper";

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
  categories,
}: {
  notes: Note[];
  onMove?: () => void;
  categories?: Category[];
}) {
  categories = categories || (await db.categories.orderBy("sort").toArray());
  Dialog.alert({
    content: (
      <CheckList
        defaultValue={notes.length === 1 ? [notes[0].categoryId + ""] : void 0}
        onChange={(e) => {
          if (isNaN(Number(e[0]))) {
            console.error('invalid move to cat id:'+e)
            return
          }
          Note.move(notes, Number(e[0]))
          onMove?.();
          Dialog.clear();
        }}
      >
        {categories
          .filter((c) => c.id! >= 0)
          .map((c) => {
            return (
              <CheckList.Item key={String(c.id)} value={String(c.id)}>
                {c.title}
              </CheckList.Item>
            );
          })}
      </CheckList>
    ),
    closeOnMaskClick: true,
    confirmText: "取消",
  });
}
