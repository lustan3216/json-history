import JsonHistory from '../src/index'
import { cloneJson } from '../src/utils'

const tree = {
  1: [1, 3],
  a: [{}, {1: 3}],
  b: {c: 5, d: {e: 6}
  }
}

describe('test debounceRecordSplitByPath', () => {
  let history

  beforeEach(() => {
    history = new JsonHistory({
      tree: cloneJson(tree)
    })
  })

  test('same path', async () => {
    history.debounceRecordSplitByPath([
      {
        path: 'a.length.length',
        value: undefined
      }
    ])

    history.debounceRecordSplitByPath([
      {
        path: 'a.length.length',
        value: []
      }
    ])

    history.debounceRecordSplitByPath([
      {
        path: 'a.length.length',
        value: {}
      }
    ])

    await sleep(101);

    expect(history.deltas.length).toEqual(1)

    expect(history.tree).toEqual({
      1: [1, 3],
      a: { length: { length: {} } },
      b: {c: 5, d: {e: 6}
      }
    })
  })

  test('different path1', async () => {
    history.debounceRecordSplitByPath([
      {
        path: 'a.length.length',
        value: undefined
      }
    ])

    history.debounceRecordSplitByPath([
      {
        path: 'b.length.length',
        value: []
      }
    ])

    history.debounceRecordSplitByPath([
      {
        path: '1.length.length',
        value: {}
      }
    ])

    history.debounceRecordSplitByPath([
      {
        path: 'a.length.length',
        value: {}
      }
    ])

    history.debounceRecordSplitByPath([
      {
        path: 'a.length.length',
        value: {}
      }
    ])

    await sleep(101);

    expect(history.tree).toEqual({
      1: { length: { length: {} } },
      a: { length: { length: {} } },
      b: {c: 5, d: {e: 6}, length: { length: [] }}
    })

    expect(history.deltas.length).toEqual(3)
  })

  test('different path2', async () => {
    history.debounceRecordSplitByPath([
      {
        path: 'a[0].length',
        value: undefined
      }
    ])

    history.debounceRecordSplitByPath([
      {
        path: 'b.length.length',
        value: []
      }
    ])

    history.debounceRecordSplitByPath([
      {
        path: '1.length.length',
        value: {}
      }
    ])

    history.debounceRecordSplitByPath([
      {
        path: 'a[0].length',
        value: {}
      }
    ])

    history.debounceRecordSplitByPath([
      {
        path: 'a[0].length',
        value: {}
      }
    ])

    await sleep(101);

    expect(history.tree).toEqual({
      1: { length: { length: {} } },
      a: [{ length: {}}, {1: 3}],
      b: {c: 5, d: {e: 6}, length: { length: [] }}
    })

    expect(history.deltas.length).toEqual(3)
  })

  test('real case', async () => {
    const tree = { a: {} }
    history = new JsonHistory({
      tree: cloneJson(tree)
    })

    history.debounceRecordSplitByPath([
      {
        path: 'a.style.border',
        value: '1px'
      }
    ])

    history.debounceRecordSplitByPath([
      {
        path: 'a.style.border',
        value: '2px'
      }
    ])

    await sleep(101);

    expect(history.tree).toEqual({
      a: { style: { border: '2px' } }
    })

    expect(history.deltas.length).toEqual(1)

    history.undo()

    expect(history.tree).toEqual(tree)

    history.redo()


    history.debounceRecordSplitByPath([
      {
        path: 'a.style.border',
        value: '1px'
      }
    ])

    history.debounceRecordSplitByPath([
      {
        path: 'a.style.border',
        value: undefined
      }
    ])

    expect(history.tree).toEqual({
      "a": {
        "style": {}
      }
    })

    await sleep(101);
    expect(history.deltas.length).toEqual(2)
  })
})

describe('test debounceRecord', () => {
  let history

  beforeEach(() => {
    history = new JsonHistory({
      tree: cloneJson(tree)
    })
  })

  test('same path', async () => {
    history.debounceRecord([
      {
        path: 'a.length.length',
        value: undefined
      }
    ])

    history.debounceRecord([
      {
        path: 'a.length.length',
        value: []
      }
    ])

    history.debounceRecord([
      {
        path: 'a.length.length',
        value: {}
      }
    ])

    await sleep(101);

    expect(history.deltas.length).toEqual(1)

    expect(history.tree).toEqual({
      1: [1, 3],
      a: { length: { length: {} } },
      b: {c: 5, d: {e: 6}
      }
    })
  })

  test('different path1', async () => {
    history.debounceRecord([
      {
        path: 'a.length.length',
        value: undefined
      }
    ])

    history.debounceRecord([
      {
        path: 'b.length.length',
        value: []
      }
    ])

    history.debounceRecord([
      {
        path: '1.length.length',
        value: {}
      }
    ])

    history.debounceRecord([
      {
        path: 'a.length.length',
        value: {}
      }
    ])

    history.debounceRecord([
      {
        path: 'a.length.length',
        value: {}
      }
    ])

    await sleep(101);

    expect(history.tree).toEqual({
      1: { length: { length: {} } },
      a: { length: { length: {} } },
      b: {c: 5, d: {e: 6}, length: { length: [] }}
    })

    expect(history.deltas.length).toEqual(1)
  })

  test('different path2', async () => {
    history.debounceRecord([
      {
        path: 'a[0].length',
        value: undefined
      }
    ])

    history.debounceRecord([
      {
        path: 'b.length.length',
        value: []
      }
    ])

    history.debounceRecord([
      {
        path: '1.length.length',
        value: {}
      }
    ])

    history.debounceRecord([
      {
        path: 'a[0].length',
        value: {}
      }
    ])

    history.debounceRecord([
      {
        path: 'a[0].length',
        value: {}
      }
    ])

    await sleep(101);

    expect(history.tree).toEqual({
      1: { length: { length: {} } },
      a: [{ length: {}}, {1: 3}],
      b: {c: 5, d: {e: 6}, length: { length: [] }}
    })

    expect(history.deltas.length).toEqual(1)
  })

  test('real case', async () => {
    const tree = { a: {} }
    history = new JsonHistory({
      tree: cloneJson(tree)
    })

    history.debounceRecord([
      {
        path: 'a.style.border',
        value: '1px'
      }
    ])

    history.debounceRecord([
      {
        path: 'a.style.border',
        value: '2px'
      }
    ])

    await sleep(101);

    expect(history.tree).toEqual({
      a: { style: { border: '2px' } }
    })

    expect(history.deltas.length).toEqual(1)

    history.undo()

    expect(history.tree).toEqual(tree)

    history.redo()


    history.debounceRecord([
      {
        path: 'a.style.border',
        value: '1px'
      }
    ])

    history.debounceRecord([
      {
        path: 'a.style.border',
        value: undefined
      }
    ])

    expect(history.tree).toEqual({
      "a": {
        "style": {}
      }
    })

    await sleep(101);
    expect(history.deltas.length).toEqual(2)
  })
})

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
