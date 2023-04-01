import { Transaction } from "dexie";
import { db } from ".";
import { kv } from "../kv";

export interface Category {
  id?: number;
  title: string;
  sort: number;
}
class CategoryService {
  constructor() {
    const updateCount = async (catId: number, delta: number) => {
      let c = kv.folderCount.get({});
      if (typeof c[catId] !== "undefined") {
        c[catId] += delta;
      }
      if (typeof c[-1] !== "undefined") {
        c[-1] += delta;
      }
      kv.folderCount.set(c);
      // queue.push(async () => {
      //   let cat = await db.categories.get(catId);
      //   if (cat && cat.count >= 0) {
      //     await db.categories.update(catId, { count: cat.count + delta });
      //   }
      // });
      // t.on('complete', runQueue)
    };
    db.notes.hook("creating", (k, n, t) => {
      updateCount(n.categoryId, 1);
    });
    db.notes.hook("updating", (m: any, k, n, t) => {
      if ("trashedAt" in m) {
        if (m["trashedAt"] > 0 && n.trashedAt === 0) {
          updateCount(n.categoryId, -1);
          updateCount(-2, 1);
        } else if (m["trashedAt"] === 0 && n.trashedAt > 0) {
          updateCount(n.categoryId, 1);
          updateCount(-2, -1);
        }
      }
      if (
        "categoryId" in m &&
        m["categoryId"] !== n.categoryId &&
        n.trashedAt === 0
      ) {
        updateCount(n.categoryId, -1);
        updateCount(m["categoryId"], 1);
      }
    });
  }
  empty(): Category {
    return {
      sort: Number.MAX_SAFE_INTEGER,
      title: "",
      // count: -1,
    };
  }
  default() {
    let e = this.empty();
    e.id = 0;
    e.title = "未分类";
    return e;
  }
  all() {
    let e = this.empty();
    e.id = -1;
    e.title = "全部";
    return e;
  }
  addAllAndDefault(cats: Category[]) {
    let [hasAll, hasDefault] = [false, false];
    cats.forEach((c) => {
      if (c.id === Category.all().id) {
        hasAll = true;
      } else if (c.id === Category.default().id) {
        hasDefault = true;
      }
    });
    if (!hasAll) {
      cats = [Category.all(), ...cats];
      db.categories.put(Category.all());
    }
    if (!hasDefault) {
      cats = [...cats, Category.default()];
      db.categories.put(Category.default());
    }
    return cats;
  }
}

export const Category = new CategoryService();
