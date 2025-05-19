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

import { Component } from './component'
import { components } from './renderer'
import letComp from './builtins/let'

components.set('let', letComp as Component<string, any>)

export { components }
