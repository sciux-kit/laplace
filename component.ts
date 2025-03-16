import * as t from 'yup'
import type { RenderAttribute, RenderElementNode } from './render'


export type RenderFn = () => any

export type DefineComponent = {
  name: string
  props?: t.ObjectShape
  setup?: (props: Record<string, any>, emit: (event: string, ...args: any[]) => void) => RenderFn
}

export function defineComponent<const T extends DefineComponent>(options: T): T {
  return options
}


const a = defineComponent({
  name: 'button',
  props: {
    type: t.string()
  },
  setup(props, emit) {
    return () => {
      
    }
  }
})

export type ResolvedNodeAttribute = {
  statics: Record<string, string>
  bind: Record<string, string>
  listeners: Record<string, string>
  directive: Record<string, string>
}

export function resolveNodeAttribute(attr: RenderAttribute[]): ResolvedNodeAttribute {
  const statics: Record<string, string> = {}
  const bind: Record<string, string> = {}
  const listeners: Record<string, string> = {}
  const directive: Record<string, string> = {}

  for (const a of attr) {
    if (a.type === 'static') {
      statics[a.name] = a.value
    } else if (a.type === 'bind') {
      bind[a.name] = a.value
    } else if (a.type === 'on') {
      listeners[a.name] = a.value
    } else if (a.type === 'directive') {
      directive[a.name] = a.value
    }
  }

  return {
    statics,
    bind,
    listeners,
    directive
  }
}

export function createComponentInstance(proto: DefineComponent, node: RenderElementNode) {
  const resolved = resolveNodeAttribute(node.attributes)
  const instance = {
    proto,
    resolvedAttributes: resolved,
    children: node.children,
    emit: () => {}
  }
}