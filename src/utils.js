import isPlainObject from 'is-plain-object'
import JsonDiffPatch from './jsonDiffPatch.js'

export { isPlainObject }

export const isArray = Array.isArray

export const isString = function(e) {
  return typeof e === 'string' || e instanceof String
}

export const isUndefined = function isUndefined(e) {
  return e === void(0)
}

export function toArray(e) {
  if (isArray(e)) {
    return e
  } else if (isUndefined(e)) {
    return []
  } else {
    return [e]
  }
}

export function cloneJson(e) {
  if (isPlainObject(e) || isArray(e)) {
    return JSON.parse(JSON.stringify(e), JsonDiffPatch.dateReviver)
  } else {
    return e
  }
}

export function arrayEmptyToNull(e) {
  return cloneJson(e)
}

export function isAnObjectAndKeyMatch(isArrayKey, anObject) {
  const isObjectKey = !isArrayKey
  return (
    (isArray(anObject) && isArrayKey) ||
    (isPlainObject(anObject) && isObjectKey)
  )
}

export function toArrayKey(key) {
  if (isUndefined(key)) return
  // '[0]'.match(/\[(\d+)\]/)
  // ["[0]", "0", index: 0, input: "[0]", groups: undefined]
  const result = key.match(/\[(\d+)\]/)
  if (result !== null) {
    return result[1]
  }
}
