# json-history
A plugin can `redo`, `undo` deep nested JSON.
**Vue** or **React** friendly.

The source code still messy but works fine. Will refactor when I have time.

#### Including [jsondiffpatch](https://github.com/benjamine/jsondiffpatch) but without the formatter.

### Options
```javascript
new JsonHistory({
  tree = {}, 
  steps = 50, // how many steps can redo 
  backUpDeltas = [], // can backup the previous deltas
  callback = {
    onRecorded() {},
    onEachPatch() {},
    onUndo() {},
    onUndid() {},
    onRedo() {},
    onRedid() {},
  }, 
  jsonDiffPatchOptions = {}, // check jsondiffpatch plugin  
  setter(tree, key, value) {
    Vue.set(tree, key, value)
  },
  deleter(tree, key) {
    Vue.delete(tree, key)
  }
})
```
### Record / Redo / Undo
Update any value of object or array by multi records. Can `redo` or `undo` after `record`.

Accept array or an object.
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
  a: [{}, {1: 3}],
  b: {c: 5, d: {e: 6}}
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
  a: [{}, {1: 3}],
  b: {c: 5, d: {e: 6}}
})

history.record([{
  path: 'a.b',
  value: 123
}])

expect(history.tree).toEqual({
  1: [1, 3, null, null, [], [1, 2, 3]],
  a: { b: 123 },
  b: {c: 5, d: {e: 6}}
})

expect(history.deltas.length).toEqual(3)

history.undo()
history.redo()
history.undo()
history.undo()
history.undo()
expect(history.tree).toEqual(tree)
```

### Delete
Delate object key.

Same as `record` with `undefined` value.
```javascript
const tree = {
  1: [1, 3],
  a: [{}, { 1: 3 }],
  b: { c: 5, d: { e: 6 }}
}

const history = new JsonHistory({
  tree: JSON.parse(JSON.stringify(tree))
})

history.delete([{
  path: '1'
}])

expect(history.tree).toEqual({
  a: [{}, {1: 3}],
  b: {c: 5, d: {e: 6}}
})
```

### Snapshot
Replace the whole tree and record a step.

```javascript
const history = new JsonHistory({
  tree: JSON.parse(JSON.stringify(tree))
})

history.snapShot([1, { a: 4 }])

expect(history.tree).toEqual([1, { a: 4 }])

history.undo()

expect(history.tree).toEqual([1, 2, 3])
```

### Merge records
Can merge multi actions, such as `delete` or `record`.

```javascript
const tree = {
  1: [1, 3],
  a: [{}, { 1: 3 }],
  b: { c: 5, d: { e: 6 }}
}

const history = new JsonHistory({
  tree: JSON.parse(JSON.stringify(tree))
})

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
```

### More cases
https://github.com/lustan3216/json-history/tree/master/tests
