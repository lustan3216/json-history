import { objectFirstKey } from './utils'

class DeltaKeyStore {
  constructor() {
    this.set = new Set()
  }

  reset() {
    this.set = new Set()
  }

  add(delta) {
    this.set.add(objectFirstKey(delta))
  }

  filter(tree) {
    const newTree = {}
    this.set.forEach(id => {
      newTree[id] = tree && tree[id]
    })

    return newTree
  }
}

export default DeltaKeyStore
