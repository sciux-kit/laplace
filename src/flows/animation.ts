import { defineFlow } from '../flow'
import type { ElementNode } from '../parser'
import { NodeType } from '../parser'
import type { createProcessor } from '../renderer'
import { Context, toArray } from '../renderer'

export interface AnimationContext<Params extends string[]> {
  duration: number
  easing: Easing
  params: Params
}
export type Easing = (progress: number) => number
export type AnimationSetup = (progress: number) => boolean
export type Animation<Params extends string[]> = (
  node: Node,
  animationContext: AnimationContext<Params>,
  processor: ReturnType<typeof createProcessor>,
) => {
  validator?: (name: string) => boolean
  setup: AnimationSetup
}

export function defineAnimation<T extends string[] = string[]>(animation: Animation<T>) {
  return animation
}
export const animations = new Map<string, Animation<string[]>>()

export interface AnimationParams {
  name: string
  params?: string[]
  duration: number
  easing?: Easing
}
export type AnimationGroup = AnimationParams[]
export type MaybeAnimationGroup = AnimationParams | AnimationGroup
export type AnimationParsedResult = MaybeAnimationGroup | MaybeAnimationGroup[]

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
function resolve(source: string, easingResolver: (name: string) => Easing): AnimationParsedResult {
  const sourceGroup = source.split(' ').filter(Boolean)

  // Parse a single animation string
  const parseSingleAnimation = (str: string): AnimationParams => {
    // First split by comma to separate animation part from duration and easing
    const parts = str.split(',')
    if (parts.length < 2)
      throw new Error(`Invalid animation arguments length: ${str}`)

    // Get the last part as duration
    const duration = Number(parts[parts.length - 1])
    if (Number.isNaN(duration))
      throw new Error(`Invalid duration: ${parts[parts.length - 1]}`)

    // Get the second last part as easing if it exists
    const easing = parts.length > 2 ? parts[parts.length - 2] : ''

    // Get the animation part (name and params)
    const animPart = parts.slice(0, parts.length - (easing ? 2 : 1)).join(',')

    // Parse name and params
    const nameMatch = animPart.match(/^([^(]+)(?:\(([^)]*)\))?$/)
    if (!nameMatch)
      throw new Error(`Invalid animation format: ${str}`)

    const [_, name, paramsStr] = nameMatch
    const params = paramsStr ? paramsStr.split(',').map(p => p.trim()).filter(Boolean) : undefined

    let easingFn: Easing
    if (!easing || easing === '')
      easingFn = t => t
    else easingFn = easingResolver(easing)

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

/**
 * Animation flow.
 * @example `#animate="source"` will be executed immediately
 * @example `#animate.click="source"` will be executed when the node is clicked
 */
const flow = defineFlow((processor, ...rest) => {
  return {
    name: `animate.${rest.join('.')}`,
    type: 'post',
    flow(value, node, source) {
      const original = resolve(value, processor as (name: string) => Easing)
      const group = Array.isArray(original) ? original : [original]
      const executer = async () => {
        for (const animation of group) {
          const promises: Promise<void>[] = []
          for (const animItem of toArray(animation)) {
            const promise = new Promise<void>((resolve) => {
              const start = performance.now()
              const anim = animations.get(animItem.name)
              if (!anim) {
                throw new Error(`Animation ${animItem.name} not found`)
              }

              const { setup, validator } = anim(node, {
                duration: animItem.duration,
                easing: animItem.easing ?? (t => t),
                params: animItem.params ?? [],
              }, processor)
              if (validator && !validator((source as ElementNode).tag)) {
                throw new Error(`Animation ${animItem.name} is not valid for ${(source as ElementNode).tag}`)
              }
              requestAnimationFrame(function loop() {
                const progress = (performance.now() - start) / animItem.duration
                if (setup(progress)) {
                  resolve()
                }
                else {
                  requestAnimationFrame(loop)
                }
              })
            })
            promises.push(promise)
          }
          await Promise.all(promises)
        }
      }
      const [event] = rest
      if (event) {
        node.addEventListener(event, executer)
      }
      else {
        executer()
      }
    },
  }
})

export default flow
