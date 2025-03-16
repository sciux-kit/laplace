// Source -> (Syntax) Node -> (Semantic) Render -> Renderer

import { camelCase } from 'change-case'
import { type AttributeNode, type CDATANode, type CommentNode, type DocumentNode, type FragmentNode, NodeType, type TextNode, type ValueNode, type ChildNode, type ElementNode } from "./parser"

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

export function resolveNode(cNode: ChildNode): RenderNode {
  switch (cNode.type) {
    case NodeType.DOCUMENT:
      return {
        type: 'document',
        children: cNode.children.map(resolveNode),
        filename: cNode.filename,
        raw: cNode,
      }
    case NodeType.ELEMENT:
      return {
        type: 'element',
        name: cNode.tag,
        attributes: cNode.attributes.map(resolveAttribute),
        children: cNode.children.map(resolveNode),
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
        children: cNode.children.map(resolveNode),
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