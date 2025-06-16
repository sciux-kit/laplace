import type { Ref, ToRefs } from '@vue/reactivity'
import { WatchSource } from '@vue/reactivity'
import type { Type } from 'arktype'
import type { ComponentSpace, Context } from './renderer'
import type { Animation } from './flows/animation'

export type ComponentChildren = () => Node[]
export type ComponentSetup = (children: ComponentChildren) => Node
export type Component<
  T extends string,
  A extends Record<string, unknown>,
  // eslint-disable-next-line ts/no-empty-object-type
  C extends Context = {},
> = (attrs: ToRefs<A>, context: C) => {
  name: T
  attrs?: Type<A>
  setup?: ComponentSetup
  defaults?: Partial<A>
  provides?: Record<string, unknown>
  globals?: Record<string, unknown>
  space?: ComponentSpace
}

// eslint-disable-next-line ts/no-empty-object-type
export function defineComponent<T extends string, A extends Record<string, unknown>, C extends Context = {}>(comp: Component<T, A, C>) {
  return comp
}

export function withSpace<
  Name extends string,
  Attrs extends Record<string, unknown>,
  C extends Context,
>(comp: Component<Name, Attrs, C>, space: ComponentSpace) {
  return defineComponent<Name, Attrs, C>((attrs, context) => {
    const component = comp(attrs, context)
    if (!component.space) {
      component.space = space
    }
    for (const [key, value] of space.entries()) {
      component.space.set(key, value)
    }
    return component
  })
}
