import { Ref, ToRefs, WatchSource } from "@vue/reactivity"
import { Type } from 'arktype'
import { Context } from "./renderer"

export type ComponentChildren = () => Node[]
export type ComponentSetup = (children: ComponentChildren) => Node
export type Component<
  T extends string,
  A extends Record<string, unknown>,
  C extends Context = {}
  > = (context: C, attrs: ToRefs<A>) => {
  name: T,
  attrs: Type<A>,
  setup: ComponentSetup,
  provides: Record<string, Ref<unknown>>
  globals: Record<string, Ref<unknown>>
}

export function defineComponent<T extends string, A extends Record<string, unknown>, C extends Context = {}>(comp: Component<T, A, C>) {
  return comp
}
