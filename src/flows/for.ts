import { computed, ComputedRef, effect, toValue, watch } from "@vue/reactivity";
import { defineFlow } from "../flow";
import { activeContext, addActiveContext, Context, createProcessor, getContext, toArray } from "../renderer";
import patch from "morphdom";


const resolve = (source: string, processor: ReturnType<typeof createProcessor>): {
  key: string,
  value: ComputedRef<Iterable<unknown>>
} => {
  const [keySource, valueSource] = source.split(' in ').map(s => s.trim())


  const parsedValue = processor(valueSource)

  const value = computed(() => (typeof toValue(parsedValue) === 'number' ? Array.from({ length: toValue(parsedValue) as number }, (_, i) => i) : toValue(parsedValue)) as Iterable<unknown[]>)
  // TODO: parse keySource, there we let source as a single variable
  const key = keySource
  return {
    key,
    value,
  }
}

export default defineFlow((processor) => {
  return {
    name: 'for',
    type: 'pre',
    flow(value, source, render) {
      console.log('execute once!')
      const { key, value: iterable } = resolve(value, processor)
      console.log('iterable', iterable.value)
      const getNodes = () => {
        const nodes = []
        for (const item of iterable.value) {
          addActiveContext({
            [key]: item,
          })
          nodes.push(...toArray(render(source)))
        }
        return nodes
      }
      const frag = document.createDocumentFragment()
      frag.append(...getNodes())

      // window.addEventListener('load', () => {
      //   watch(iterable, (newVal) => {
      //     console.log('iterable changed', internalContext)
      //     const cloned = frag.parentElement?.cloneNode()
      //     getNodes().forEach(node => {
      //       cloned?.appendChild(node)
      //     })
      //     patch(frag.parentElement!, cloned!)
      //   })
      // })
      return frag
    },
  }
})
