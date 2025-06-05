import type { MaybeRef, Ref, ToRefs } from '@vue/reactivity'
import { WatchSource, computed, effect, ref, toRef, toRefs, toValue, unref } from '@vue/reactivity'
import { type } from 'arktype'
import patch from 'morphdom'
import type { Component } from './component'
import type { Flow } from './flow'
import type { BaseNode, ElementNode, FragmentNode, ParseOptions, TextNode, ValueNode } from './parser'
import { NodeType, TextMode, parse } from './parser'

// eslint-disable-next-line ts/no-empty-object-type
export const components = new Map<string, Component<string, any, {}>>()
export const flows = new Map<string, Flow>()
export const textModes = new Map<string, TextMode>()

export const textModeResolver = (name: string) => textModes.get(name) ?? TextMode.DATA

export const globals: Context = {}
export function addGlobals(additional: Context) {
  Object.assign(globals, additional)
}

export type Context = Record<string, MaybeRef<unknown>>
// eslint-disable-next-line import/no-mutable-exports
export let activeContext: Context = {}
export function addActiveContext(additional: Context) {
  activeContext = { ...activeContext, ...additional }
}
export function getContext() {
  return activeContext
}

export type MaybeArray<T> = T | T[]
export function toArray<T>(o: MaybeArray<T>): T[] {
  return Array.isArray(o) ? o : [o]
}

export function unwrapRefs(o: Context): Record<string, unknown> {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => {
    if (typeof v === 'function') {
      return [k, v]
    }
    return [k, toValue(v)]
  }))
}
export function resolve(o: Record<string, unknown>): ToRefs<Record<string, unknown>> {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k.replace(/^([:#@])/, ''), ref(toValue(v))]))
}

export function createProcessor(o: Context): (source: string) => unknown {
  return (source) => {
    if (typeof source === 'string') {
      return _createProcessor(o)(source, o)
    }
    else {
      throw new TypeError('invalid source')
    }
  }
}
export function _createProcessor<T extends Context>(o: T): (source: string, context?: T) => unknown {
  return (source, ctx?) => {
    // eslint-disable-next-line no-new-func
    const adhoc = new Function(`return (function($__eich_ctx){with($__eich_ctx){return (${source});}});`)() as any
    if (ctx == null && o == null) {
      throw new TypeError('missing context')
    }

    return ref(adhoc(unwrapRefs(ctx ?? o)))
  }
}

export function createDelegate(
  processor: ReturnType<typeof createProcessor>,
) {
  return (attrs: Attrs, node: Node) => {
    for (const [key, value] of Object.entries(attrs)) {
      if (!key.startsWith('@'))
        continue
      const event = key.slice(1)
      const wrapped = `function(){ ${value} }`
      const handler = processor!(wrapped) as EventListenerOrEventListenerObject
      node.addEventListener(event, unref(handler))
    }
  }
}

export type AttrSource = string | ExprAttrSource | FlowAttrSource | EventAttrSource
export type ExprAttrSource = `:${string}`
export type FlowAttrSource = `#${string}`
export type EventAttrSource = `@${string}`

export const FLOW = Symbol('flow')
export type FlowAttr = [typeof FLOW, Flow]
export const EVENT = Symbol('event')
export type EventAttr = [typeof EVENT, Event]
export type Attr = unknown | FlowAttr | EventAttr
export type Attrs = Record<string, Attr>
export function useAttrs(attrSources: Record<string, AttrSource>, context: Context, processor?: ReturnType<typeof createProcessor>): Attrs {
  return Object.fromEntries(Object.entries(attrSources).map(([k, v]) => [k, useAttr(k, v, context, processor)])) as Attrs
}
export function useAttr(key: string, source: string, context: Context, processor?: ReturnType<typeof createProcessor>) {
  if (key.startsWith(':')) {
    return useExprAttr(source as ExprAttrSource, context, processor)
  }
  else if (key.startsWith('#')) {
    return useFlowAttr(source as FlowAttrSource, context)
  }
  else if (key.startsWith('@')) {
    return useEventAttr(source as EventAttrSource, context)
  }
  else {
    return source
  }
}
export function useExprAttr(source: ExprAttrSource, context: Context, processor?: ReturnType<typeof createProcessor>) {
  return processor!(source)
}
export function useFlowAttr(_source: FlowAttrSource, _context: Context) {
}
export function useEventAttr(_source: EventAttrSource, _context: Context, _processor?: ReturnType<typeof createProcessor>) {
  return _source
}
export function getCommonAttrs(attrs: Attrs) {
  return Object.fromEntries(Object.entries(attrs).filter(([_, v]) => !(Array.isArray(v) && (v[0] === FLOW || v[0] === EVENT))))
}

export function renderComp(element: ElementNode) {
  const comp = components.get(element.tag)
  if (!comp) {
    console.warn(`[sciux laplace] component <${element.tag}> not found`)
    return null
  }

  return _renderComp(comp, element)
}
export function _renderComp<T extends string, A extends Record<string, unknown>>(comp: Component<T, A>, element: ElementNode): Node | null {
  const processor = createProcessor(activeContext)
  const delegate = createDelegate(processor)
  const originalAttrs = useAttrs(
    Object.fromEntries(element.attributes.map(({ name, value }) => [name, value])),
    unwrapRefs(activeContext),
    processor,
  )
  const attributes = resolve(
    getCommonAttrs(originalAttrs),
  )
  // TODO: Compute

  // if (typedAttrs(unwrapRefs(attributes)) instanceof type.errors) {
  //   throw new Error(`[sciux laplace] component <${element.tag}> attributes do not match expected type ${typedAttrs.toString()}`)
  // }

  const { name, attrs: _typedAttrs, setup, provides, globals: compGlobals, defaults, animations } = comp(attributes as ToRefs<A>, activeContext)
  for (const [key, value] of Object.entries(defaults ?? {})) {
    if (!(key in attributes)) {
      attributes[key] = computed(() => value)
    }
  }

  addActiveContext(compGlobals ?? {})
  if (name !== element.tag) {
    throw new Error(`[sciux laplace] component <${element.tag}> does not match <${name}>`)
  }

  const oldContext = activeContext

  addActiveContext(provides ?? {})
  addActiveContext(animations ?? {})

  if (!setup)
    return null
  const childrenProcessor = createProcessor(activeContext)
  const node = setup(
    () => renderRoots(element.children, childrenProcessor),
  )
  console.log('originalAttrs', originalAttrs, element.attributes)
  delegate(originalAttrs, node)
  effect(() => {
    const newNode = setup(
      () => renderRoots(element.children, childrenProcessor),
    )
    patch(node, newNode)
  })
  activeContext = oldContext

  return node
}

export function renderValue(value: string) {
  const interalContext = getContext()
  const node = document.createTextNode((createProcessor(unwrapRefs(interalContext))(value) as Ref).value.toString())
  effect(() => {
    node.textContent = (createProcessor(unwrapRefs(interalContext))(value) as Ref).value.toString()
  })
  return node
}

export function renderText(text: string) {
  return document.createTextNode(text)
}

export function renderNode(node: BaseNode, processor: ReturnType<typeof createProcessor> = createProcessor(activeContext)): Node | Node[] {
  if (node.type === NodeType.TEXT) {
    return renderText((node as TextNode).content)
  }
  else if (node.type === NodeType.VALUE) {
    return renderValue((node as ValueNode).value)
  }
  else if (node.type === NodeType.ELEMENT) {
    const elementNode = node as ElementNode
    const originalAttrs = elementNode.attributes
    let flowAttrs = elementNode.attributes.filter(attr => attr.name.startsWith('#'))

    let result: Node | Node[] | null = null
    // Pre-flow
    if (flowAttrs.length <= 0) {
      result = renderComp(elementNode)
    }
    else {
      const { name, value } = flowAttrs[0]
      const flow = flows.get(name.slice(1))?.(processor)
      if (flow && flow.type === 'pre') {
        flowAttrs = (node as ElementNode).attributes = (node as ElementNode).attributes.filter(attr => attr.name !== name)

        result = flow.flow(value, node, renderNode)
      }
    }
    if (!result)
      result = renderComp(elementNode)
    for (const attr of flowAttrs) {
      const { name: nameSource, value } = attr
      const [name, ...rest] = nameSource.split('.')
      const flow = flows.get(name.slice(1))?.(processor, ...rest)
      if (flow && flow.type === 'post') {
        const nodes = toArray(result)

        for (const n of nodes) {
          flow.flow(value, n!, node)
        }
      }
      //
    }
    (node as ElementNode).attributes = originalAttrs

    if (result)
      return result
    else
      return []
  }
  else if (node.type === NodeType.COMMENT) {
    return []
  }
  else if (node.type === NodeType.FRAGMENT) {
    return (node as FragmentNode).children.map(x => renderNode(x)).flatMap(x => x)
  }
  throw new Error('Unreachable')
}

export function renderRoots(roots: BaseNode[], processor?: ReturnType<typeof createProcessor>) {
  const nodes: Node[] = []
  roots.forEach((root) => {
    const result = renderNode(root, processor)
    if (Array.isArray(result)) {
      nodes.push(...result)
    }
    else {
      nodes.push(result)
    }
  })
  return nodes
}

export function render(source: string, target?: Node, parseOptions: ParseOptions = {}) {
  const ast = parse(source, {
    resolver: textModeResolver,
    ...parseOptions,
  })

  const nodes = renderRoots(ast.children)

  nodes.forEach((node) => {
    if (node)
      target?.appendChild(node)
  })
}
