import type { Ref, ToRefs } from '@vue/reactivity'
import { WatchSource } from '@vue/reactivity'
import type { Type } from 'arktype'
import type { Context } from './renderer'
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
  provides?: Record<string, Ref<unknown>>
  globals?: Record<string, Ref<unknown>>
  animations?: Record<string, Animation<string[]>>
}

// eslint-disable-next-line ts/no-empty-object-type
export function defineComponent<T extends string, A extends Record<string, unknown>, C extends Context = {}>(comp: Component<T, A, C>) {
  return comp
}
