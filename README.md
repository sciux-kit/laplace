<div align="center">
  <h1>Sciux Laplace</h1>
  <p>AI-native graphics DSL renderer</p>
</div>

## About

About more details, please refer to [Sciux Library](https://github.com/sciux-kit/lib) to get more information about Sciux.

## Installation

```bash
npm install sciux-laplace
yarn add sciux-laplace
pnpm add sciux-laplace
bun add sciux-laplace
```

## Usage

```typescript
import { parse, root, renderRoots, render, defineComponent } from 'sciux-laplace'
import { type } from 'arktype'

const T = type({
  name: 'string',
})
const comp = defineComponent<'comp', typeof T.infer>((attrs) => {
  return {
    name: 'comp',
    attrs: T,
    setup(children) {
      const div = document.createElement('div')
      div.innerHTML = `Hello, ${attrs.name}!`
      return div
    },
  }
})
root.set('comp', comp)

const source = `<comp name="world" />`

// Parse and render
const ast = parse(source)
const roots = renderRoots(ast)
document.body.append(...roots)

// Or render directly
render(source, document.body)
```

## Project Used

- [@vue/reactivity](https://github.com/vuejs/core) VueJs core package, provide powerful reactive system for sciux renderer.
- [arktype](https://github.com/ArkType/arktype) TypeScript-first schema validation library.
- [morphdom](https://github.com/patrick-steele-idem/morphdom) Fast DOM diffing for real DOM nodes.

***Copyright (c) 2025-present**, Sciux Community & BijonAI Team. All rights reserved.*

