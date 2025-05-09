import { reactive, shallowReactive, toRefs, toValue, unref } from "@vue/reactivity"
import { toDisplayString } from "@vue/shared"
import { MaybeRefOrGetter } from "@vue/reactivity"
import { effect } from "@vue/reactivity"
import { parse } from "./parser"

// eslint-disable-next-line antfu/top-level-function
export const noop = () => {}

export function sciux(literal: TemplateStringsArray, ...values: MaybeRefOrGetter<unknown>[])/* : Node[] */ {
  const uid = Math.round(performance.now() * 100)
  const src = literal.reduce((acc, v, i) => {
    return `${acc}${v}${i == literal.length - 1 ? '' : `(:$_SciuxEnv_${uid}_${i}_)`}`
  }, '').trim()
  const ast = parse(src)

  // const o = values.reduce<Context>((acc, v, i) => {
  //   acc[`:$_SciuxEnv_${uid}_${i}_`] = v
  //   return acc
  // }, {})

  // return renderRoots(ast, undefined, hasContext() ? shallowReactive(Object.assign(o, toRefs(getCurrentContext()))) : o)[0]
}

export default function isPlainObject(obj: any) {
  if (typeof obj !== 'object' || obj === null)
    return false

  let proto = obj
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }

  return Object.getPrototypeOf(obj) === proto
}
