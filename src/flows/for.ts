import type { ComputedRef } from '@vue/reactivity'
import { computed, effect, toValue, watch } from '@vue/reactivity'
import patch from 'morphdom'
import { defineFlow } from '../flow'
import type { createProcessor } from '../renderer'
import { Context, activeContext, addActiveContext, getContext, toArray } from '../renderer'

function resolve(source: string, processor: ReturnType<typeof createProcessor>): {
  key: string
  value: ComputedRef<Iterable<unknown>>
} {
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
      const { key, value: iterable } = resolve(value, processor)

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

      return frag
    },
  }
})
