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

  test('complicated path', () => {
    history.record([
      {
        path: 'a.$w[%]q.1[!33][#2][1].#3[12:3]:3.:6',
        value: 1
      }
    ])

    expect(history.deltas.length).toEqual(1)

    expect(history.tree).toEqual({
      "1": [],
      "a": {
        "$w": {
          "[%]q": {
            "1": {
              "[!33]": {
                "[#2]": [
                  null,
                  {
                    "#3": {
                      "[12:3]:3": {
                        ":6": 1
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        "length": {
          "length": {}
        }
      }
    })
  })
})
