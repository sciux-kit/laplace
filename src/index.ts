import { root, flows } from './renderer'
import letComp from './builtins/let'
import { animationFlow, elseFlow, elseIfFlow, ifFlow } from './flows'

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

root.set('let', letComp)
flows.set('if', ifFlow)
flows.set('else', elseFlow)
flows.set('else-if', elseIfFlow)
flows.set('animate', animationFlow)

export * from './renderer'
export * from './flows'
