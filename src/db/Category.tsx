import { kv } from "../utils/kv";

export interface Category {
  id?: number;
  title: string;
  sort: number;
}
class CategoryService {
  constructor() {
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
    }
    if (!hasDefault) {
      cats = [...cats, Category.default()];
    }
    return cats;
  }
}

export const Category = new CategoryService();
