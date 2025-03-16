/* eslint-disable no-console */
import { generateDocumentTemplate, prettify } from './compiler'
import { parse } from './parser'
import { resolveNode } from './render'
import { compileTemplate } from './runtime'
import source from './source-1.html?raw'
import { parse as parseAcorn } from 'acorn'

const ast = parse(source)
const widget = resolveNode(ast)

console.log(ast)
console.log(widget)

const code = generateDocumentTemplate(widget)
const fn = compileTemplate(code)
console.log(fn())