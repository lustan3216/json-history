import JsonHistory from '../src/index'
import { cloneJson } from '../src/utils'

const tree = {
  1: [1, 3],
  a: [{}, {1: 3}],
  b: {c: 5, d: {e: 6}
  }
}

describe('test history', () => {
  let history

  beforeEach(() => {
    history = new JsonHistory({
      tree: cloneJson(tree)
    })
  })

  test('clean current index', () => {
    history.record([
      {
        path: 'b',
        value: undefined
      }
    ])

    history.record([
      {
        path: 1,
        value: []
      }
    ])

    history.record([
      {
        path: 'a.length.length',
        value: {}
      }
    ])

    history.undo()

    history.cleanDeltas(delta => {
      const key = Object.keys(delta)[0]
      return key === '1'
    })

    history.undo()
    history.undo()

    expect(history.tree).toEqual({
      1: [],
      a: [{}, {1: 3}],
      b: {c: 5, d: {e: 6}}
    })
  })

  test('clean last index', () => {
    history.record([
      {
        path: 'b',
        value: undefined
      }
    ])

    history.record([
      {
        path: 1,
        value: []
      }
    ])

    history.record([
      {
        path: 'a.length.length',
        value: {}
      }
    ])

    history.cleanDeltas(delta => {
      const key = Object.keys(delta)[0]
      return key === 'a'
    })

    history.undo()
    history.undo()

    expect(history.tree).toEqual({
      1: [1, 3],
      b: {c: 5, d: {e: 6}},
      a: {
        length: {
          length: {}
        }
      }
    })
  })

})
