import type { Attr, CDATASection, Comment, Document, DocumentFragment, Element, Node, Text } from '@xmldom/xmldom'
import { DOMImplementation } from '@xmldom/xmldom'
import type { ChildNode, DocumentNode } from './parser'
import { NodeType } from './parser'
import type { BaseNode } from './index.ts'

export type WithLaplace<T> = T & { laplace: BaseNode }

function addNodeToDocument(document: Document, parent: Node, node: ChildNode) {
  switch (node.type) {
    case NodeType.VALUE: {
      // TODO: Distinct value from text, maybe?
      const text = document.createTextNode(node.value) as WithLaplace<Text>
      text.laplace = node
      parent.appendChild(text)
    } break

    case NodeType.DOCUMENT: {
      parent.appendChild(laplace2domlike(node))
    } break

    case NodeType.ELEMENT: {
      const element = document.createElement(node.tag) as WithLaplace<Element>
      element.laplace = node
      for (const attribute of node.attributes) {
        let attr: WithLaplace<Attr>
        if (attribute.name.startsWith('#')) {
          attr = document.createAttributeNS('flow', attribute.name.substring(1)) as WithLaplace<Attr>
        }
        else if (attribute.name.startsWith('@')) {
          attr = document.createAttributeNS('event', attribute.name.substring(1)) as WithLaplace<Attr>
        }
        else if (attribute.name.startsWith(':')) {
          attr = document.createAttributeNS('expr', attribute.name.substring(1)) as WithLaplace<Attr>
        }
        else {
          attr = document.createAttribute(attribute.name) as WithLaplace<Attr>
        }
        attr.laplace = attribute
        attr.value = attribute.value
        element.setAttributeNode(attr)
      }
      for (const child of node.children) {
        addNodeToDocument(document, element, child)
      }

      parent.appendChild(element)
    } break

    case NodeType.DIRECTIVE: {
      throw new Error('unreachable')
      // TODO: What is directive node?
    } break

    case NodeType.TEXT: {
      const text = document.createTextNode(node.content) as WithLaplace<Text>
      text.laplace = node
      parent.appendChild(text)
    } break

    case NodeType.CDATA: {
      const cdata = document.createCDATASection(node.content) as WithLaplace<CDATASection>
      cdata.laplace = node
      parent.appendChild(cdata)
    } break

    case NodeType.COMMENT: {
      const comment = document.createComment(node.content) as WithLaplace<Comment>
      comment.laplace = node
      parent.appendChild(comment)
    } break

    case NodeType.FRAGMENT: {
      const frag = document.createDocumentFragment() as WithLaplace<DocumentFragment>
      for (const child of node.children) {
        addNodeToDocument(document, frag, child)
      }
      frag.laplace = node
      parent.appendChild(frag)
    }
  }
}

export function laplace2domlike(laplaceNode: DocumentNode): Document {
  const domImpl = new DOMImplementation()
  const document = domImpl.createDocument('laplace', '', null) as WithLaplace<Document>
  document.laplace = laplaceNode

  const fakeRoot = document.createElement('root')
  for (const childNode of laplaceNode.children) {
    addNodeToDocument(document, fakeRoot, childNode)
  }
  document.appendChild(fakeRoot)
  return document
}
