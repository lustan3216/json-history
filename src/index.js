import jsonDiffPatch from './jsonDiffPatch'
import { toArray, isUndefined, cloneJson } from './utils'
import { createDelta } from './createDelta'

export default class JsonHistory {

  constructor({ tree = {}, backUpDeltas = [], callback = {}, jsonDiffPatchOptions = {}}) {
    // oldGroup = [newDelta...oldDelta]
    // newGroup = [newDelta...oldDelta]
    // deltas = [newGroup...oldGroup]
    this.deltas = backUpDeltas
    this.currentIndex = 0
    this.tree = tree
    this.jsonDiffPatch = jsonDiffPatch.create(jsonDiffPatchOptions)
    this.callback = {
      onRecord() {},
      onUndo() {},
      onRedo() {},
      ...callback
    }
  }

  get currentDeltaGroup() {
    return this.deltas[this.currentIndex]
  }

  delete(rows) {
    const ensureIsArray = toArray(rows)
    ensureIsArray.forEach(row => (row.value = undefined))
    return this.record(rows)
  }

  record(rows, newValue) {
    const group = []
    const ensureIsArray = toArray(rows)

    if (!isUndefined(newValue)) {
      ensureIsArray.forEach(row => (row.value = newValue))
    }

    ensureIsArray.forEach(row => {

      const delta = createDelta(this.jsonDiffPatch, this.tree, row)

      if (delta) {
        group.unshift(delta)
        this.jsonDiffPatch.patch(this.tree, delta)
      }
    })

    if (group.length) {
      this.deltas.unshift(group)
      this.callback.onRecord(this)
      return this.tree
    }
  }

  redo() {
    if (this.currentIndex < 1) return
    this.currentIndex--

    this.currentDeltaGroup.reverse().forEach(delta => {
      this.jsonDiffPatch.patch(this.tree, delta)
    })

    this.callback.onRedo()
    return this.tree
  }

  undo() {
    const maxIndex = this.deltas.length - 1
    if (this.currentIndex > maxIndex) return

    this.currentDeltaGroup.forEach(delta => {
      this.jsonDiffPatch.unpatch(this.tree, delta)
    })

    this.currentIndex++
    this.callback.onUndo()
    return this.tree
  }
}
