import { type Reactive, reactive, toRefs } from '@vue/reactivity'
import patch from 'morphdom'
import { type SciuxBasicNode, type SciuxSourceNode, isSciuxTextNode, parse } from './resolver'

const kCompOptions = Symbol('Component Options')

export type Attributes = Record<string, any>
export type Context = Reactive<Record<string, any>>
export type ComponentOptions = Record<string, any>
export type Component<T extends Attributes = Attributes, O extends ComponentOptions = ComponentOptions> = ComponentFn<T> & { [kCompOptions]: Partial<O> }
export type ComponentFn<T extends Attributes = Attributes> =
  (props: T, children: () => Node[], node: SciuxSourceNode) => Node | Node[] | void

export const builtins = new Map<string, Component<any>>()

export type PreMiddleware = (node: SciuxSourceNode, context: Context) => void
export type PostMiddleware = (node: SciuxSourceNode, context: Context, domNode: Node | Node[], comp: Component<any, any>) => void
export const middlewares = {
  pre: new Map<string, PreMiddleware>(),
  post: new Map<string, PostMiddleware>(),
} as const

let activeContext: Context | null = null

export { patch }

export function hasContext(): boolean {
  return activeContext != null
}

export function getCurrentContext(): Context {
  if (activeContext == null) {
    throw new Error('no active context')
  }

  return activeContext
}

export function setCurrentContext(context: Context): void {
  activeContext = context
}

export function provideWith(children: () => Node[], context: Context): Node[] {
  return runInContext(
    context,
    children,
  )
}

export function mergeContext(target: Context, from: Context): Context {
  return reactive(Object.assign(toRefs(target), toRefs(from)))
}

export function runInContext<T extends Context, R>(
  context: T,
  fn: () => R,
): R {
  const oldContext = activeContext
  activeContext = context
  try {
    return fn()
  }
  finally {
    activeContext = oldContext
  }
}

export function createAdhoc<T = unknown>(src: string, context: Context): () => T
export function createAdhoc<T = unknown>(src: string): (context?: Context) => T
export function createAdhoc<T = unknown>(src: string, context?: Context): (context?: Context) => T
export function createAdhoc<T = unknown>(src: string, context?: Context): (context?: Context) => T {
  // eslint-disable-next-line no-new-func
  const adhoc = new Function(`return (function($__sciux_ctx){with($__sciux_ctx){return (${src});}});`)() as any
  return (ctx) => {
    if (ctx == null && context == null) {
      throw new TypeError('missing context')
    }

    return adhoc(ctx ?? context!)
  }
}

const noopComp = defineComponent(
  (_, children, node) => {
    if (node.tag != 'noop') {
      console.warn(`[sciux] ignoring <${String(node.tag)}>, instead of using <noop>`)
    }
    return children()
  },
)

builtins.set('fragment', noopComp)
builtins.set('noop', noopComp)

export function renderComp(comp: Component<any>, node: SciuxBasicNode): Node | Node[] {
  return comp(node.attrs, () => node.children.flatMap(renderNode), node) ?? []
}

export function renderNode(node: SciuxSourceNode): Node | Node[] {
  const context = getCurrentContext()

  if (middlewares.pre.size > 0) {
    middlewares.pre.forEach((middleware) => {
      middleware(node, context)
    })
  }

  let domNode: Node | Node[]
  let comp: Component<any, any>

  if (isSciuxTextNode(node)) {
    domNode = document.createTextNode(node.value)
  }
  else if (builtins.has(node.tag)) {
    comp = builtins.get(node.tag)!
    domNode = renderComp(comp, node)
  }
  else {
    comp = noopComp
    domNode = renderComp(comp, node)
  }

  if (domNode == null) {
    domNode = []
  }


  if (middlewares.post.size > 0) {
    middlewares.post.forEach((middleware) => {
      middleware(node, context, domNode, comp)
    })
  }

  node.raw.domNode = domNode

  return domNode
}

export function renderRoots(roots: SciuxSourceNode[], target?: Node, initialContext: Reactive<Context> = {}): [Node[], Reactive<Context>] {
  const context = reactive(initialContext)
  const children = runInContext(context, () => roots.flatMap(renderNode))
  if (target) {
    children.forEach(child => target.appendChild(child))
  }
  return [children, context]
}

export function render(source: string, target?: Node, initialContext: Reactive<Context> = {}): [Node[], Reactive<Context>] {
  const ast = parse(source)
  return renderRoots(ast, target, initialContext)
}

export function getComponentOptions<T extends ComponentOptions>(o: Component<any, any>): Partial<T> | undefined {
  return o[kCompOptions]
}

// eslint-disable-next-line ts/no-empty-object-type
export function defineComponent<T extends Attributes = Attributes, O extends ComponentOptions = {}>(comp: ComponentFn<T>, options: Partial<O> = {} as O): Component<T, O> {
  return Object.assign(comp, { [kCompOptions]: options })
}

export { textMode } from './resolver'

export function defineMiddleware({ type, fn }: { type: 'pre', fn: PreMiddleware }): PreMiddleware
export function defineMiddleware({ type, fn }: { type: 'post', fn: PostMiddleware }): PostMiddleware
export function defineMiddleware({ fn }: { type: 'pre' | 'post', fn: PreMiddleware | PostMiddleware }): PreMiddleware | PostMiddleware {
  return fn
}
