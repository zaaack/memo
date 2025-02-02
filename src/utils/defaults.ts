import { isUndefined } from './is'

/**
 * 如果是 undefined 则使用默认值
 * @param value
 * @param defaults
 */

 export function defaults<T>(val: T | undefined, defaultVal: T): T
 export function defaults<T>(val: T | undefined, val1: T | undefined, defaultVal: T): T
 export function defaults<T>(val: T | undefined, val1: T | undefined, val2: T | undefined, defaultVal: T): T
 export function defaults<T>(val: T | undefined, val1: T | undefined, val2: T | undefined, val3: T | undefined, defaultVal: T): T
 export function defaults<T>(val: T | undefined, val1: T | undefined, val2: T | undefined, val3: T | undefined, val4: T | undefined, defaultVal: T): T
export function defaults<T>(val:T | undefined, ...args: T[]): T | undefined {
  if (!isUndefined(val)) return val
  if (args.length === 0) {
    return val
  }
  return (defaults as any)(...args)
}
