import { BaseNode } from "./parser"

type PreFlow = {
  type: 'pre',
  flow: (value: string, source: BaseNode | BaseNode[], render: (node: BaseNode) => Node) => Node | Node[]
}
type PostFlow = {
  type: 'post',
  flow: (value: string, node: Node) => void
}
export type Flow = (PreFlow | PostFlow) & {
  name: string
}

export function defineFlow(flow: Flow): Flow {
  return flow
}
