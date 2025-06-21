import { type } from 'arktype'
import { defineAnimation, defineComponent, flows, render, root, withSpace } from '../src'
import f from '../src/flows/for'
import letBuiltIn from '../src/builtins/let'
import { elseFlow, elseIfFlow, ifFlow } from '../src/flows/condition'
import { animations } from '../src'
import { laplace2domlike } from '../src/dom-compat'
import { parse } from '../src/parser'
import { querySelectorXPath } from '../src/selector'

const move = defineAnimation((node, ctx, { attrs }) => {
  return {
    setup(progress) {
      if (progress >= 1) {
        console.log(attrs.x.value)
        attrs.x.value = 333
        return true
      }
      node.style.transform = `translateX(${ctx.easing(progress) * 100}px)`
      console.log(node.style.transform)
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
      const t = document.createElement('div')
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

const newTtt = withSpace(ttt, space)
root.set('ttt', newTtt)

console.log(newTtt({}, {}))

for (const flow of flowsToRegister) {
  flows.set(flow.name, flow)
}

flows.set('if', ifFlow)
flows.set('else', elseFlow)
flows.set('else-if', elseIfFlow)
// flows.set('animate', animationFlow)

const source = `
<let :y="114514" />
<ttt @click="console.log('click')" :x="3" $click="y(1000),1000">
</ttt>
{{ y }}
`

render(source, document.getElementById('app')!)
