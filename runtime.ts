// @ts-nocheck


import { reactive, effect, toRefs, computed } from '@vue/reactivity'

export type AdhocFn = (o: any) => any

export function createContext(context?: Record<string, any>) {
  return reactive(context ?? {})
}

export function createText(content: string) {
  return document.createTextNode(content)
}

export function createInterpolation(context: any, fn: AdhocFn) {
  const node = document.createTextNode('')
  effect(() => {
    node.textContent = fn(context)
  })
  return node
}

export function createFragment(...children: ChildNode[]) {
  const fragment = document.createDocumentFragment()
  fragment.append(...children)
  console.trace(children, fragment)

  return fragment
}

export function createComment(content: string) {
  return document.createComment(content)
}

export function createIf(context: any, o: any) {
  let oldNode: ChildNode | null = null
  const rerun = () => {
    let out = null
    for (let i = 0; i < o.__n; i += 1) {
      const [condition, child] = o[i]
      if (condition(context)) {
        if (!out) {
          out = child(context)
        }
      }
    }
    if (!out) {
      out = o.__else?.(context)
    }
    oldNode?.replaceWith(out)
    oldNode = out
  }
  effect(rerun)

  return oldNode
}

export function createFor(context: any, target: AdhocFn, o: any, children: any) {
  let node: ChildNode = o(context)
  effect(() => {
    node.childNodes.forEach(child => child.remove())

    const i = target(context)
    if (Array.isArray(i)) {
      console.log(i)
      i.forEach((item, index) => node.appendChild(children(context, item, index, index)))
    }
    else if (typeof i === 'object') {
      Object.entries(i).forEach(([key, value], i) => node.appendChild(children(context, value, key, i)))
    }
  })
  return node
}

export function createExpression(context: any, fn: AdhocFn) {
  return (o?: any) => fn(o ?? context)
}

export function mergeContext(context: any, o: any) {
  const ctx = Object.assign({}, toRefs(context))
  for (const key in o) {
    if (typeof o[key] === 'function') {
      ctx[key] = computed(() => o[key](context))
    }
    else {
      ctx[key] = o[key]
    }
  }
  return reactive(ctx)
}

export function createElement(name: string, attrs?: Record<string, string>, ...children: ChildNode[]) {
  const el = document.createElement(name)
  for (const [key, value] of Object.entries(attrs ?? {})) {
    el.setAttribute(key, value)
  }

  children?.forEach(child => child && el.appendChild(child))
  return el
}

export function createDocument(...children: ChildNode[]) {
  return createFragment(...children)
}

// Test

export const __template = __parentContext => {
  const __context = createContext(__parentContext);
  const __root = (() => createDocument(createComment(' Document Global Scope '), (__context => createFragment(createComment(' Scope 0 Start'), (__context => createFragment(createFor(__context, createExpression(__context, ({list}) => list), __context => createElement('block', {}, null), (__context, _, i) => createFragment(createIf(__context, {
    __n: 1,
    0: [createExpression(__context, () => i % 2 === 0), __context => createElement('block', {}, createInterpolation(__context, createExpression(__context, () => i)))],
    __else: __context => createElement('block', {}, createText(`No`))
  }))), createComment(' Scope 0 End')))(mergeContext(__context, {
    list: createExpression(__context, ({foo}) => Array.from({ length: foo }))
  }))))(mergeContext(__context, {
    foo: createExpression(__context, () => 10)
  }))))();
  return __root;
};