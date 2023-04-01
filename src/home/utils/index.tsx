import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useId } from "react";
import { useBeforeUnload } from "react-router-dom";
import { Note } from "../../db/Note";
import { kv } from "../../kv";

export function toColumnNotes(notes?: Note[]) {
  if (!notes) return null;
  return notes.reduce((acc, n, i, arr) => {
    if (i % 2 === 0) {
      acc[i / 2] = n;
    } else {
      acc[Math.ceil(arr.length / 2) + (i - 1) / 2] = n;
    }
    return acc;
  }, [] as Note[]);
}

export function useCachedLiveQuery<T, C>(
  key: string,
  query: () => Promise<T>,
  {
    toCache,
    fromCache,
    defaults,
  }: { toCache?: (d: T) => C; fromCache?: (c: C) => T; defaults: T },
  deps?: any[]
) {
  let cache = kv.homeCache.get();
  let data = useLiveQuery<T, T>(
    query,
    deps || [],
    cache[key] ? fromCache?.(cache[key]) ?? cache[key] : defaults
  );
  useBeforeUnload(
    useCallback(() => {
      if (data) {
        let cache = kv.homeCache.get();
        cache[key] = toCache?.(data) ?? data;
        kv.homeCache.set(cache);
      }
    }, [data])
  );
  return data;
}
