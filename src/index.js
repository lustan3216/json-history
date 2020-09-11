import JsonDiffPatch from '../vendor/jsonDiffPatch'
import { toArray, cloneJson } from './utils'
import { createDelta } from './createDelta'

let debounceData = null
let debounceExecutedCallbackResolve = null
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
    this.jsonDiffPatch = JsonDiffPatch.create({setter, deleter})
    this.callback = {
      onTreeChanged() {
      },
      onDeltasChanged() {
      },
      onDeltasCleaned() {
      },
      beforeUndo() {
      },
      beforeRedo() {
      },
      onUndid() {
      },
      onRedid() {
      },
      ...callback
    }
  }

  createDelta(history) {
    return createDelta(this.jsonDiffPatch, this.tree, history)
  }

  patch(delta) {
    this.jsonDiffPatch.patch(this.tree, delta)
  }

  recordsMerge(fn) {
    // 只有搭配RECORD用而已，debounceRecord已經是曲段時間的merge
    this.debounceExecute()

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

      const delta = this.createDelta(history)
      if (delta) {
        this.patch(delta)
      }
    })
  }

  debounceExecutedCallback(fn) {
    return new Promise((resolve, reject) => {
      fn()
      debounceExecutedCallbackResolve = resolve
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
      this._cleanOldUndo()
      const group = this.groupBindTime([delta])
      this.deltas.unshift(group)
      this.callback.onTreeChanged(this)
      this.callback.onDeltasChanged(this)
    }

    if (debounceExecutedCallbackResolve) {
      debounceExecutedCallbackResolve(delta)
      debounceExecutedCallbackResolve = null
    }
    debounceData = null
  }

  groupBindTime(group) {
    return { group, createdAt: +new Date }
  }

  irreversibleRecord(histories) {
    this.record(histories)
    this.deltas[0].irreversible = true
  }

  record(histories) {
    this.debounceExecute()
    const group = []
    histories = toArray(histories)

    histories.forEach(history => {
      const delta = this.createDelta(history)

      if (delta) {
        this._cleanOldUndo()
        if (this.deltas.length > this.steps) {
          group.pop()
        }

        group.unshift(delta)
        this.patch(delta)
      }
    })

    if (group.length) {
      this.deltas.unshift(this.groupBindTime(group))
      this.callback.onTreeChanged(this)
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
      this.deltas.unshift(this.groupBindTime(group))
      this.callback.onTreeChanged(this)
    }

    return this.tree
  }

  _cleanOldUndo() {
    if (this.currentIndex > 0) {
      this.deltas = this.deltas.slice(this.currentIndex)
      this.currentIndex = 0
    }
  }

  get canNotRedo() {
    return this.currentIndex < 1
  }

  getNextRedoDeltaGroup() {
    if (this.canNotRedo) return

    this.currentIndex--
    const group = this.deltas[this.currentIndex]
    if (group.irreversible) {
      return this.getNextRedoDeltaGroup()
    }
    return group.group.reverse()
  }

  redo() {
    this.debounceExecute()

    const deltaGroup = this.getNextRedoDeltaGroup()
    if (!deltaGroup) return

    this.callback.beforeRedo(deltaGroup)

    deltaGroup.forEach(delta => {
      this.patch(delta)
    })

    this.callback.onRedid(deltaGroup)
    this.callback.onTreeChanged(this)
    return this.tree
  }

  get canNotUndo() {
    const maxIndex = this.deltas.length - 1
    return this.currentIndex > maxIndex
  }

  getNextUndoDeltaGroup() {
    if (this.canNotUndo) return

    const group = this.deltas[this.currentIndex]
    this.currentIndex++
    if (group.irreversible) {
      return this.getNextUndoDeltaGroup()
    }
    return group.group
  }

  undo() {
    this.debounceExecute()

    const deltaGroup = this.getNextUndoDeltaGroup()
    if (!deltaGroup) return

    this.callback.beforeUndo(deltaGroup)

    deltaGroup.forEach(delta => {
      this.jsonDiffPatch.unpatch(this.tree, delta)
    })

    this.callback.onUndid(deltaGroup)
    this.callback.onTreeChanged(this)
    return this.tree
  }

  cleanDeltas(shouldDeleteFunction) {
    this.debounceExecute()
    this.deltas.forEach(({ group }, i) => {

      group.forEach((delta, ii) => {
        const shouldDelete = shouldDeleteFunction(delta)
        if (shouldDelete) {
          group[ii] = null
        }
      })

      const newGroup = group.filter(delta => delta)
      this.deltas[i] = this.groupBindTime(newGroup)
    })

    let availableIndex = 0
    for (let i = 0; i === this.currentIndex; i++) {
      if (this.deltas[i] && this.deltas[i].group.length) {
        availableIndex++
      }
    }

    this.deltas = this.deltas.filter(({ group }) => group.length)
    this.currentIndex = availableIndex
    this.callback.onDeltasCleaned(this)
  }
}

