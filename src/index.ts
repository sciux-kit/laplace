export * from './compiler'
export * from './component'
export * from './render'
export * from './runtime'

import * as parser from './parser'
import * as reactivity from '@vue/reactivity'
export default { ...reactivity, ...parser }
