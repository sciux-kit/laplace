import { MaybeRefOrGetter, effect, reactive, shallowReactive, toRefs, toValue, unref } from '@vue/reactivity'
import { toDisplayString } from '@vue/shared'
import { parse } from './parser'
import { Context, renderRoots } from './renderer'

// eslint-disable-next-line antfu/top-level-function
export const noop = () => {}

export default function isPlainObject(obj: any) {
  if (typeof obj !== 'object' || obj === null)
    return false

  let proto = obj
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }

  return Object.getPrototypeOf(obj) === proto
}

export function convertSnakeToCamel(str: string) {
  // Convert kebab-case to camelCase
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}
