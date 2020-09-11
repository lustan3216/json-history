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

  test('3 undo', () => {
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

    expect(history.tree).toEqual(tree)
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

  test('real case', () => {
    history = new JsonHistory({
      tree: {}
    })

    history.record([
      {
        path: 'a',
        value: 1
      }
    ])

    history.record([
      {
        path: 'a',
        value: 2
      }
    ])


    history.record([
      {
        path: 'a',
        value: 3
      }
    ])
    history.record([
      {
        path: 'a',
        value: 4
      }
    ])

    history.undo()
    history.undo()

    expect(history.deltas.length).toEqual(4)

    history.record([
      {
        path: 'a',
        value: 5
      }
    ])

    expect(history.tree).toEqual({
      a: 5
    })

    history.undo()

    expect(history.deltas.length).toEqual(3)
  })

  // test('real case by debounce record', () => {
  //   history = new JsonHistory({
  //     tree: {"01EGPPWEX9N3S0DAM44XQXP6SN":{"tag":"layers","canNewItem":true,"label":"magic-layout","id":"01EGPPWEX9N3S0DAM44XQXP6SN","parentId":"01EGPPWF2GT40BV4PAGF4C2J1Q"},"01EGPPWEX9ZWAAYFWP6GYWZHPW":{"tag":"grid-generator","canNewItem":true,"sortIndex":0,"label":"layer","id":"01EGPPWEX9ZWAAYFWP6GYWZHPW","parentId":"01EGPPWEX9N3S0DAM44XQXP6SN"},"01EGPPWEX908E967G85DP78VG9":{"tag":"grid-generator-item","label":"container","props":{"xl":{"x":0,"y":0,"w":22,"h":100},"lg":{"x":0,"y":0,"w":22,"h":100},"md":{"x":0,"y":0,"w":22,"h":100},"sm":{"x":0,"y":0,"w":22,"h":100},"xs":{"x":0,"y":0,"w":22,"h":100},"xxs":{"x":0,"y":0,"w":22,"h":100}},"style":{"default":{"overflow":"scroll"}},"id":"01EGPPWEX908E967G85DP78VG9","parentId":"01EGPPWEX9ZWAAYFWP6GYWZHPW"},"01EGPPWEX9Q4M65B5XDM57FXG4":{"tag":"grid-generator-item","label":"container","props":{"xl":{"x":22,"y":0,"w":44,"h":130},"lg":{"x":57,"y":97,"w":9,"h":248},"md":{"x":22,"y":322,"w":44,"h":130},"sm":{"x":22,"y":0,"w":44,"h":130},"xs":{"x":22,"y":0,"w":44,"h":130},"xxs":{"x":22,"y":0,"w":44,"h":130},"ratioH":1},"style":{"default":{"overflow":"scroll"}},"id":"01EGPPWEX9Q4M65B5XDM57FXG4","parentId":"01EGPPWEX9ZWAAYFWP6GYWZHPW"},"01EGPPM6A6Q3CBEYBBKPKN95YB":{"tag":"layers","canNewItem":true,"label":"magic-layout","id":"01EGPPM6A6Q3CBEYBBKPKN95YB","parentId":"01EGPPM6ZFMKC716J2KHWADZS2"},"01EGQJETDJHV58F7CV9V1P3QJ8":{"tag":"grid-generator","canNewItem":true,"sortIndex":1,"label":"Layerffdsdfs","id":"01EGQJETDJHV58F7CV9V1P3QJ8","parentId":"01EGPPM6A6Q3CBEYBBKPKN95YB"},"01EGQJETDJ90TBM25NQZ066F7N":{"tag":"grid-generator-item","label":"container","props":{"xl":{"x":0,"y":0,"w":22,"h":100},"lg":{"x":0,"y":0,"w":22,"h":100},"md":{"x":19,"y":182,"w":22,"h":100},"sm":{"x":0,"y":0,"w":22,"h":100},"xs":{"x":0,"y":0,"w":22,"h":100},"xxs":{"x":0,"y":0,"w":22,"h":100}},"style":{"default":{"overflow":"scroll"}},"id":"01EGQJETDJ90TBM25NQZ066F7N","parentId":"01EGQJETDJHV58F7CV9V1P3QJ8"},"01EGQJETDJBEFMGK3E3V886HBP":{"tag":"grid-generator-item","label":"container","props":{"xl":{"x":22,"y":0,"w":44,"h":130},"lg":{"x":22,"y":0,"w":44,"h":130},"md":{"x":16,"y":486,"w":44,"h":130},"sm":{"x":22,"y":0,"w":44,"h":130},"xs":{"x":22,"y":0,"w":44,"h":130},"xxs":{"x":22,"y":0,"w":44,"h":130}},"style":{"default":{"overflow":"scroll"}},"id":"01EGQJETDJBEFMGK3E3V886HBP","parentId":"01EGQJETDJHV58F7CV9V1P3QJ8"}},
  //     backUpDeltas: [{"group":[{"01EGQJETDJHV58F7CV9V1P3QJ8":[{"tag":"grid-generator","canNewItem":true,"sortIndex":1,"label":"Layerffdsdfs","id":"01EGQJETDJHV58F7CV9V1P3QJ8","parentId":"01EGPPM6A6Q3CBEYBBKPKN95YB"},0,0],"01EGQJETDJ90TBM25NQZ066F7N":[{"tag":"grid-generator-item","label":"container","props":{"xl":{"x":0,"y":0,"w":22,"h":100},"lg":{"x":0,"y":0,"w":22,"h":100},"md":{"x":19,"y":182,"w":22,"h":100},"sm":{"x":0,"y":0,"w":22,"h":100},"xs":{"x":0,"y":0,"w":22,"h":100},"xxs":{"x":0,"y":0,"w":22,"h":100}},"style":{"default":{"overflow":"scroll"}},"id":"01EGQJETDJ90TBM25NQZ066F7N","parentId":"01EGQJETDJHV58F7CV9V1P3QJ8"},0,0],"01EGQJETDJBEFMGK3E3V886HBP":[{"tag":"grid-generator-item","label":"container","props":{"xl":{"x":22,"y":0,"w":44,"h":130},"lg":{"x":22,"y":0,"w":44,"h":130},"md":{"x":16,"y":486,"w":44,"h":130},"sm":{"x":22,"y":0,"w":44,"h":130},"xs":{"x":22,"y":0,"w":44,"h":130},"xxs":{"x":22,"y":0,"w":44,"h":130}},"style":{"default":{"overflow":"scroll"}},"id":"01EGQJETDJBEFMGK3E3V886HBP","parentId":"01EGQJETDJHV58F7CV9V1P3QJ8"},0,0],"01EGQNSE63DR1R4V65MZ5YEEY4":{"sortIndex":[1,0]},"01EGQNSEXTDREGTCMWRK37510V":{"sortIndex":[2,1]}}],"createdAt":1598522665589}]
  //   })
  //   history.currentIndex = 1
  //   history.redo()
  //
  //   // history.debounceRecord([
  //   //   {
  //   //     path: 'a',
  //   //     value: 1
  //   //   }
  //   // ])
  //   // history.undo()
  //   // history.redo()
  //   // history.debounceRecord([
  //   //   {
  //   //     path: 'a',
  //   //     value: 2
  //   //   }
  //   // ])
  //   // history.undo()
  //   // history.redo()
  //   //
  //   // history.debounceRecord([
  //   //   {
  //   //     path: 'a',
  //   //     value: 3
  //   //   }
  //   // ])
  //   // history.undo()
  //   // history.redo()
  //   // history.debounceRecord([
  //   //   {
  //   //     path: 'a',
  //   //     value: 4
  //   //   }
  //   // ])
  //   //
  //   // history.undo()
  //   // history.undo()
  //   //
  //   // expect(history.deltas.length).toEqual(4)
  //   //
  //   // history.debounceRecord([
  //   //   {
  //   //     path: 'a',
  //   //     value: 5
  //   //   }
  //   // ])
  //   // history.undo()
  //   // history.redo()
  //   // expect(history.tree).toEqual({
  //   //   a: 5
  //   // })
  //   //
  //   // history.undo()
  //   //
  //   // expect(history.deltas.length).toEqual(3)
  // })
})
