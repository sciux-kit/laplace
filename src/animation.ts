/* eslint-disable ts/no-empty-object-type */
import type { MaybeRef, ToRefs } from '@vue/reactivity'
import { isRef, reactive, ref, toRaw } from '@vue/reactivity'
import type { ElementNode } from './parser'
import { createProcessor, toArray } from './renderer'
import type { Attrs, Context, MaybeArray } from './renderer'
import { easingResolver as defaultEasingResolver } from './easing'

export interface AnimationContext<Params extends string[]> {
  duration: number
  easing: Easing
  params: Params
}
export interface AnimationCompContext<A extends Record<string, unknown>, C extends Context = {}> {
  attrs: ToRefs<A>
  context: C
}
export type Easing = (progress: number) => number
export type AnimationSetup = (progress: number) => boolean
export type Animation<Params extends string[], A extends Record<string, unknown>, C extends Context = {}> = (
  node: Node | HTMLElement,
  animationContext: AnimationContext<Params>,
  compContext: AnimationCompContext<A, C>,
) => AnimationSetup | boolean | void

export function defineAnimation<
  T extends string[] = string[],
  A extends Record<string, unknown> = {},
  C extends Context = Context,
>(animation: Animation<T, A, C>) {
  return animation
}
export const animations = new Map<string, MaybeArray<Animation<string[], any, any>>>()

export interface AnimationParams {
  name: string
  params?: string[]
  duration: number
  easing?: Easing
}
export type AnimationGroup = AnimationParams[]
export type MaybeAnimationGroup = AnimationParams | AnimationGroup
export type AnimationParsedResult = MaybeAnimationGroup | MaybeAnimationGroup[]

export const ANIMATION = Symbol('animation')
export type AnimationAttrSource = `$${string}`
export type AnimationAttr = [typeof ANIMATION, AnimationParsedResult, string?]

export function resolveVariable(source: string) {
  return defineAnimation((_, { params }, { context: ctx }) => {
    const [processor] = createProcessor(ctx)
    const variable = toRaw(ctx)[source] as MaybeRef<number>
    if (!isRef(variable)) {
      return () => true
    }
    const [from, to] = <[number, number]>(params.length !== 2 ? [variable.value, processor(params[0])] : params.map(p => processor(p)))
    return (progress) => {
      variable.value = from + (to - from) * progress

      if (progress >= 1)
        return true
      return false
    }
  })
}

/**
 * Parse the source string into a group of animation
 * @example `ani,1000` => { name: 'ani', duration: 1000 }
 * @example `ani,1000,ease-in-out` => { name: 'ani', duration: 1000, easing: 'ease-in-out' }
 * @example `ani(param1,param2),1000,ease-in-out` => { name: 'ani', params: ['param1', 'param2'], duration: 1000, easing: 'ease-in-out' }
 * @example `ani1,1000 ani2,1000` => [{ name: 'ani1', duration: 1000 }, { name: 'ani2', duration: 1000 }]
 * @example `parallel(ani1,1000 ani2,1000) ani3,500` => [[{name: 'ani1', duration: 1000}, {name: 'ani2', duration: 1000}], {name: 'ani3', duration: 500}]
 * @param source The source string
 * @returns The parsed animation
 */
function resolve(source: string, easingResolver: (name: string) => Easing = defaultEasingResolver): AnimationParsedResult {
  const sourceGroup = source.split(' ').filter(Boolean)

  // Parse a single animation string
  const parseSingleAnimation = (str: string): AnimationParams => {
    // First split by comma to separate animation part from duration and easing
    const parts: string[] = []
    let inBracketCount: number = 0
    let item = ''
    for (const char of str) {
      if (char === '(') {
        item += char
        inBracketCount++
      }
      else if (char === ')') {
        item += char
        inBracketCount--
      }
      else if (char === ',' && inBracketCount === 0) {
        parts.push(item)
        item = ''
      }
      else {
        item += char
      }
    }
    parts.push(item)
    if (parts.length < 2)
      throw new Error(`Invalid animation arguments length: ${str}`)

    // Get the last part as duration
    const duration = Number(parts[1])
    if (Number.isNaN(duration))
      throw new Error(`Invalid duration: ${parts[1]}`)

    const easing = parts.length > 2 ? parts[parts.length - 1] : ''

    // Get the animation part (name and params)
    const animPart = parts.slice(0, parts.length - (easing ? 2 : 1)).join(',')

    // Parse name and params
    const nameMatch = animPart.match(/^([^(]+)(?:\(([^)]*)\))?$/)
    if (!nameMatch)
      throw new Error(`Invalid animation format: ${str}`)

    const [_, name, paramsStr] = nameMatch
    const params = paramsStr ? paramsStr.split(',').map(p => p.trim()).filter(Boolean) : undefined

    let easingFn: Easing
    if (!easing || easing === '') {
      easingFn = t => t
    }
    else {
      easingFn = easingResolver(easing)
    }

    return {
      name,
      params,
      duration,
      easing: easingFn,
    }
  }

  // Parse parallel animations
  const parseParallel = (str: string): AnimationGroup => {
    const content = str.slice(9, -1) // Remove 'parallel(' and ')'
    return content.split(' ').filter(Boolean).map(parseSingleAnimation)
  }

  // Process each part of the source
  return sourceGroup.map((part) => {
    if (part.startsWith('parallel(')) {
      return parseParallel(part)
    }
    return parseSingleAnimation(part)
  })
}

export function useAnimationAttr(key: string, source: AnimationAttrSource): AnimationAttr {
  return [ANIMATION, resolve(source), key.slice(1)]
}
export function isAnimationAttr(attr: Attr) {
  return Array.isArray(attr) && attr[0] === ANIMATION
}

export class AnimationManager {
  private immediate = Symbol('immediate')
  private actions: Array<[string[], typeof this.immediate | Node, () => Promise<void>, string?]> = []
  private autoExecute = true
  private defaultEasing: Easing = t => t

  execute(filter?: (name: string) => boolean) {
    for (const [names, node, executer, eventName] of this.actions) {
      for (const name of names) {
        if (filter && !filter(name)) {
          continue
        }
        if (node === this.immediate) {
          executer()
          break
        }
        else if (node instanceof Node) {
          node.addEventListener(eventName!, executer)
          break
        }
      }
    }
  }

  enableAutoExecute() {
    this.autoExecute = true
  }

  disableAutoExecute() {
    this.autoExecute = false
  }

  addAction(names: string[], executer: () => Promise<void>, node?: Node, eventName?: string): this {
    if (node) {
      this.actions.push([names, node, executer, eventName])
    }
    else {
      this.actions.push([names, this.immediate, executer])
    }
    return this
  }

  setDefaultEasing(easing: Easing) {
    this.defaultEasing = easing
  }

  getDefaultEasing() {
    return this.defaultEasing
  }

  init() {
    if (this.autoExecute) {
      this.execute()
    }
  }
}
export const animationManager = new AnimationManager()

export function createAnimate(context: Context, source: ElementNode) {
  return (attrs: Attrs, node: Node) => {
    for (const [_, value] of Object.entries(attrs)) {
      if ((value as AnimationAttr)[0] !== ANIMATION)
        continue
      const [_, maybeGroup, eventName] = <AnimationAttr>value
      const group = Array.isArray(maybeGroup) ? maybeGroup : [maybeGroup]

      const executer = async () => {
        for (const animation of group) {
          const promises: Promise<void>[] = []
          for (const animItem of toArray(animation)) {
            const promise = new Promise<void>((resolve) => {
              const start = performance.now()
              const anim = animations.get(animItem.name) ?? resolveVariable(animItem.name)
              const anims = toArray(anim)

              for (const anim of anims) {
                const easing = animItem.easing ?? animationManager.getDefaultEasing()

                const setup = anim(node, {
                  duration: animItem.duration,
                  easing,
                  params: animItem.params ?? [],
                }, {
                  attrs,
                  context,
                })
                if (typeof setup === 'boolean' || !setup)
                  continue
                requestAnimationFrame(function loop() {
                  const progress = easing((performance.now() - start) / animItem.duration)
                  if (setup(progress)) {
                    resolve()
                  }
                  else {
                    requestAnimationFrame(loop)
                  }
                })
                break
              }
            })
            promises.push(promise)
          }
          await Promise.all(promises)
        }
      }
      if (eventName) {
        animationManager.addAction(group.map(g => toArray(g).map(lg => lg.name)).flat(), executer, node, eventName)
      }
      else {
        animationManager.addAction(group.map(g => toArray(g).map(lg => lg.name)).flat(), executer)
      }
    }
  }
}
