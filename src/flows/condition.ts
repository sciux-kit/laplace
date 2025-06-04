import { toValue } from '@vue/reactivity'
import { defineFlow } from '../flow'
import type { ElementNode } from '../parser.ts'
import { NodeType } from '../parser.ts'

function hasAttribute(node: ElementNode, attrName: string) {
  for (const attr of node.attributes) {
    if (attr.name === attrName)
      return true
  }
  return false
}

export const ifFlow = defineFlow((processor) => {
  return {
    name: 'if',
    type: 'pre',
    flow(value, source, render) {
      const condition = processor(value)
      if (toValue(condition)) {
        return render(source)
      }
      return []
    },
  }
})

export const elseIfFlow = defineFlow((processor) => {
  return {
    name: 'else-if',
    type: 'pre',
    flow(value, source, render) {
      console.assert(source.parent !== undefined)
      const condition = toValue(processor(value))

      // Now try to find the if-else chain...
      let child_idx = -1
      for (const [idx, value] of source.parent!.children.entries()) {
        if (value === source) {
          child_idx = idx
        }
      }

      // 1. Find the head `if`.
      let if_idx = -1
      for (let i = 1; i <= child_idx; i++) {
        const sus = source.parent!.children[child_idx - i]
        if (sus.type === NodeType.ELEMENT) {
          // Do we have if? Do we have if? Do we have if?
          if (hasAttribute(sus, '#if')) {
            // Yoshi! We found it.
            if_idx = child_idx - i
            break
          }
          else if (!hasAttribute(sus, '#else-if')) {
            // Orphaned.
            break
          }
        }
        else if (sus.type !== NodeType.COMMENT) {
          // Weird...?
          break
        }
      }

      if (if_idx === -1) {
        throw new Error('Orphaned else-if element', { cause: source })
      }

      // 2. Check if senpais are all unsatisfied.
      for (let i = if_idx; i < child_idx; i++) {
        // 100% sure it is element node if code executed to here.
        const node = source.parent!.children[i] as ElementNode
        let condition = false
        for (const attr of node.attributes) {
          if (attr.name === '#if' || attr.name === '#else-if') {
            condition = <boolean>toValue(processor(attr.value))
            break
          }
        }
        // Someone succeeded! Time to have a break.
        if (condition) {
          return []
        }
      }

      // 3. No one succeeded? That's bad.
      if (condition)
        return render(source)

      return []
    },
  }
})

// The else flow is equalivent to else-if but condition is always true.
export const elseFlow = defineFlow((processor) => {
  return {
    name: 'else',
    type: 'pre',
    flow(_value, source, render) {
      console.assert(source.parent !== undefined)

      // Now try to find the if-else chain...
      let child_idx = -1
      for (const [idx, value] of source.parent!.children.entries()) {
        if (value === source) {
          child_idx = idx
        }
      }

      // 1. Find the head `if`.
      let if_idx = -1
      for (let i = 1; i <= child_idx; i++) {
        const sus = source.parent!.children[child_idx - i]
        if (sus.type === NodeType.ELEMENT) {
          // Do we have if? Do we have if? Do we have if?
          if (hasAttribute(sus, '#if')) {
            // Yoshi! We found it.
            if_idx = child_idx - i
            break
          }
          else if (!hasAttribute(sus, '#else-if')) {
            // Orphaned.
            break
          }
        }
        else if (sus.type !== NodeType.COMMENT) {
          // Weird...?
          break
        }
      }

      if (if_idx === -1) {
        throw new Error('Orphaned else-if element', { cause: source })
      }

      // 2. Check if senpais are all unsatisfied.
      for (let i = if_idx; i < child_idx; i++) {
        // 100% sure it is element node if code executed to here.
        const node = source.parent!.children[i] as ElementNode
        let condition = false
        for (const attr of node.attributes) {
          if (attr.name === '#if' || attr.name === '#else-if') {
            condition = <boolean>toValue(processor(attr.value))
            break
          }
        }
        // Someone succeeded! Time to have a break.
        if (condition) {
          return []
        }
      }

      // 3. Render if no one succeeded.
      return render(source)
    },
  }
})
