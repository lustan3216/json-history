import JsonHistory from "../src"

const a = '{"10":{"tag":"form-textarea","id":10,"parentId":9},"11":{"tag":"grid-item","x":0,"y":58,"w":9,"h":15,"id":11,"parentId":8},"12":{"tag":"form-checkbox","id":12,"parentId":11,"value":["example1"]},"13":{"tag":"grid-item","x":0,"y":73,"w":7,"h":35,"id":13,"parentId":8},"14":{"tag":"form-slider","id":14,"parentId":13},"15":{"tag":"grid-item","x":0,"y":45,"w":9,"h":13,"id":15,"parentId":8},"16":{"tag":"form-submit","id":16,"parentId":15}}'

describe('real nodes', () => {
  let history

  beforeEach(() => {
    history = new JsonHistory({
      tree: JSON.parse(a)
    })
  })

  test('regex length date', () => {
    history.record([
      {
        path: 10,
        value: { value: undefined }
      }, {
        path: 12,
        value: { value: ["example1"] }
      }, {
        path: 14,
        value: { value: undefined }
      }
    ])

    expect(history.tree).toEqual({
      1: [1, 3],
      a: {
        length: {
          length: {}
        }
      }
    })
  })
})
