import type { AnyNode } from 'acorn'
import type { RenderAttribute, RenderElementNode, RenderNode } from './render'
import { parse } from 'acorn'
import { simple } from 'acorn-walk'
import { generate } from 'astring'

function _generateTemplateFn(content: string) {
  return `const __template = (__parentContext) => {
const __context = createContext(__parentContext);
const __root = (()=>(${content}))();
return __root;
};`
}
function _generateLetContext(assign: Record<string, string>, content: string) {
  return `/* Let Context */\n(((__context) => /* Scope Start [${Object.keys(assign).join(', ')}] */\n(${content}\n))(mergeContext(__context, ${generateRecord(assign)})))`
}
const _generateExpression = (expr: string, deps: string[]) => `createExpression(\n__context,\n(${deps.length > 0 ? `{${deps.join(', ')}}` : '/* Empty */'}) => ${expr})`
const _generateFor = (targetExpr: string, content: string, items?: string, key?: string) => `createFor(__context, ${targetExpr}, (__context${items != null ? `,${items}` : ''}${key != null ? `,${key}` : ''})=>${content})`
const _generateElement = (name: string, attrs: string, content: string) => `/* [${name}] Element Start */\n createElement('${name}', /* Attributes */ ${attrs},\n/* Children */ ${content}\n)\n/* [${name}] Element End*/`

const cachedASTs = new Map<string, AnyNode>()
function parseScript(script: string) {
  if (cachedASTs.has(script)) {
    return cachedASTs.get(script)!
  }
  const ast = parse(script, { ecmaVersion: 'latest' })
  cachedASTs.set(script, ast)
  return ast
}

const cachedDeps = new Map<string, Set<string>>()
function analyzeExpressionDeps(script: string) {
  if (cachedDeps.has(script)) {
    return new Set(cachedDeps.get(script)!) // Return a new Set to avoid mutation
  }
  const deps = new Set<string>()
  simple(parseScript(script), {
    Identifier(node) {
      deps.add(node.name)
    },
  })
  cachedDeps.set(script, deps)
  return new Set(deps)
}

export class TransformContext {
  excludeDeps = new Set<string>([
    'console',
    'window',
    'document',
    'globalThis',
    'Math',
    'Array',
    'Object',
    'Date',
  ])

  addExcludeDeps(...deps: string[]) {
    const next = new TransformContext()
    next.excludeDeps = new Set([...this.excludeDeps, ...deps])
    return next
  }

  removeExcludeDeps(...deps: string[]) {
    const next = new TransformContext()
    next.excludeDeps = new Set([...this.excludeDeps].filter(dep => !deps.includes(dep)))
    return next
  }

  generateExpression(expr: string) {
    const deps = analyzeExpressionDeps(expr)
    this.excludeDeps.forEach(dep => deps.delete(dep))
    return _generateExpression(expr, Array.from(deps))
  }
}

export function generateAttribute(context: TransformContext, node: RenderAttribute): [string, string] {
  if (node.type === 'static') {
    return [node.name, node.value === '' ? 'true' : `"${node.value}"`]
  }
  else if (node.type === 'bind') {
    return [node.name, `/* [bind] ${node.name} */\ncreateBindAttribute(__context, '${node.name}', \n${context.generateExpression(node.value)}\n)`]
  }
  else if (node.type === 'on') {
    return [`on${node.name.slice(0, 1).toUpperCase()}${node.name.slice(1)}`, `/* [on] ${node.name} */\ncreateOnAttribute(__context, '${node.name}', ${context.generateExpression(node.value)})`]
  }
  if (node.name === 'for' || node.name === 'if' || node.name === 'else' || node.name == 'elif') {
    return [`/* `, `built-in directive ${node.name} */\n`]
  }
  return [`__${node.type}_${node.name}`, `/* attribute [${node.type}] ${node.name} */ null`]
}

export function generateRecord(rec: Record<string, string>) {
  return `\n/* Record Start */ ({\n${Object.entries(rec).map(([key, value]) => `${key}: ${value}`).join(',\n')}}) /* Record End */ \n`
}

export function generateElement(context: TransformContext, node: RenderElementNode, children = true): string {
  if (node.name === 'let') {
    if (node.attributes.length === 0) {
      return '/* Empty Let */ null'
    }
    const inits = node.attributes.reduce((acc, attr) => {
      if (attr.type === 'bind') {
        acc[attr.name] = context.generateExpression(attr.value)
      }
      else if (attr.type === 'static') {
        acc[attr.name] = attr.value
      }
      return acc
    }, {} as Record<string, string>)
    return _generateLetContext(inits,
      `createFragment(${node.children.map(child => generateNode(context.removeExcludeDeps(...Object.keys(inits)), child)).join(', ')})`
    )
  }

  const attrs = generateRecord(node.attributes.reduce((acc, attr) => {
    const [key, value] = generateAttribute(context, attr)
    acc[key] = value
    return acc
  }, {} as Record<string, string>))
  return _generateElement(node.name, attrs, children ? node.children.map(child => generateNode(context, child)).join(',\n') : 'null')
}

export function generateNode(context: TransformContext, node: RenderNode): string {
  console.log(context)
  if (node.type === 'element') {
    return generateElement(context, node)
  }
  else if (node.type === 'text') {
    return node.content.trim() === '' ? '/* Empty Text */null' : `createText(\`${node.content}\`)`
  }
  else if (node.type === 'interpolation') {
    return `createInterpolation(__context, ${context.generateExpression(node.content)})`
  }
  else if (node.type === 'comment') {
    return `createComment('${node.content}')`
  }
  else if (node.type === 'fragment') {
    return `createFragment(${node.children.map(child => generateNode(context, child)).join(', \n')})`
  }
  else if (node.type === 'document') {
    return `createDocument(${node.children.map(child => generateNode(context, child)).join(', \n')})`
  }
  else if (node.type === 'for') {
    console.log(node)
    const expr = node.expr.filter(name => name != null) as any
    const ctx = context.addExcludeDeps(...expr.slice(1))
    return `createFor(__context, /* [for] Target */${context.generateExpression(expr[0])}, (__context) => ${generateElement(context, node.child as any, false)}, (__context,  /* [for] Params */ ${expr.slice(1).join(',')}) => createFragment(${(node.child as any).children.map((child: any) => generateNode(ctx, child)).join(', \n')}))`
  }
  else if (node.type === 'if') {
    return `createIf(__context, 
    {
    /* [if] Branch Count */ __n: ${node.branch.length},
    /* [if] Branches */
    ${node.branch.map((branch, i) => `/* [if] Branch ${i} */ ${i}: [${context.generateExpression(branch.condition)}, (__context) => (${generateNode(context, branch.child)})]`).join(',\n')
      }
    ${node.else ? `,\n/* [if] Else */ __else: (__context) => ${generateNode(context, node.else)}` : '\n'
      }
    })`
  }

  return 'null'
}

export function generateDocumentTemplate(node: RenderNode) {
  if (node.type !== 'document') {
    throw new Error('Invalid node type')
  }
  return _generateTemplateFn(`createDocument(\n${node.children.map(child => generateNode(new TransformContext(), child)).join(', \n')})`)
}

export function prettify(code: string) {
  return generate(parse(code, { ecmaVersion: 'latest' }), {
    comments: true,
  })
}
