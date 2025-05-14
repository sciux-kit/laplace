import { computed, effect, MaybeRef, ref, Ref, toRef, ToRefs, toValue } from "@vue/reactivity";
import { Component } from "./component";
import { type } from 'arktype'
import patch from 'morphdom'
import { Flow } from "./flow";
import { BaseNode, ElementNode, NodeType, parse, TextNode, ValueNode } from "./parser";

export const components = new Map<string, Component<string, any, {}>>()
export const globals: Context = {}
export function addGlobals(additional: Context) {
  Object.assign(globals, additional)
}

export type Context = Record<string, MaybeRef<unknown>>
export let activeContext: Context = {}
export function addActiveContext(additional: Context) {
  activeContext = { ...activeContext, ...additional }
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

    return computed(() => adhoc(ctx ?? o))
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
export function useAttrs(attrSources: Record<string, AttrSource>, context: Context): Attrs {
  console.log('attrs-source', attrSources)
  return Object.fromEntries(Object.entries(attrSources).map(([k, v]) => [k, useAttr(k, v, context)])) as Attrs
}
export function useAttr(key: string, source: string, context: Context) {
  if (key.startsWith(':')) {
    return useExprAttr(source as ExprAttrSource, context)
  } else if (key.startsWith('#')) {
    return useFlowAttr(source as FlowAttrSource, context)
  } else if (key.startsWith('@')) {
    return useEventAttr(source as EventAttrSource, context)
  } else {
    return source
  }
}
export function useExprAttr(source: ExprAttrSource, context: Context) {
  return createProcessor(context)(source)
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

  console.log('origin-attrs:', element.attributes)
  const originalAttrs = useAttrs(
    Object.fromEntries(element.attributes.map(({ name, value }) => [name, value])),
    unwrapRefs(activeContext)
  )
  // console.log('original-attrs:', originalAttrs)
  const attributes = resolve(
    getCommonAttrs(originalAttrs)
  )
  // TODO: Compute
  console.log('attributes:', attributes)
  // if (typedAttrs(unwrapRefs(attributes)) instanceof type.errors) {
  //   throw new Error(`[sciux laplace] component <${element.tag}> attributes do not match expected type ${typedAttrs.toString()}`)
  // }

  const { name, attrs: typedAttrs, setup, provides, globals: compGlobals } = comp(activeContext, attributes as ToRefs<A>)
  addActiveContext(compGlobals)
  if (name !== element.tag) {
    throw new Error(`[sciux laplace] component <${element.tag}> does not match <${name}>`)
  }

  const oldContext = activeContext
  addActiveContext(provides)
  console.log('activeContext:', activeContext)
  const node = setup(
    () => renderRoots(element.children)
  )
  effect(() => {
    console.log('effect')
    const newNode = setup(
      () => renderRoots(element.children)
    )
    patch(node, newNode)
  })
  activeContext = oldContext

  return node
}

export function renderValue(value: string) {
  const v = createProcessor(activeContext)(value)
  return document.createTextNode(v!.toString())
}

export function renderText(text: string) {
  return document.createTextNode(text)
}

export function renderNode(node: BaseNode) {
  if (node.type === NodeType.TEXT) {
    return renderText((node as TextNode).content)
  } else if (node.type === NodeType.VALUE) {
    return renderValue((node as ValueNode).value)
  } else if (node.type === NodeType.ELEMENT) {
    return renderComp(node as ElementNode)
  }
}

export function renderRoots(roots: BaseNode[], initialContext: Context = {}) {
  const nodes: Node[] = []
  roots.forEach(root => {
    nodes.push(renderNode(root)!)
  })
  return nodes
}

export function render(source: string, target?: Node, initialContext: Context = {}) {
  const ast = parse(source)
  console.log('ast:', ast)
  const nodes = renderRoots(ast.children, initialContext)
  nodes.forEach(node => target?.appendChild(node))
}
