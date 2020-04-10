import JsonHistory from "../src"

const tree = {
  1: [1, 3],
  a: [{}, {1: 3}],
  b: {c: 5, d: {e: 6}}
}

describe('.redo undo', () => {
  let history

  beforeEach(() => {
    history = new JsonHistory({
      tree
    })
  })

  test('recordMerge', () => {
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

    history.undo()
    history.undo()

    history.record([
      {
        path: 'a.length.length',
        value: {}
      }
    ])

    history.undo()

    expect(history.deltas.length).toEqual(1)

    expect(history.tree).toEqual({
      1: [1, 3],
      a: {
        length: {
          length: {}
        }
      },
      b: {c: 5, d: {e: 6}}
    })
  })

  test('array .redo .undo', () => {
    const history = new JsonHistory({
      tree: JSON.parse(JSON.stringify(tree))
    })

    history.delete([{
      path: 'b.d.e',
      value: 123
    }])

    expect(history.deltas.length).toEqual(1)
    expect(history.tree).toEqual({
      1: [1, 3],
      a: [{}, {1: 3}],
      b: {c: 5, d: {}}
    })

    history.record([
      {
        path: 'b.c',
        value: [1, 2, 3, {}]
      },
      {
        path: 'a.g.b',
        value: [1, 2, 3, {}]
      },
      {
        path: 'a.g.b',
        value: undefined
      },
      {
        path: 'a.c.b[3]',
        value: undefined
      },
      {
        path: 'a.c.t',
        value: [1, 3, 5, {}]
      },
      {
        path: 'b.c[3].a',
        value: 3
      }
    ])
    expect(history.deltas.length).toEqual(2)
    expect(history.tree).toEqual({
      1: [1, 3],
      a: {c: {t: [1, 3, 5, {}]}, g: {}},
      b: {c: [1, 2, 3, {a: 3}], d: {}}
    })

    history.record([{
      path: '1',
      value: [{a: {}}, {}]
    }])
    expect(history.deltas.length).toEqual(3)
    expect(history.tree).toEqual({
      1: [{a: {}}, {}],
      a: {c: {t: [1, 3, 5, {}]}, g: {}},
      b: {c: [1, 2, 3, {a: 3}], d: {}}
    })

    history.undo()
    expect(history.tree).toEqual({
      1: [1, 3],
      a: {c: {t: [1, 3, 5, {}]}, g: {}},
      b: {c: [1, 2, 3, {a: 3}], d: {}}
    })

    history.undo()
    expect(history.tree).toEqual({
      1: [1, 3],
      a: [{}, {1: 3}],
      b: {c: 5, d: {}}
    })

    history.undo()
    history.undo()
    history.undo()
    expect(history.tree).toEqual(tree)

    history.redo()
    history.redo()
    history.redo()
    history.redo()
    history.redo()
    expect(history.tree).toEqual({
      1: [{a: {}}, {}],
      a: {c: {t: [1, 3, 5, {}]}, g: {}},
      b: {c: [1, 2, 3, {a: 3}], d: {}}
    })
  })
})
