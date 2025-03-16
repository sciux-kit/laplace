/* eslint-disable no-console */
import { generateDocument, prettify } from './compiler'
import { parse } from './parser'
import { resolveNode } from './render'
import { __template } from './runtime'
import source from './source-1.html?raw'
import { parse as parseAcorn } from 'acorn'

const ast = parse(source)
const widget = resolveNode(ast)

console.log(ast)
console.log(widget)

const code = generateDocument(widget)
console.log(code)
console.log(prettify(code))

console.log(__template())