import jsonDiffPatch from './jsonDiffPatch'
import { isUndefined, isArray } from './utils'
import { createDelta } from './createDelta'

export default class JsonHistory {

  constructor({ tree = {}, steps = 50, backUpDeltas = [], callback = {}, jsonDiffPatchOptions = {}} = {}) {
    // oldGroup = [newDelta...oldDelta]
    // newGroup = [newDelta...oldDelta]
    // deltas = [newGroup...oldGroup]
    this.deltas = backUpDeltas
    this.currentIndex = 0
    this.tree = tree
    this.steps = steps
    this.jsonDiffPatch = jsonDiffPatch.create(jsonDiffPatchOptions)
    this.callback = {
      onRecord() {},
      onEachRecord() {},
      onUndo() {},
      onRedo() {},
      ...callback
    }
  }

  get currentDeltaGroup() {
    return this.deltas[this.currentIndex]
  }

  delete(histories) {
    if (isArray(histories)) {
      histories.forEach(history => (history.value = undefined))
    }

    return this.record(histories)
  }

  record(histories, newValue) {
    const group = []

    if (isArray(histories)) {

      if (!isUndefined(newValue)) {
        histories.forEach(history => (history.value = newValue))
      }

      histories.forEach(history => {
        const delta = createDelta(this.jsonDiffPatch, this.tree, history)

        if (delta) {
          if (this.deltas > this.steps) {
            group.pop()
          }
          group.unshift(delta)
          this.jsonDiffPatch.patch(this.tree, delta)
          this.callback.onEachRecord(delta)
        }
      })

    } else {
      const delta = this.jsonDiffPatch.diff(this.tree, histories)

      if (delta) {
        this.tree = histories
        group.push(delta)
      }
    }

    if (group.length) {
      this.deltas.unshift(group)
      this.callback.onRecord(this)
    }

    return this.tree
  }

  redo() {
    if (this.currentIndex < 1) return
    this.currentIndex--

    this.currentDeltaGroup.reverse().forEach(delta => {
      this.jsonDiffPatch.patch(this.tree, delta)
    })

    this.callback.onRedo(this)
    return this.tree
  }

  undo() {
    const maxIndex = this.deltas.length - 1
    if (this.currentIndex > maxIndex) return

    this.currentDeltaGroup.forEach(delta => {
      this.jsonDiffPatch.unpatch(this.tree, delta)
    })

    this.currentIndex++
    this.callback.onUndo(this)
    return this.tree
  }
}
