import JsonDiffPatch from '../vendor/jsonDiffPatch'
import { toArray, cloneJson } from './utils'
import { createDelta } from './createDelta'

const debounceMap = {}

export default class JsonHistory {

  constructor({ tree = {}, steps = 50, backUpDeltas = [], callback = {}, jsonDiffPatchOptions = {}, setter, deleter} = {}) {
    // oldGroup = [newDelta...oldDelta]
    // newGroup = [newDelta...oldDelta]
    // deltas = [newGroup...oldGroup]
    this.deltas = backUpDeltas
    this.currentIndex = 0
    this.tree = tree
    this.steps = steps
    this.jsonDiffPatch = JsonDiffPatch.create({ ...jsonDiffPatchOptions, setter, deleter })
    this.callback = {
      onRecorded() {},
      onDeltasChanged() {},
      onDeltasCleaned() {},
      onUndo() {},
      onUndid() {},
      onRedo() {},
      onRedid() {},
      ...callback
    }
  }

  get nextUndoDeltaGroup() {
    return this.deltas[this.currentIndex]
  }

  get nextRedoDeltaGroup() {
    return this.deltas[this.currentIndex - 1]
  }

  recordsMerge(fn) {
    const oldLength = this.deltas.length
    const temp = this.callback.onDeltasChanged
    this.callback.onDeltasChanged = function(){}
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
    this.callback.onDeltasChanged = temp
    this.callback.onDeltasChanged(this)
  }

  delete(histories) {
    histories = toArray(histories)
    histories.forEach(history => (history.value = undefined))
    return this.record(histories)
  }

  debounceRecordSplitByPath(histories, delay = 100) {
    histories = toArray(histories)

    if (!histories.length) {
      return
    }

    histories.forEach(history => {
      const { path, value } = history

      if (debounceMap[path]) {
        const { timerId } = debounceMap[path]

        if (timerId) {
          clearTimeout(timerId)
          debounceMap[path].timerId = null
        }
      }

      const perform = (path, value) => {
        const { timerId, snapshotTree } = debounceMap[path]

        const delta = createDelta(this.jsonDiffPatch, snapshotTree, { path, value })
        if (delta) {
          this.deltas.unshift([delta])
          this.callback.onRecorded(this)
          this.callback.onDeltasChanged(this)
        }

        clearTimeout(timerId)
        delete debounceMap[path]
      }

      if (debounceMap[path]) {
        debounceMap[path].timerId = setTimeout(perform.bind(this, path, value), delay)
      } else {
        debounceMap[path] = {
          snapshotTree: cloneJson(this.tree),
          timerId: setTimeout(perform.bind(this, path, value), delay)
        }
      }

      const delta = createDelta(this.jsonDiffPatch, this.tree, history)
      if (delta) {
        this.jsonDiffPatch.patch(this.tree, delta)
      }
    })

  }

  debounceRecord(histories, delay = 100) {
    const key = 'debounceRecordKey'
    histories = toArray(histories)

    if (!histories.length) {
      return
    }

    histories.forEach(history => {

      if (debounceMap[key]) {
        const { timerId } = debounceMap[key]

        if (timerId) {
          clearTimeout(timerId)
          debounceMap[key].timerId = null
        }
      }

      const perform = () => {
        const { timerId, snapshotTree } = debounceMap[key]

        const delta = this.jsonDiffPatch.diff(snapshotTree, this.tree)
        if (delta) {
          this.deltas.unshift([delta])
          this.callback.onRecorded(this)
          this.callback.onDeltasChanged(this)
        }

        clearTimeout(timerId)
        delete debounceMap[key]
      }

      if (debounceMap[key]) {
        debounceMap[key].timerId = setTimeout(perform, delay)
      } else {
        debounceMap[key] = {
          snapshotTree: cloneJson(this.tree),
          timerId: setTimeout(perform, delay)
        }
      }

      const delta = createDelta(this.jsonDiffPatch, this.tree, history)
      if (delta) {
        this.jsonDiffPatch.patch(this.tree, delta)
      }
    })

  }

  record(histories) {
    const group = []
    histories = toArray(histories)

    histories.forEach(history => {
      const delta = createDelta(this.jsonDiffPatch, this.tree, history)

      if (delta) {
        this.cleanOldUndo()
        if (this.deltas.length > this.steps) {
          group.pop()
        }
        group.unshift(delta)
        this.jsonDiffPatch.patch(this.tree, delta)
      }
    })

    if (group.length) {
      this.deltas.unshift(group)
      this.callback.onRecorded(this)
      this.callback.onDeltasChanged(this)
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
      this.callback.onRecorded(this)
    }

    return this.tree
  }

  cleanOldUndo() {
    if (this.currentIndex > 0) {
      this.deltas = this.deltas.slice(this.currentIndex)
      this.currentIndex = 0
    }
  }

  get canNotRedo() {
    return this.currentIndex < 1
  }

  redo() {
    if (this.canNotRedo) return

    const deltaGroup = this.nextRedoDeltaGroup.reverse()
    this.currentIndex--
    this.callback.onRedo(deltaGroup)

    deltaGroup.forEach(delta => {
      this.jsonDiffPatch.patch(this.tree, delta)
    })

    this.callback.onRedid(deltaGroup)
    return this.tree
  }

  get canNotUndo() {
    const maxIndex = this.deltas.length - 1
    return this.currentIndex > maxIndex
  }

  undo() {
    if (this.canNotUndo) return

    const deltaGroup = this.nextUndoDeltaGroup
    this.currentIndex++

    this.callback.onUndo(deltaGroup)

    deltaGroup.forEach(delta => {
      this.jsonDiffPatch.unpatch(this.tree, delta)
    })

    this.callback.onUndid(deltaGroup)
    return this.tree
  }

  cleanDeltas(shouldDeleteFunction) {
    this.deltas.forEach((group, i) => {

      group.forEach((delta, ii) => {
        const shouldDelete = shouldDeleteFunction(delta)
        if (shouldDelete) {
          group[ii] = null
        }
      })

      this.deltas[i] = group.filter(delta => delta)
    })


    let availableIndex = 0
    for (let i = 0; i === this.currentIndex; i++) {
      if (this.deltas[i] && this.deltas[i].length) {
        availableIndex++
      }
    }

    this.deltas = this.deltas.filter(group => group.length)
    this.currentIndex = availableIndex
    this.callback.onDeltasCleaned(this)
  }
}

