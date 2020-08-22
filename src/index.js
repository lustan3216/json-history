import JsonDiffPatch from '../vendor/jsonDiffPatch'
import { toArray, cloneJson } from './utils'
import { createDelta } from './createDelta'

let debounceData = null

export default class JsonHistory {

  constructor({ tree = {}, treeFilter = null, steps = 50, backUpDeltas = [], callback = {}, setter, deleter} = {}) {
    // oldGroup = [newDelta...oldDelta]
    // newGroup = [newDelta...oldDelta]
    // deltas = [newGroup...oldGroup]
    this.deltas = backUpDeltas
    this.currentIndex = 0
    this.tree = tree
    this.steps = steps
    this.treeFilter = treeFilter
    this.jsonDiffPatch = JsonDiffPatch.create({ setter, deleter })
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

  debounceRecord(histories, delay = 100) {
    histories = toArray(histories)

    if (!histories.length) {
      return
    }

    histories.forEach(history => {
      if (debounceData) {
        const { timerId } = debounceData

        if (timerId) {
          clearTimeout(timerId)
          debounceData.timerId = null
        }
      }

      if (debounceData) {
        debounceData.timerId = setTimeout(this.debounceExecute.bind(this), delay)
      } else {
        debounceData = {
          snapshotTree: this.treeFilter ? this.treeFilter(this.tree) : cloneJson(this.tree),
          timerId: setTimeout(this.debounceExecute.bind(this), delay)
        }
      }

      const delta = createDelta(this.jsonDiffPatch, this.tree, history)
      if (delta) {
        this.jsonDiffPatch.patch(this.tree, delta)
      }
    })
  }

  debounceExecute() {
    if (!debounceData) {
      return
    }

    const { timerId, snapshotTree } = debounceData
    clearTimeout(timerId)
    const currentTree = this.treeFilter ? this.treeFilter(this.tree) : cloneJson(this.tree)
    const delta = this.jsonDiffPatch.diff(snapshotTree, currentTree)
    if (delta) {
      this.deltas.unshift([delta])
      this.callback.onRecorded(this)
      this.callback.onDeltasChanged(this)
    }

    debounceData = null
  }

  record(histories) {
    this.debounceExecute()
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
    this.debounceExecute()
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
    this.debounceExecute()
    if (this.currentIndex > 0) {
      this.deltas = this.deltas.slice(this.currentIndex)
      this.currentIndex = 0
    }
  }

  get canNotRedo() {
    return this.currentIndex < 1
  }

  redo() {
    this.debounceExecute()
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
    this.debounceExecute()
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
    this.debounceExecute()
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

