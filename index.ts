import { parse } from './parser'
import source from './source.html?raw'
import { resolveNode } from './render'

const ast = parse(source)
const widget = resolveNode(ast)

console.log(ast)
console.log(widget)