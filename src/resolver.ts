import { type ChildNode, type DocumentNode, type ElementNode, type FragmentNode, NodeType, type ParseOptions, parse as parseRaw, TextMode } from './parser'

export type SciuxSourceNode =
  | SciuxIfNode
  | SciuxTextNode
  | SciuxBasicNode

export const kTextNode = Symbol('Sciux/Text')

export interface SciuxTextNode {
  tag: typeof kTextNode
  value: string
  raw: ChildNode
}

export interface SciuxIfNode {
  tag: 'if'
  attrs: Record<string, any>
  children: SciuxSourceNode[]
  else?: SciuxElseNode
  elif?: SciuxElifNode[]
  raw: ChildNode
}

export interface SciuxElifNode {
  tag: 'elif'
  attrs: Record<string, any>
  children: SciuxSourceNode[]
  raw: ChildNode
}

export interface SciuxElseNode {
  tag: 'else'
  attrs: Record<string, any>
  children: SciuxSourceNode[]
  raw: ChildNode
}

export interface SciuxBasicNode {
  tag: string
  attrs: Record<string, any>
  children: SciuxSourceNode[]
  raw: ChildNode
}

export type SciuxContext = Record<string, any>

function toNode(root: ElementNode | FragmentNode): SciuxSourceNode {
  const node: SciuxSourceNode = {
    tag: root.type == NodeType.ELEMENT ? root.tag : 'fragment',
    attrs: root.type == NodeType.ELEMENT
      ? root.attributes.reduce((prev, v) => {
          prev[v.name] = v.value == '' ? true : v.value
          return prev
        }, {} as Record<string, any>)
      : {},
    raw: root,
    children: [],
  }

  let index = 0
  while (index < root.children.length) {
    const child = root.children[index]
    if (child.type == NodeType.TEXT) {
      node.children.push({
        tag: kTextNode,
        value: child.content,
        raw: child,
      } satisfies SciuxTextNode)
      index += 1
      continue
    }

    if (child.type == NodeType.VALUE) {
      node.children.push({
        tag: 'value',
        attrs: {
          $data: child.value.trim(),
        },
        children: [],
        raw: child,
      })
      index += 1
      continue
    }

    if (child.type == NodeType.FRAGMENT) {
      node.children.push(toNode(child))
      index += 1
      continue
    }

    if (child.type == NodeType.ELEMENT) {
      if (child.tag == 'elif' || child.tag == 'else') {
        throw new TypeError(`unexpected tag <${child.tag}>`)
      }

      if (child.tag == 'if') {
        const ifNode = toNode(child) as SciuxIfNode

        index += 1
        while (index < root.children.length) {
          const child = root.children[index]
          if (child.type == NodeType.TEXT) {
            const text = child.content.trim()
            if (text.length == 0) {
              index += 1
              continue
            }
            break
          }

          if (child.type == NodeType.ELEMENT) {
            if (child.tag == 'elif') {
              ifNode.elif ??= []
              ifNode.elif.push(toNode(child) as SciuxElifNode)
              index += 1
              continue
            }
          }
          break
        }

        while (index < root.children.length) {
          const child = root.children[index]

          if (child.type == NodeType.TEXT) {
            const text = child.content.trim()
            if (text.length == 0) {
              index += 1
              continue
            }
          }

          break
        }

        if (index < root.children.length) {
          const child = root.children[index]
          if (child.type == NodeType.ELEMENT && child.tag == 'else') {
            ifNode.else = toNode(child) as SciuxElseNode
            index += 1
          }
        }

        node.children.push(ifNode)
        continue
      }

      node.children.push(toNode(child))
      index += 1
      continue
    }
  }

  return node
}

function toRoots(doc: DocumentNode): SciuxSourceNode[] {
  const children: SciuxSourceNode[] = []
  for (const child of doc.children) {
    if (child.type == NodeType.TEXT) {
      children.push({
        tag: kTextNode,
        value: child.content,
        raw: child,
      } satisfies SciuxTextNode)
    }
    else if (child.type == NodeType.VALUE) {
      children.push({
        tag: 'value',
        attrs: {
          $data: child.value.trim(),
        },
        children: [],
        raw: child,
      })
    }
    else if (child.type == NodeType.ELEMENT || child.type == NodeType.FRAGMENT) {
      const ast = toNode(child)
      if (typeof ast != 'string') {
        children.push(ast)
      }
    }
  }

  return children
}

export { toRoots as parseFromRaw }

export function parseSource(input: string, options: Omit<ParseOptions, 'resolver'> = {}): DocumentNode {
  return parseRaw(input, { resolver: modeResolver, ...options })
}

export function parse(input: string): SciuxSourceNode[] {
  return toRoots(parseSource(input))
}

export function isSciuxTextNode(node: SciuxSourceNode): node is SciuxTextNode {
  return node.tag == kTextNode
}

export function isSciuxIfNode(node: SciuxSourceNode): node is SciuxIfNode {
  return node.tag == 'if'
}

export const textMode = new Map<string, TextMode>()
function modeResolver(tag: string) {
  return textMode.get(tag) ?? TextMode.DATA
}
