import { arrayEmptyToNull, toArrayKey } from "./utils"

export function pathStringSplit(path) {
  // ["1", "a", "[321]", "d", "[0]"]
  return path
    .toString()
    .replace(/\s/g)
    .split(/\.|(?=\[)/)
}

export function isArrayKeyPathArray(pathArray) {
  // [false, false, true, false, true]
  return pathArray.map(key => Boolean(key.toString().match(/\[(\d+)\]/)))
}

export function toNormalizedPath(path) {
  // ["1", "a", "321", "d", "0"]
  return path.map(key => toArrayKey(key) || key)
}

export function createRestOfValue(arrayPath, currentIndex, newValue) {
  const restOfArrayPath = Array.from(arrayPath).splice(currentIndex + 1)

  if (!restOfArrayPath.length) return newValue
  const isArrayKey = toArrayKey(restOfArrayPath[0])
  const init = isArrayKey ? [] : {}

  restOfArrayPath.reduce((final, key, index) => {
    const isArrayKey = toArrayKey(key)
    const isLastIndex = restOfArrayPath.length - 1 === index

    if (isArrayKey) {
      key = isArrayKey
    }

    if (isLastIndex) {
      final[key] = newValue
    } else {
      const isNextOneArray = restOfArrayPath[index + 1].match(/\[\d+\]/)
      final[key] = isNextOneArray ? [] : {}
    }

    return final[key]
  }, init)

  return arrayEmptyToNull(init) // normalize [empty * 2, newValue, empty] to [null, null, newValue, null]
}
