import { BaseNode } from "./parser"
import { Context } from "./renderer"

export type Flow = (
  value: string,
  source: BaseNode | BaseNode[],
  resolve: (node: BaseNode) => Node,
  node: Node | Node[]
) => Node | Node[]

export function defineFlow(flow: Flow): Flow {
  return flow
}
