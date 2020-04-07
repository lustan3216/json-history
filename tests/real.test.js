import JsonHistory from "../src"

const tree = {
  1: [1, 3],
  a: [{}, {1: 3}],
  b: {c: 5, d: {e: 6}}
}

describe('.recordMerge', () => {
  let history

  beforeEach(() => {
    history = new JsonHistory({
      tree
    })
  })

  test('recordMerge', () => {
    history.recordsMerge(() => {
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
    })

    expect(history.deltas.length).toEqual(1)

    expect(history.tree).toEqual({
      1: [],
      a: {
        length: {
          length: {}
        }
      }
    })
  })
})
