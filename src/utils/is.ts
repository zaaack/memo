/**
 * is primitive number
 * @param val
 */
export function isNum(val: any): val is number {
  return typeof val === 'number'
}
/**
 * is object (not null)
 * @param val
 */
export function isObj(val: any): val is object {
  return typeof val === 'object' && val !== null
}

/**
 * is primitive string
 * @param val
 */
export function isStr(val: any): val is string {
  return typeof val === 'string'
}

/**
 * is null
 * @param val
 */
export function isNull(val: any): val is null {
  return val === null
}
/**
 * is undefined
 * @param val
 */
export function isUndefined(val: any): val is undefined {
  return typeof val === 'undefined'
}

/**
 * is null or undefined
 * @param val
 */
export function isNil(val: any): val is undefined | null {
  return isNull(val) || isUndefined(val)
}

/**
 * is primitive boolean
 * @param val
 */
export function isBool(val: any): val is boolean {
  return typeof val === 'boolean'
}

/**
 * is primitive function
 * @param val
 */
export function isFn(val: any): val is Function {
  return typeof val === 'function'
}

/**
 * is empty string/array or null or undefined
 * @param val
 */
export function isEmpty<T>(val: null | undefined | T): val is null | undefined {
  if (isArray(val) || isStr(val)) {
    return !val.length
  } else if (isNil(val)) {
    return true
  }
  return false
}
/**
 * alias to Array.isArray
 */
export const isArray = Array.isArray.bind(Array)

/**
 * js 变量类型判断工具函数
 */
export const Is = {
  isArray,
  isNum,
  isObj,
  isStr,
  isNull,
  isUndefined,
  isNil,
  isBool,
  isEmpty,
  isFn,
}
