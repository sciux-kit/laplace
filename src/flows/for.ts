import { defineFlow } from "../flow";
import { BaseNode } from "../parser";
import { addActiveContext, createProcessor, getContext } from "../renderer";

export default defineFlow((value, node, resolve) => {
  const resolveFor = (source: string): { key: string, iterable: Iterable<unknown> } => {
    const [key, originalValue] = source.split('in').map(item => item.trim())
    const value = createProcessor(getContext())(originalValue)
    return {
      key,
      iterable: typeof value === 'number' ? Array.from({ length: value }, (_, i) => i) : value as Iterable<unknown>,
    }
  }
  
  const { key, iterable } = resolveFor(value)
  return Array.from(iterable).map(item => {
    const latestContext = getContext()
    addActiveContext({ [key]: item })
    const result = resolve(node as BaseNode)
    addActiveContext(latestContext)
    return result
  }).flat()
})
