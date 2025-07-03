import type { BaseNode } from './parser'
import type { Context, Processor } from './renderer'

interface PreFlow {
  type: 'pre'
  flow: (value: string, source: BaseNode, render: (node: BaseNode) => Node | Node[]) => Node | Node[]
}
interface PostFlow {
  type: 'post'
  flow: (value: string, node: Node, source: BaseNode) => void
}
export type Flow = (processor: Processor<Context>, ...rest: string[]) => (PreFlow | PostFlow) & {
  name: string
}

export function defineFlow(flow: Flow): Flow {
  return flow
}
