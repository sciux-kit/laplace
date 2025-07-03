import { type } from 'arktype'
import { animationManager, defineAnimation, defineComponent, flows, render, root, watch, withSpace } from '../src'
import f from '../src/flows/for'
import letBuiltIn from '../src/builtins/let'
import { elseFlow, elseIfFlow, ifFlow } from '../src/flows/condition'
import { animations } from '../src'
import { laplace2domlike } from '../src/dom-compat'
import { parse } from '../src/parser'
import { querySelectorXPath } from '../src/selector'

window.addEventListener('load', () => {
  animationManager.init()
})

import type { Context } from 'sciux-laplace'
import { toValue } from '@vue/reactivity'
import { type } from 'arktype'
import { defineComponent } from 'sciux-laplace'

const T = type({
  disabled: 'boolean',
})

const button = defineComponent<'button', typeof T.infer, Context>((attrs, _context) => {
  return {
    name: 'button',
    attrs: T,
    defaults: {
      disabled: false,
    },
    setup: (children) => {
      console.log('wwwwwwwwwwww')
      const element = document.createElement('button')
      element.disabled = toValue(attrs.disabled)
      element.append(...children())
      return element
    },
  }
})
root.set('button', button)


const move = defineAnimation((node, ctx, { attrs }) => {
  return {
    setup(progress) {
      if (progress >= 1) {

        attrs.x.value = 333
        return true
      }
      node.style.transform = `translateX(${ctx.easing(progress) * 100}px)`

      return false
    },
    validator(name) {
      return name === 'ttt'
    },
  }
})
animations.set('move', move)

const testAttrs = type({
  test: 'number',
})

const letAttrs = type({
  name: 'string',
  value: 'unknown',
})

const flowsToRegister = [f, ifFlow, elseIfFlow, elseFlow]

root.set(
  'br',
  defineComponent((attrs) => {
    return {
      name: 'br',
      attrs: type('object'),
      globals: {},
    }
  }),
)

const ppp = defineComponent((attrs) => {
  return {
    name: 'ppp',
    attrs: type('object'),
    globals: {},
    setup(children) {

      const p = document.createElement('p')
      for (const child of children()) {
        if (child)
          p.appendChild(child)
        p.appendChild(document.createTextNode(attrs.test?.value))
      }
      return p
    },
    animations: {
      move,
    },
  }
})

const ccc = defineComponent((attrs) => {
  return {
    name: 'ccc',
    attrs: type('object'),
    globals: {},
    setup(children) {
      const c = document.createElement('div')
      c.textContent = attrs.x.value
      return c
    },
  }
})

const ttt = defineComponent((attrs, context) => {

  console.log(context)
  watch(attrs.x, (x) => {

  })
  return {
    name: 'ttt',
    attrs: type('object'),
    globals: {},
    defaults: {
      x: 0,
      y: 0,
    },
    setup(children) {
      const t = document.createElement('div')
      t.style.transform = `translateX(${attrs.x.value}px) translateY(${attrs.y.value}px)`
      t.textContent = 'Hello' + attrs.x.value
      for (const child of children()) {
        if (child)
          t.appendChild(child)
      }
      return t
    },
  }
})

const space = new Map()
space.set('ppp', ppp)
space.set('let', letBuiltIn)
space.set('ccc', ccc)

// const newTtt = withSpace(ttt, space)
root.set('ttt', ttt)
root.set('ccc', ccc)


for (const flow of flowsToRegister) {
  flows.set(flow.name, flow)
}

flows.set('if', ifFlow)
flows.set('else', elseFlow)
flows.set('else-if', elseIfFlow)
// flows.set('animate', animationFlow)

const source = `
<let :pos_x="100" />
<let :y="Math.sin(pos_x / 100) * 100" />
<ttt :x="pos_x" :y="y + 200" @click="pos_x++">
<button @click="pos_x++">Click me</button>
<let :z="pos_x + 100" />
<ccc :x="pos_x + z" />
</ttt>
{{ pos_x }}
`

const [updater, ast] = render(source, document.getElementById('app')!)

console.log(ast)
const target = ast.children[3]!
target.attributes[0].value = '444'

updater(target)




