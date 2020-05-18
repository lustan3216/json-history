import jsonDiffPatch from './jsonDiffPatch'
import { isUndefined, toArray } from './utils'
import { createDelta } from './createDelta'

export default class JsonHistory {

  constructor({ tree = {}, steps = 50, backUpDeltas = [], callback = {}, jsonDiffPatchOptions = {}, setter, deleter} = {}) {
    // oldGroup = [newDelta...oldDelta]
    // newGroup = [newDelta...oldDelta]
    // deltas = [newGroup...oldGroup]
    this.deltas = backUpDeltas
    this.currentIndex = 0
    this.tree = tree
    this.steps = steps
    this.jsonDiffPatch = jsonDiffPatch.create({ ...jsonDiffPatchOptions, setter, deleter })
    this.callback = {
      onRecord() {},
      onEachPatch() {},
      onUndo() {},
      onUndid() {},
      onRedo() {},
      onRedid() {},
      ...callback
    }
  }

  get currentDeltaGroup() {
    return this.deltas[this.currentIndex]
  }

  recordsMerge(fn) {
    const oldLength = this.deltas.length
    fn()
    const newLength = this.deltas.length
    const diff = newLength - oldLength
    //       [1,2,3,4,5]
    // [1,2,3,1,2,3,4,5]
    if (diff > 1) {
      let newGroup = []
      for (let i = 0; i < diff; i++) {
        newGroup = newGroup.concat(this.deltas[i])
      }
      this.deltas = [newGroup, ...this.deltas.slice(diff)]
    }
  }

  delete(histories) {
    histories = toArray(histories)
    histories.forEach(history => (history.value = undefined))
    return this.record(histories)
  }

  record(histories, newValue) {
    const group = []
    histories = toArray(histories)

    if (!isUndefined(newValue)) {
      histories.forEach(history => (history.value = newValue))
    }

    histories.forEach(history => {
      const delta = createDelta(this.jsonDiffPatch, this.tree, history)

      if (delta) {
        this.cleanOldUndo()
        if (this.deltas.length > this.steps) {
          group.pop()
        }
        group.unshift(delta)
        this.jsonDiffPatch.patch(this.tree, delta)
        this.callback.onEachPatch(delta)
      }
    })

    if (group.length) {
      this.deltas.unshift(group)
      this.callback.onRecord(this)
    }

    return this.tree
  }

  snapShot(histories) {
    const group = []
    const delta = this.jsonDiffPatch.diff(this.tree, histories)

    if (delta) {
      this.tree = histories
      group.push(delta)
    }

    if (group.length) {
      this.deltas.unshift(group)
      this.callback.onRecord(this)
    }

    return this.tree
  }

  cleanOldUndo() {
    if (this.currentIndex > 0) {
      this.deltas = this.deltas.slice(this.currentIndex)
      this.currentIndex = 0
    }
  }

  redo() {
    if (this.currentIndex < 1) return
    this.callback.onRedo()
    this.currentIndex--
    const deltaGroup = this.currentDeltaGroup.reverse()

    deltaGroup.forEach(delta => {
      this.jsonDiffPatch.patch(this.tree, delta)
      this.callback.onEachPatch(delta)
    })

    this.callback.onRedid(deltaGroup)
    return this.tree
  }

  undo() {
    const maxIndex = this.deltas.length - 1
    if (this.currentIndex > maxIndex) return
    this.callback.onUndo()
    const deltaGroup = this.currentDeltaGroup

    deltaGroup.forEach(delta => {
      this.jsonDiffPatch.unpatch(this.tree, delta)
      this.callback.onEachPatch(delta)
    })

    this.currentIndex++
    this.callback.onUndid(deltaGroup)
    return this.tree
  }
}
