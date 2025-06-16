import { type } from 'arktype'
import { root, defineAnimation, defineComponent, flows, render, withSpace } from '../src'
import f from '../src/flows/for'
import letBuiltIn from '../src/builtins/let'
import { elseFlow, elseIfFlow, ifFlow } from '../src/flows/condition'
import animationFlow, { animations } from '../src/flows/animation'
import { laplace2domlike } from '../src/dom-compat'
import { parse } from '../src/parser'
import { querySelectorXPath } from '../src/selector'

const move = defineAnimation((node, ctx, processor) => {
  return {
    setup(progress) {
      if (progress >= 1)
        return true
      node.style.transform = `translateX(${ctx.easing(progress) * 100}px)`
      return false
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
      console.log('Heeeeeeelllllloooo pppppppppp!')
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

const ttt = defineComponent((attrs) => {
  return {
    name: 'ttt',
    attrs: type('object'),
    globals: {},
    setup(children) {
      console.log('Heeeeeeelllllloooo ttttttttttt!')
      const t = document.createElement('ttt')
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

const newTtt = withSpace(ttt, space)
root.set('ttt', newTtt)

console.log(newTtt({}, {}))

for (const flow of flowsToRegister) {
  flows.set(flow.name, flow)
}

flows.set('if', ifFlow)
flows.set('else', elseFlow)
flows.set('else-if', elseIfFlow)
flows.set('animate', animationFlow)

const source = `
<ttt>
</ttt>
  <ppp :test="114514"/>
`

render(source, document.getElementById('app')!)
