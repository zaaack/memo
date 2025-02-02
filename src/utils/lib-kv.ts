import { defaults as _defaults } from "./defaults";

export interface KvOptions {
  expire?: number;
}

/**
 * 基于 localStorage 的本地存储封装类
 * - try/catch 包裹 localStorage
 * - get 时支持设置默认值
 * - set/get 时自动使用 JSON 编解码
 * - 友好的类型支持
 *
 * @example
 * ```ts
 * type UserInfo = { id: string, name: string }
 * class MyStore extends Kv {
 *   userInfo = new Field<UserInfo>(this, 'userInfo')
 * }
 * const ms = new MyStore()
 * const userInfo = ms.userInfo.get()
 * userInfo.name = 'aa'
 * ms.userInfo.set(userInfo)
 * ms.userInfo.remove()
 * ```
 */
export class Kv {
  private _cache = new Map();
  get<T = any>(key: string): T | undefined;
  get<T = any>(key: string, defaults: T): T;
  get<T = any>(key: string, defaults?: T): T | undefined {
    try {
      let store = this._cache.get(key);
      if (!store) {
        store = localStorage.getItem(key);
        this._cache.set(key, store);
      }
      if (store) {
        const meta = JSON.parse(store);
        if (meta && meta.expire && Date.now() > meta.expire) {
          this.remove(key);
          return defaults;
        }
        return _defaults(meta.data, defaults);
      }
      return defaults;
    } catch (error) {
      console.warn(`cannot get key:${key}`, error);
      return defaults;
    }
  }
  private _timer: any;
  set<T>(key: string, val: T, options?: KvOptions) {
    try {
      let j = JSON.stringify({
        ...options,
        data: val,
      });
      this._cache.set(key, j);
      this._timer && clearTimeout(this._timer);
      this._timer = setTimeout(() => {
        localStorage.setItem(key, j);
      }, 10);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  remove(key: string) {
    try {
      localStorage.removeItem(key);
      this._cache.delete(key);
    } catch (error) {
      console.error(error);
    }
  }
}

/**
 * 封装了 Kv 对于某个 key 的读写删操作，可以作为自定义Kv类的属性
 */
export class Field<T = any, D = T | undefined> {
  constructor(private _kv: Kv, private _key: string, private _defaults?: () => T) {}

  get(): D;
  get(defaults: T): T;
  get(defaults: T | undefined = this._defaults?.()): D | T {
    return this._kv.get(this._key, defaults) as D;
  }
  set(val: T, options?: KvOptions) {
    return this._kv.set(this._key, val, options);
  }
  remove() {
    return this._kv.remove(this._key);
  }
}
