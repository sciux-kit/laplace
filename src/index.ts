export * from './renderer'
export * from './component'
export * from './flow'
export * from './html'
export * from './parser'
export * from './selector'
export * from './utils'
export * from './watcher'
export * from './flows'

export * from '@vue/reactivity'

import { components, flows } from './renderer'
import letComp from './builtins/let'
import { ifFlow, elseFlow, elseIfFlow } from './flows'

components.set('let', letComp)
flows.set('if', ifFlow)
flows.set('else', elseFlow)
flows.set('else-if', elseIfFlow)

export { components, flows }
