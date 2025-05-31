import { defineFlow } from "../flow"
import { ElementNode, NodeType } from "../parser"
import { Context, createProcessor } from "../renderer"

export type AnimationContext = {
  duration: number
  easing: Easing
}
export type Easing = (progress: number) => number
export type AnimationSetup = (progress: number) => boolean
export type Animation = (
  node: Node,
  animationContext: AnimationContext,
  processor: ReturnType<typeof createProcessor>,
) => {
  validator?: (name: string) => boolean
  setup: AnimationSetup
}

export function defineAnimation(animation: Animation) {
  return animation
}
export const animations = new Map<string, Animation>()

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
    let easingFn: Easing
    if (!easing) easingFn = (t => t)
    else easingFn = easingResolver(easing)
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
    flow(value, node, source) {
      // TODO: Implement
      console.log(value, node)
      const original = resolve(value, processor as (name: string) => Easing)
      const group = Array.isArray(original) ? original : [original]
      const executer = async () => {
        console.log('executer', group)
        for (const animation of group) {
          const promise = new Promise<void>((resolve) => {
            const start = performance.now()
            if (!Array.isArray(animation)) {
              const anim = animations.get(animation.name)
              if (!anim) {
                throw new Error(`Animation ${animation.name} not found`)
              }
              console.log('anim', anim)
              const { setup, validator } = anim(node, {
                duration: animation.duration,
                easing: animation.easing ?? (t => t)
              }, processor)
              if (validator && !validator((source as ElementNode).tag)) {
                throw new Error(`Animation ${animation.name} is not valid for ${(source as ElementNode).tag}`)
              }
              requestAnimationFrame(function loop() {
                const progress = (performance.now() - start) / animation.duration
                  if (setup(progress)) {
                    resolve()
                  } else {
                    requestAnimationFrame(loop)
                  }
                })
            }
          })
          await Promise.all([promise])
        }
      }
      const [event] = rest
      if (event) {
        node.addEventListener(event, executer)
      } else {
        executer()
      }
    }
  }
})

export default flow
