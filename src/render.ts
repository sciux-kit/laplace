// Source -> (Syntax) Node -> (Semantic) Render -> Renderer

import { camelCase } from 'change-case'
import { type AttributeNode, type CDATANode, type CommentNode, type DocumentNode, type FragmentNode, NodeType, type TextNode, type ValueNode, type ChildNode, type ElementNode } from "./parser"

export interface RenderForNode {
  type: 'for'
  child: RenderNode
  expr: [string, string | null, string | null, string | null]
  raw: ElementNode
}

export interface RenderIfBranch {
  child: RenderNode
  condition: string
}

export interface RenderIfNode {
  type: 'if'
  branch: RenderIfBranch[]
  else: RenderNode | null
  raw: ElementNode
}

export interface RenderElementNode {
  type: 'element'
  name: string
  namespace?: string
  attributes: RenderAttribute[]
  children: RenderNode[]
  raw: ElementNode
}

export interface RenderTextNode {
  type: 'text'
  content: string
  raw: TextNode
}

export interface RenderFragmentNode {
  type: 'fragment'
  children: RenderNode[]
  raw: FragmentNode
}

export interface RenderDocumentNode {
  type: 'document'
  children: RenderNode[]
  filename: string
  raw: DocumentNode
}

export interface RenderInterpolationNode {
  type: 'interpolation'
  content: string
  raw: ValueNode
}

export interface RenderCommentNode {
  type: 'comment'
  content: string
  raw: CommentNode | CDATANode
}

export type RenderNode =
  | RenderElementNode
  | RenderTextNode
  | RenderInterpolationNode
  | RenderCommentNode
  | RenderFragmentNode
  | RenderDocumentNode
  | RenderForNode
  | RenderIfNode

export type RenderAttribute =
  | RenderStaticAttribute
  | RenderBindAttribute
  | RenderOnAttribute
  | RenderDirectiveAttribute

export interface RenderStaticAttribute {
  type: 'static'
  name: string
  value: string
  raw: AttributeNode
}

export interface RenderBindAttribute {
  type: 'bind'
  name: string
  value: string
  raw: AttributeNode
}

export interface RenderOnAttribute {
  type: 'on'
  name: string
  value: string
  param?: string
  raw: AttributeNode
}

export interface RenderDirectiveAttribute {
  type: 'directive'
  name: string
  value: string
  param?: string
  raw: AttributeNode
}

const stripParensRE = /^\(|\)$/g
const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/

export function parseForExpr(input: string) {
  const match = input.match(forAliasRE)
  if (match) {
    const res: [string, string | null, string | null, string | null] = [match[2], null, null, null]
    const alias = match[1].replace(stripParensRE, '').trim()
    const iteratorMatch = alias.match(forIteratorRE)
    if (iteratorMatch) {
      res[1] = alias.replace(forIteratorRE, '')
      res[2] = iteratorMatch[1].trim()
      if (iteratorMatch[2]) {
        res[3] = iteratorMatch[2].trim()
      }
    } else {
      res[1] = alias.trim()
    }
    return res
  }
}


export function resolveChildren(nodes: RenderNode[]): RenderNode[] {
  const out: RenderNode[] = []
  let i = 0
  while (i < nodes.length) {
    console.log(i, nodes[i])
    const node = nodes[i]
    if (node.type != 'element') {
      i += 1
      if (node.type == 'text' && node.content.trim() == '') {
        continue
      }
      out.push(node)
      continue
    }

    const cond = node.attributes.filter(a => a.type === 'directive' && (a.name === 'if' || a.name === 'for'))
    if (cond.length > 1) {
      throw new Error('Invalid node: multiple if/for directives')
    }

    if (cond[0]?.name === 'if') {
      console.log('!!if')
      const branch: RenderIfBranch[] = []
      let elseNode: RenderNode | null = null

      branch.push({
        condition: cond[0].value,
        child: node
      })

      let j = i + 1
      while (j < nodes.length) {
        const child = nodes[j]
        if (child.type !== 'element') {
          if (child.type == 'text' && child.content.trim() == '') {
            j += 1
            continue
          }
          break
        }

        const flags = child.attributes.filter(a => a.type === 'directive' && (a.name === 'elif' || a.name === 'else'))
        if (flags.length > 1) {
          throw new Error('Invalid node: multiple elif/else directives')
        }

        if (flags.length == 0) {
          break;
        }

        if (flags[0].name === 'elif') {
          branch.push({
            condition: flags[0].value,
            child
          })
          j += 1
        } else {
          elseNode = child
          j += 1
          break
        }
      }
      out.push({
        type: 'if',
        branch,
        else: elseNode,
        raw: node.raw
      })
      i = j
      continue
    }
    else if (cond[0]?.name === 'for') {
      const [flag] = cond
      const expr = parseForExpr(flag.value)
      if (expr == null) {
        throw new Error('Invalid for expression')
      }
      const forNode: RenderForNode = {
        type: 'for',
        child: node,
        expr,
        raw: node.raw
      }
      out.push(forNode)
      i += 1
      continue
    }
    else {
      out.push(node)
      i += 1
      continue
    }
  }
  return out
}

export function resolveNode(cNode: ChildNode): RenderNode {
  switch (cNode.type) {
    case NodeType.DOCUMENT:
      return {
        type: 'document',
        children: resolveChildren(cNode.children.map(resolveNode)),
        filename: cNode.filename,
        raw: cNode,
      }
    case NodeType.ELEMENT:
      return {
        type: 'element',
        name: cNode.tag,
        attributes: cNode.attributes.map(resolveAttribute),
        children: resolveChildren(cNode.children.map(resolveNode)),
        raw: cNode,
      }
    case NodeType.TEXT:
      return {
        type: 'text',
        content: cNode.content,
        raw: cNode,
      }
    case NodeType.CDATA:
    case NodeType.COMMENT:
      return {
        type: 'comment',
        content: cNode.content,
        raw: cNode,
      }
    case NodeType.FRAGMENT:
      return {
        type: 'fragment',
        children: resolveChildren(cNode.children.map(resolveNode)),
        raw: cNode,
      }
    case NodeType.VALUE:
      return {
        type: 'interpolation',
        content: cNode.value,
        raw: cNode,
      }
    default:
      throw new Error('Invalid node type')
  }
}

const attrTypeMap: Record<string, string> = {
  ':': 'bind',
  '@': 'on',
  '#': 'directive',
}

export function resolveAttribute(attr: AttributeNode): RenderAttribute {
  if (attr.name.length <= 1) {
    throw new Error('Invalid attribute name')
  }

  if (attr.name[0] in attrTypeMap) {
    const type = attrTypeMap[attr.name[0]] as any

    const fullName = attr.name.slice(1)
    const dot = fullName.indexOf('.')
    const value = attr.value
    const raw = attr

    return {
      type,
      name: camelCase(dot != -1 ? fullName.slice(0, dot) : fullName),
      param: dot != -1 ? fullName.slice(dot + 1) : undefined,
      value,
      raw,
    }
  }

  else {
    const type = 'static'
    const name = camelCase(attr.name)
    const value = attr.value
    const raw = attr

    return {
      type,
      name,
      value,
      raw,
    }
  }
}

