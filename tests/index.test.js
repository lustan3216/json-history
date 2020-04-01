import JsonHistory from '../src/index'
import { cloneJson } from '../src/utils'

const tree = {
  1: [1, 3],
  a: [{}, { 1: 3 }],
  b: { c: 5, d: { e: 6 }}
}

describe('test history', () => {
  let history

  describe('.record 0 delta', () => {
    let history

    beforeEach(() => {
      history = new JsonHistory({
        tree: JSON.parse(JSON.stringify(tree))
      })
    })

    afterEach(() => {
      expect(history.deltas.length).toEqual(0)
    })

    test('hh = undefined', () => {
      history.record([
        {
          path: 'hh',
          value: undefined
        }
      ])

      expect(history.tree).toEqual(tree)
    })

    test('1[0][0] = undefined', () => {
      history.record([
        {
          path: '1[0][0]',
          value: undefined
        }
      ])

      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, { 1: 3 }],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('h.h.h = undefined', () => {
      history.record([
        {
          path: 'h.h.h',
          value: undefined
        }
      ])

      expect(history.tree).toEqual(tree)
    })

    test('b.c.g = undefined', () => {
      history.record({
        path: 'b.c.g',
        value: undefined
      })

      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, { 1: 3 }],
        b: { c: 5, d: { e: 6 }}
      })
    })
  })

  describe('.record 1 delta', () => {
    let history

    beforeEach(() => {
      history = new JsonHistory({
        tree: JSON.parse(JSON.stringify(tree))
      })
    })

    afterEach(() => {
      expect(history.deltas.length).toEqual(1)
      const saveState = JSON.parse(JSON.stringify(history.tree))
      history.undo()
      expect(history.tree).toEqual(tree)
      history.redo()
      expect(history.tree).toEqual(saveState)
    })

    test('1 = {}', () => {
      history.record({
        path: '1',
        value: {}
      })

      expect(history.tree).toEqual({
        1: {},
        a: [{}, { 1: 3 }],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('a[1] = { f: 5 }', () => {
      history.record({
        path: 'a[1]',
        value: { f: 5 }
      })
      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, { f: 5 }],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('a[1][3] = 5', () => {
      history.record({
        path: 'a[1][3]',
        value: 5
      })
      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, [null, null, null, 5]],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('a[4][1] = 5', () => {
      history.record({
        path: 'a[4][1]',
        value: 5
      })
      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, { 1: 3 }, null, null, [null, 5]],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('a[2].3 = [3, 4, 5]', () => {
      history.record({
        path: 'a[2].3',
        value: [3, 4, 5]
      })

      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, { 1: 3 }, { 3: [3, 4, 5] }],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('a[1][1] = { f: 5 }', () => {
      history.record({
        path: 'a[1][1]',
        value: { f: 5 }
      })
      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, [null, { f: 5 }]],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('a[1][1]a = { f: 5 }', () => {
      history.record({
        path: 'a[1][1]a',
        value: { f: 5 }
      })
      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, [null, { a: { f: 5 }}]],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('1 = 2', () => {
      history.record({
        path: 1,
        value: 2
      })

      expect(history.tree).toEqual({
        1: 2,
        a: [{}, { 1: 3 }],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('1.a.b = 2', () => {
      history.record({
        path: '1.a.b',
        value: 2
      })

      expect(history.tree).toEqual({
        1: { a: { b: 2 }},
        a: [{}, { 1: 3 }],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('1.a = 2', () => {
      history.record({
        path: '1.a',
        value: 2
      })

      expect(history.tree).toEqual({
        1: { a: 2 },
        a: [{}, { 1: 3 }],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('1[0].a = 5', () => {
      history.record({
        path: '1[0].a',
        value: 5
      })

      expect(history.tree).toEqual({
        1: [{ a: 5 }, 3],
        a: [{}, { 1: 3 }],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('a[0].a = 5', () => {
      history.record({
        path: 'a[0].a',
        value: 5
      })

      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{ a: 5 }, { 1: 3 }],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('b.d = { f: 5 }', () => {
      history.record({
        path: 'b.d',
        value: { f: 5 }
      })

      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, { 1: 3 }],
        b: { c: 5, d: { f: 5 }}
      })
    })

    test('b.d.c.g = 3', () => {
      history.record({
        path: 'b.d.c.g',
        value: 3
      })

      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, { 1: 3 }],
        b: { c: 5, d: { e: 6, c: { g: 3 }}}
      })
    })

    test('b.d = { f: 5 } / b.d.c.g = 3', () => {
      history.record([
        {
          path: 'b.d',
          value: { f: 5 }
        },
        {
          path: 'b.d.c.g',
          value: 3
        }
      ])

      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, { 1: 3 }],
        b: { c: 5, d: { f: 5, c: { g: 3 }}}
      })
    })

    test('a = undefined', () => {
      history.record([
        {
          path: 'a',
          value: undefined
        }
      ])

      expect(history.tree).toEqual({
        1: [1, 3],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('a = undefined', () => {
      history.record([
        {
          path: 'a[1]',
          value: undefined
        }
      ])

      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('a[1].1 = undefined', () => {
      history.record([
        {
          path: 'a[1].1',
          value: undefined
        }
      ])

      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, {}],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('1[0] = undefined', () => {
      history.record([
        {
          path: '1[0]',
          value: undefined
        }
      ])

      expect(history.tree).toEqual({
        1: [3],
        a: [{}, { 1: 3 }],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('a = [1, 2, 3]', () => {
      history.record([
        {
          path: 'a',
          value: [1, 2, 3]
        }
      ])

      expect(history.tree).toEqual({
        1: [1, 3],
        a: [1, 2, 3],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('a[1].3 = [3, 4, 5]', () => {
      history.record({
        path: 'a[1].3',
        value: [3, 4, 5]
      })

      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, { 1: 3, 3: [3, 4, 5] }],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('1.b.c / a.b.c / b.b.c = [3, 4, 5]', () => {
      history.record([
        {
          path: '1.b.c',
          value: [3, 4, 5]
        },
        {
          path: 'a.b.c',
          value: [3, 4, 5]
        },
        {
          path: 'b.b.c',
          value: [3, 4, 5]
        }
      ])

      expect(history.tree).toEqual({
        1: { b: { c: [3, 4, 5] }},
        a: { b: { c: [3, 4, 5] }},
        b: { c: 5, d: { e: 6 }, b: { c: [3, 4, 5] }}
      })
    })

    test('a[0].b = [3, 4, 5]', () => {
      history.record([
        {
          path: 'a[0].b',
          value: [3, 4, 5]
        }
      ])

      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{ b: [3, 4, 5] }, { 1: 3 }],
        b: { c: 5, d: { e: 6 }}
      })
    })
  })

  describe('.delete', () => {
    let history

    beforeEach(() => {
      history = new JsonHistory({
        tree: JSON.parse(JSON.stringify(tree))
      })
    })

    test('hh = undefined', () => {
      history.delete([
        {
          path: 'hh'
        }
      ])

      expect(history.deltas.length).toEqual(0)
      expect(history.tree).toEqual(tree)
    })

    test('1 = undefined', () => {
      history.delete({
        path: '1'
      })
      expect(history.deltas.length).toEqual(1)
      expect(history.tree).toEqual({
        a: [{}, { 1: 3 }],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('a[1] = undefined', () => {
      history.delete({
        path: 'a[1]',
        value: undefined
      })
      expect(history.deltas.length).toEqual(1)
      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('b.d = undefined', () => {
      history.delete({
        path: 'b.d'
      })
      expect(history.deltas.length).toEqual(1)
      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, { 1: 3 }],
        b: { c: 5 }
      })
    })

    test('b.d = 123 delete method will ensure value is 123', () => {
      history.delete({
        path: 'b.d',
        value: 123
      })
      expect(history.deltas.length).toEqual(1)
      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, { 1: 3 }],
        b: { c: 5 }
      })
    })
  })

  describe('.record with value', () => {
    let history

    beforeEach(() => {
      history = new JsonHistory({
        tree: JSON.parse(JSON.stringify(tree))
      })
    })

    test('with undefined equal to delete', () => {
      const history = new JsonHistory({
        tree: JSON.parse(JSON.stringify(tree))
      })

      history.delete({
        path: 'b.d'
      })

      const history1 = new JsonHistory({
        tree: JSON.parse(JSON.stringify(tree))
      })

      history1.record({
        path: 'b.d',
        value: undefined
      })

      expect(history.tree).toEqual(history1.tree)
    })

    test('all same value', () => {
      history.record(
        [
          {
            path: '1[1]'
          },
          {
            path: 'a[1]'
          },
          {
            path: 'b[1]'
          }
        ],
        [100]
      )

      expect(history.tree).toEqual({
        1: [1, [100]],
        a: [{}, [100]],
        b: [null, [100]]
      })
    })
  })

  test('.redo .undo', () => {
    const history = new JsonHistory({
      tree: JSON.parse(JSON.stringify(tree))
    })

    history.delete({
      path: 'b.d.e',
      value: 123
    })

    expect(history.deltas.length).toEqual(1)
    expect(history.tree).toEqual({
      1: [1, 3],
      a: [{}, { 1: 3 }],
      b: { c: 5, d: {}}
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
      a: { c: { t: [1, 3, 5, {}] }, g: {}},
      b: { c: [1, 2, 3, { a: 3 }], d: {}}
    })

    history.record({
      path: '1',
      value: [{ a: {}}, {}]
    })
    expect(history.deltas.length).toEqual(3)
    expect(history.tree).toEqual({
      1: [{ a: {}}, {}],
      a: { c: { t: [1, 3, 5, {}] }, g: {}},
      b: { c: [1, 2, 3, { a: 3 }], d: {}}
    })

    history.undo()
    expect(history.tree).toEqual({
      1: [1, 3],
      a: { c: { t: [1, 3, 5, {}] }, g: {}},
      b: { c: [1, 2, 3, { a: 3 }], d: {}}
    })

    history.undo()
    expect(history.tree).toEqual({
      1: [1, 3],
      a: [{}, { 1: 3 }],
      b: { c: 5, d: {}}
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
      1: [{ a: {}}, {}],
      a: { c: { t: [1, 3, 5, {}] }, g: {}},
      b: { c: [1, 2, 3, { a: 3 }], d: {}}
    })
  })

  describe('.record array inset', () => {
    let history

    beforeEach(() => {
      history = new JsonHistory({
        tree: JSON.parse(JSON.stringify(tree))
      })
    })

    test('1[1] = {}', () => {
      history.record({
        path: '1[1]',
        value: {},
        insertArray: true
      })

      expect(history.deltas.length).toEqual(1)
      expect(history.tree).toEqual({
        1: [1, {}, 3],
        a: [{}, { 1: 3 }],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('a[5] = []', () => {
      history.record({
        path: 'a[5]',
        value: [],
        insertArray: true
      })

      expect(history.deltas.length).toEqual(1)
      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, { 1: 3 }, null, null, null, []],
        b: { c: 5, d: { e: 6 }}
      })
    })

    test('complicated inset', () => {
      history.record({
        path: '1[4]',
        value: {},
        insertArray: true
      })

      expect(history.tree).toEqual({
        1: [1, 3, null, null, {}],
        a: [{}, { 1: 3 }],
        b: { c: 5, d: { e: 6 }}
      })

      history.record([
        {
          path: '1[4]',
          value: [],
          insertArray: true
        },
        {
          path: '1[5]',
          value: [1, 2, 3]
        }
      ])

      expect(history.tree).toEqual({
        1: [1, 3, null, null, [], [1, 2, 3]],
        a: [{}, { 1: 3 }],
        b: { c: 5, d: { e: 6 }}
      })

      expect(history.deltas.length).toEqual(2)

      history.undo()
      history.undo()
      expect(history.tree).toEqual(tree)
    })
  })

  describe('special case', () => {
    let history

    beforeEach(() => {
      history = new JsonHistory({
        tree: JSON.parse(JSON.stringify(tree))
      })
    })

    afterEach(() => {
      expect(history.deltas.length).toEqual(1)
      const saveState = cloneJson(history.tree)
      history.undo()
      expect(history.tree).toEqual(tree)
      history.redo()
      expect(history.tree).toEqual(saveState)
    })

    test('a.length.length = {}', () => {
      history.record({
        path: 'a.length.length',
        value: {}
      })

      expect(history.tree).toEqual({
        1: [1, 3],
        a: {
          length: {
            length: {}
          }
        },
        b: { c: 5, d: { e: 6 }}
      })
    })


    test('regex length date', () => {
      const date = new Date(2016, 11, 8)
      history.record([
        {
          path: 'a.length.length',
          value: {}
        },{
          path: 'b.e',
          value: date
        }
      ])

      expect(history.tree).toEqual({
        1: [1, 3],
        a: {
          length: {
            length: { }
          }
        },
        b: { c: 5, d: { e: 6 }, e: date}
      })
    })

    test('long text', () => {
      const text = '四川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有「健康碼」綠碼的人士，在篩查後「確診」，「無症狀感染者」近日備受關注，中共國家衛健委自四月一日起在每日疫情通報中，特別單獨列出無症狀感染者的人數。鍾南山強調，已經證實無症狀患者有明確的傳染性，但是否有很高的傳染性，現在並沒有證據說明。'
      history.record([
        {
          path: 'b.e',
          value: text + text
        },
        {
          path: 'b.e',
          value: text + 123 + text
        }
      ])

      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, { 1: 3 }],
        b: { c: 5, d: { e: 6 }, e: text + 123 + text}
      })
    })

    test('long text in array', () => {
      const text = '四川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有川和甘肅等省接連發現擁有「健康碼」綠碼的人士，在篩查後「確診」，「無症狀感染者」近日備受關注，中共國家衛健委自四月一日起在每日疫情通報中，特別單獨列出無症狀感染者的人數。鍾南山強調，已經證實無症狀患者有明確的傳染性，但是否有很高的傳染性，現在並沒有證據說明。'
      history.record([
        {
          path: 'b.e[1]',
          value: text + text
        },
        {
          path: 'b.e[1]',
          value: text + 123 + text
        }
      ])

      expect(history.tree).toEqual({
        1: [1, 3],
        a: [{}, { 1: 3 }],
        b: { c: 5, d: { e: 6 }, e: [null, text + 123 + text]}
      })
    })
  })

  describe('array tree',() => {
    let history

    beforeEach(() => {
      history = new JsonHistory({
        tree: [1, 2, 3]
      })
    })

    test('[0] = 123', () => {
      history.record({
        path: '[0]',
        value: 123
      })

      expect(history.tree).toEqual([123,2,3])
    })

    test('[0] = 123 insert', () => {
      history.record({
        path: '[0]',
        value: 123,
        insertArray: true
      })

      expect(history.tree).toEqual([123, 1,2,3])
    })
  })
})
