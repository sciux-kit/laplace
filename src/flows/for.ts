import { toValue } from "@vue/reactivity";
import { defineFlow } from "../flow";
import { addActiveContext, createProcessor, getContext } from "../renderer";

const resolve = (source: string): {
  key: string,
  value: Iterable<unknown>
} => {
  const [keySource, valueSource] = source.split(' in ').map(s => s.trim())
  console.log('keySource:', keySource)
  console.log('valueSource:', valueSource)
  const parsedValue = createProcessor(getContext())(valueSource)
  console.log('parsedValue:', parsedValue)
  const value = (typeof toValue(parsedValue) === 'number' ? Array.from({ length: toValue(parsedValue) as number }, (_, i) => i) : parsedValue) as Iterable<unknown[]>
  // TODO: parse keySource, there we let source as a single variable
  const key = keySource
  return {
    key,
    value,
  }
}

export default defineFlow({
  name: 'for',
  type: 'pre',
  flow(value, source, render) {
    const { key, value: iterable } = resolve(value)
    console.log('iterable:', iterable)
    const nodes = Array.from(iterable).map(item => {
      console.error('fuck your mother')
      addActiveContext({
        [key]: item,
      })
      console.log(getContext())
      return render(source)
    }).flat()
    console.log('nodes:', nodes)
    return nodes
  },
})
