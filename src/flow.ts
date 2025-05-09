export type Flow = (
  value: string,
) => Node | Node[]

export function defineFlow(flow: Flow): Flow {
  return flow
}
