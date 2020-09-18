import {
  createRestOfValue,
  isArrayKeyPathArray,
  pathStringSplit,
  toNormalizedPath
} from "./path"
import { arrayEmptyToNull, cloneJson, isAnObjectAndKeyMatch, isUndefined, isArray, isString, isPlainObject } from "./utils"
import { stop, aBugHere, done, DONE, STOP } from './error'

export function createDelta(jsonDiffPatch, tree, { path = '', value, insertArray = false }) {
  const newValue = cloneJson(value)
  const arrayPath = isArray(path) ? path : pathStringSplit(path)
  const isArrayKeyArray = isArrayKeyPathArray(arrayPath)
  const normalizedPathArray = toNormalizedPath(arrayPath)

  let currentTree = tree
  let delta = {}
  // toArrayKey
  try {
    normalizedPathArray.reduce((final, key, index) => {

      function assignRestOfDelta() {
        const oldValueClone = cloneJson(currentTree)
        oldValueClone[key] = createRestOfValue(arrayPath, index, newValue)
        const delta = jsonDiffPatch.diff(
          currentTree,
          arrayEmptyToNull(oldValueClone)
        )
        Object.assign(final, delta)
      }

      function deepDiffDelta([ _old, _new ]) {
        if (isString(_old) && isString(_new) || isPlainObject(_old) && isPlainObject(_new) || isArray(_old) && isArray(_new)) {
          return jsonDiffPatch.diff(_old, _new)
        } else {
          return [_old, _new]
        }
      }

      const oldValue = cloneJson(currentTree[key])
      const isArrayKey = isArrayKeyArray[index]
      const isArrayKeyNext = isArrayKeyArray[index + 1]
      const isLastIndex = index === normalizedPathArray.length - 1

      if (isArrayKey) {
        if (isLastIndex) {
          if (isUndefined(oldValue)) {
            if (isUndefined(newValue)) {
              aBugHere()
            } else {
              if (isArray(currentTree)) {
                // 判斷是 arrayIndex 且當下是 currentTree是array就不用算了，直接手動操作，用diff算比較快
                assignRestOfDelta()
              } else {
                aBugHere()
              }
            }
          } else {
            if (isUndefined(newValue)) {
              key = `_${key}`
              final[key] = [oldValue, 0, 0]
              markAsArrayType(final)
            } else {
              if (oldValue === newValue) {
                stop()
              } else if (insertArray) {
                final[key] = [newValue]
              } else {
                final[key] = deepDiffDelta([oldValue, newValue])
              }
              markAsArrayType(final)
            }
          }
        } else {
          if (isUndefined(oldValue)) {
            if (isUndefined(newValue)) {
              aBugHere()
            } else {
              if (isArray(currentTree)) {
                // 判斷是 arrayIndex 且當下是 currentTree是array就不用算了，直接手動操作，用diff算比較快
                assignRestOfDelta()
              }

              done()
            }
          } else {
            if (isUndefined(newValue)) {
              // 要刪除，跑路徑中
              if (isAnObjectAndKeyMatch(isArrayKeyNext, oldValue)) {
                final[key] = {}
                markAsArrayType(final)
              } else {
                // 下一層已經找不到東西可以刪除，就不用處理
                stop()
              }
            } else {
              // 測試有沒有可能merge，才繼續走，不行就直接換掉
              if (isAnObjectAndKeyMatch(isArrayKeyNext, oldValue)) {
                final[key] = {}
              } else {
                if (oldValue === newValue) {
                  stop()
                } else if (isArray(currentTree)) {
                  final[key] = deepDiffDelta([
                    oldValue,
                    createRestOfValue(arrayPath, index, newValue)
                  ])
                  markAsArrayType(final)
                } else {
                  aBugHere()
                }
                done()
              }
            }
          }
        }
      } else {
        // isObjectKey
        if (isLastIndex) {
          if (isUndefined(oldValue)) {
            if (isUndefined(newValue)) {
              stop()
            } else {
              final[key] = [newValue]
            }
          } else {
            if (isUndefined(newValue)) {
              // 'a.b = undefined'  刪除
              // 'a.b.c = undefined'  刪除
              final[key] = [oldValue, 0, 0]
            } else {
              // 'a.b = 2'  更新
              // 'a.b.c = 2'  更新
              if (oldValue === newValue) {
                stop()
              } else if (isArray(oldValue) && isArray(newValue)) {
                // 'a = oldValue newArray [1,2,3] 直接用diff生delta
                const diff = jsonDiffPatch.diff(oldValue, newValue)
                if (diff) {
                  final[key] = diff
                } else {
                  stop()
                }
              } else {
                final[key] = deepDiffDelta([oldValue, newValue])
              }
            }
          }
        } else {
          if (isUndefined(oldValue)) {
            if (oldValue === newValue) {
              stop()
            } else if (isUndefined(newValue)) {
              // 要刪除東西，但就值也是空的所以break
              stop()
            } else {
              final[key] = deepDiffDelta([
                oldValue,
                createRestOfValue(arrayPath, index, newValue)
              ])
              done()
            }
          } else {
            if (isAnObjectAndKeyMatch(isArrayKeyNext, oldValue)) {
              final[key] = {}
            } else {
              // 這裡已知之後都會跑步成功，因為array 跟object不能合併，也因為下一層無法更新上層的資料結構，
              // 所以這裡直接算完結束
              if (oldValue === newValue) {
                stop()
              } else if (isUndefined(newValue)) {
                stop()
              } else {
                final[key] = deepDiffDelta([
                  oldValue,
                  createRestOfValue(arrayPath, index, newValue)
                ])
                done()
              }
            }
          }
        }
      }

      currentTree = currentTree[key.replace(/^_/, '')]
      // 這裡的 key 有可能是要被刪除的，所以有可能被改成有底線的_1，但在currentTree從樹裡面拿值
      // 是不會有底線的，所以要拿掉
      return final[key]
      // 這裡值是製作delta用的，所以會用有底線的去拿值
    }, delta)
  } catch (e) {
    if (e.message === STOP) {
      delta = undefined
    } else if (e.message === DONE) {
      // 提前結束迴圈，不用處理
    } else {
      throw e
    }
  }

  return delta
}

function markAsArrayType(e) {
  e['_t'] = 'a'
}
