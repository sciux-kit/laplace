import type { BaseNode } from './parser'
import type { createProcessor } from './renderer'
import { Context } from './renderer'

interface PreFlow {
  type: 'pre'
  flow: (value: string, source: BaseNode, render: (node: BaseNode) => Node | Node[]) => Node | Node[]
}
interface PostFlow {
  type: 'post'
  flow: (value: string, node: Node, source: BaseNode) => void
}
export type Flow = (processor: ReturnType<typeof createProcessor>, ...rest: string[]) => (PreFlow | PostFlow) & {
  name: string
}

export function defineFlow(flow: Flow): Flow {
  return flow
}
