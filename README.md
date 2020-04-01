# Json Store

A plugin can `redo`, `undo` nested JSON data.

Including [jsondiffpatch](https://github.com/benjamine/jsondiffpatch) but without the formatter.

```javascript
const tree = {
  1: [1, 3],
  a: [{}, { 1: 3 }],
  b: { c: 5, d: { e: 6 }}
}

const history = new JsonHistory({
  tree: JSON.parse(JSON.stringify(tree))
})

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
```
