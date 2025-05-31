import { BaseNode } from "./parser"
import { Context, createProcessor } from "./renderer"

type PreFlow = {
  type: 'pre',
  flow: (value: string, source: BaseNode, render: (node: BaseNode) => Node | Node[]) => Node | Node[]
}
type PostFlow = {
  type: 'post',
  flow: (value: string, node: Node) => void
}
export type Flow = (processor: ReturnType<typeof createProcessor>, ...rest: string[]) => (PreFlow | PostFlow) & {
  name: string
}

export function defineFlow(flow: Flow): Flow {
  return flow
}
