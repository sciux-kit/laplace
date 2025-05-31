import { defineFlow } from "../flow"
import { Context } from "../renderer"

export type AnimationContext = {
  duration: number
  easing: Easing
}
export type Easing = (progress: number) => number
export type AnimationSetup = (progress: number) => boolean
export type Animation = (
  node: Node,
  animationContext: AnimationContext,
  context: Context
) => AnimationSetup

export function defineAnimation(animation: Animation) {
  return animation
}

export type AnimationParams = {
  name: string
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
 * @example `ani1,1000 ani2,1000` => [{ name: 'ani1', duration: 1000 }, { name: 'ani2', duration: 1000 }]
 * @example `parallel(ani1,1000 ani2,1000) ani3,500` => [[{name: 'ani1', duration: 1000}, {name: 'ani2', duration: 1000}], {name: 'ani3', duration: 500}]
 * @param source The source string
 * @returns The parsed animation
 */
function resolve(source: string, easingResolver: (name: string) => Easing): AnimationParsedResult {
  const sourceGroup = source.split(' ').filter(Boolean)

  // Parse a single animation string
  const parseSingleAnimation = (str: string): AnimationParams => {
    const [name, duration, easing] = str.split(',')
    const easingFn = easingResolver(easing)
    if (!easingFn) {
      throw new Error(`Easing function ${easing} not found`)
    }
    return {
      name,
      duration: Number(duration),
      easing: easingFn
    }
  }

  // Parse parallel animations
  const parseParallel = (str: string): AnimationGroup => {
    const content = str.slice(9, -1) // Remove 'parallel(' and ')'
    return content.split(' ').filter(Boolean).map(parseSingleAnimation)
  }

  // Process each part of the source
  return sourceGroup.map(part => {
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
    flow(value, node) {
      // TODO: Implement
      const group = resolve(value, processor as (name: string) => Easing)
      const executer = () => {}
      const [event] = rest
      if (event) {
        node.addEventListener(event, executer)
      } else {
        node.addEventListener('load', executer)
      }
    }
  }
})

export default flow
