import { computed, effect, MaybeRef, ref, Ref, toRef, toRefs, ToRefs, toValue, WatchSource } from "@vue/reactivity";
import { Component } from "./component";
import { type } from 'arktype'
import patch from 'morphdom'
import { Flow } from "./flow";
import { BaseNode, ElementNode, NodeType, parse, TextNode, ValueNode } from "./parser";

export const components = new Map<string, Component<string, any, {}>>()
export const flows = new Map<string, Flow>()

export const globals: Context = {}
export function addGlobals(additional: Context) {
  Object.assign(globals, additional)
}

export type Context = Record<string, MaybeRef<unknown>>
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
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, toValue(v)]))
}
export function resolve(o: Record<string, unknown>): ToRefs<Record<string, unknown>> {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k.replace(/^(:|#|@)/, ''), /* computed(() => toValue(v))]) */ ref(toValue(v))]))
}

export function createProcessor(o: Context): (source: string) => unknown {
  return (source) => {
    if (typeof source === "string") {
      return _createProcessor(o)(source, o)
    } else {
      throw new TypeError('invalid source')
    }
  }
}
export function _createProcessor<T extends Context>(o: T): (source: string, context?: T) => unknown {
  // eslint-disable-next-line no-new-func
  return (source, ctx?) => {
    const adhoc = new Function(`return (function($__eich_ctx){with($__eich_ctx){return (${source});}});`)() as any
    if (ctx == null && o == null) {
      throw new TypeError('missing context')
    }

    return computed(() => adhoc(unwrapRefs(ctx ?? o)))
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
  } else if (key.startsWith('#')) {
    return useFlowAttr(source as FlowAttrSource, context)
  } else if (key.startsWith('@')) {
    return useEventAttr(source as EventAttrSource, context)
  } else {
    return source
  }
}
export function useExprAttr(source: ExprAttrSource, context: Context, processor?: ReturnType<typeof createProcessor>) {
  return processor!(source)
}
export function useFlowAttr(source: FlowAttrSource, context: Context) {
}
export function useEventAttr(source: EventAttrSource, context: Context) {
}
export function getCommonAttrs(attrs: Attrs) {
  return Object.fromEntries(Object.entries(attrs).filter(([_, v]) => !(Array.isArray(v) && (v[0] === FLOW || v[0] === EVENT))))
}

export function renderComp(element: ElementNode) {
  const comp = components.get(element.tag)
  if (!comp) {
    throw new Error(`[sciux laplace] component <${element.tag}> not found`)
  }

  return _renderComp(comp, element)
}
export function _renderComp<T extends string, A extends Record<string, unknown>>(comp: Component<T, A>, element: ElementNode) {


  const processor = createProcessor(activeContext)
  const originalAttrs = useAttrs(
    Object.fromEntries(element.attributes.map(({ name, value }) => [name, value])),
    unwrapRefs(activeContext),
    processor
  )
  // 
  const attributes = resolve(
    getCommonAttrs(originalAttrs)
  )
  // TODO: Compute

  // if (typedAttrs(unwrapRefs(attributes)) instanceof type.errors) {
  //   throw new Error(`[sciux laplace] component <${element.tag}> attributes do not match expected type ${typedAttrs.toString()}`)
  // }

  const { name, attrs: typedAttrs, setup, provides, globals: compGlobals } = comp(attributes as ToRefs<A>, activeContext)
  addActiveContext(compGlobals ?? {})
  if (name !== element.tag) {
    throw new Error(`[sciux laplace] component <${element.tag}> does not match <${name}>`)
  }

  const oldContext = activeContext
  console.log('oldContext', oldContext)
  addActiveContext(provides ?? {})

  console.log('activeContext', activeContext)

  const childrenProcessor = createProcessor(activeContext)
  const node = setup(
    () => renderRoots(element.children, childrenProcessor)
  )
  effect(() => {

    console.log('activeContext', activeContext)
    const newNode = setup(
      () => renderRoots(element.children, childrenProcessor)
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
  } else if (node.type === NodeType.VALUE) {
    return renderValue((node as ValueNode).value)
  } else if (node.type === NodeType.ELEMENT) {
    const elementNode = node as ElementNode
    const originalAttrs = elementNode.attributes
    let flowAttrs = elementNode.attributes.filter(attr => attr.name.startsWith('#'))

    let result: Node | Node[] | null = null
    // Pre-flow
    if (flowAttrs.length <= 0) {
      result = renderComp(elementNode)
    } else {
      const { name, value } = flowAttrs[0]
      const flow = flows.get(name.slice(1))?.(processor)
      if (flow && flow.type === 'pre') {
        console.error(name, (node as ElementNode).attributes.filter(attr => attr.name !== name));
        flowAttrs = (node as ElementNode).attributes = (node as ElementNode).attributes.filter(attr => attr.name !== name)
        console.error(node, flowAttrs)
        result = flow.flow(value, node, renderNode)
      }
    }
    for (const attr of flowAttrs) {
      const { name, value } = attr
      const flow = flows.get(name.slice(1))?.(processor)
      if (flow && flow.type === 'post') {
        const nodes = toArray(result)
        for (const n of nodes) {
          flow.flow(value, n!)
        }
      }
    }
    (node as ElementNode).attributes = originalAttrs;
    return result!
  }
  throw new Error('Unreachable')
}

export function renderRoots(roots: BaseNode[], processor?: ReturnType<typeof createProcessor>) {
  const nodes: Node[] = []
  roots.forEach(root => {
    const result = renderNode(root, processor)
    if (Array.isArray(result)) {
      nodes.push(...result)
    } else {
      nodes.push(result)
    }
  })
  return nodes
}

export function render(source: string, target?: Node) {
  const ast = parse(source)

  const nodes = renderRoots(ast.children)

  nodes.forEach(node => { if (node) target?.appendChild(node) })
}
