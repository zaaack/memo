import { useCallback, useEffect, useId, useState } from "react";
import { Note } from "../../db/Note";
import { kv } from "../../kv";
import { db } from "../../db";
import { useEvent } from "../../lib/utils";
import { useLiveQuery } from "dexie-react-hooks";
export { useLiveQuery } from "dexie-react-hooks";

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


// export function useLiveQuery<T>(_query: ()=> Promise<T>, deps?: any[], defaults?: T) {
//   let [data, setData] = useState<T | undefined>(defaults)
//   let updateData = useEvent(() => {
//     _query().then(d => {
//       setData(d)
//       console.log('queryData', d)
//     }).catch(console.error).finally(() => {
//       console.log('queryDataEnd')
//     })
//   })
//   useEffect(() => {
//     updateData()
//     let t: any
//     let onChange = () => {
//       t && clearTimeout(t)
//       t=setTimeout(() => {
//         updateData()
//       }, 600)
//     }
//     db.notes.hook.creating.subscribe(onChange)
//     db.notes.hook.updating.subscribe(onChange)
//     return () => {
//       db.notes.hook.creating.unsubscribe(onChange)
//       db.notes.hook.updating.unsubscribe(onChange)
//     }
//   }, deps || [])
//   console.log('useLiveQuery', data)
//   return data
// }

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
  defaults = cache[key] ? fromCache?.(cache[key]) ?? cache[key] : defaults
  let data = useLiveQuery<T, T>(
    query,
    deps || [],
    defaults
  ) || defaults;
  const saveCache = useEvent(() => {
    if (data) {
      let cache = kv.homeCache.get();
      cache[key] = toCache?.(data) ?? data;
      kv.homeCache.set(cache);
    }
  })
  useEffect(() => {
    window.addEventListener('beforeunload', saveCache)
    return () => {
      window.removeEventListener('beforeunload', saveCache)
    }
  }, [])
  return data;
}
