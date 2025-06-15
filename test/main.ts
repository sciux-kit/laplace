import { type } from 'arktype'
import { namespaceManager, defineAnimation, defineComponent, flows, render } from '../src'
import f from '../src/flows/for'
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

namespaceManager.createNamespace('let')
namespaceManager.registerComponent(
  'let',
  'ppp',
  defineComponent((attrs) => {
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
  }),
)

for (const flow of flowsToRegister) {
  flows.set(flow.name, flow)
}

const source = `
<let :x="114514">
<let:ppp :test="1">
</let:ppp>
<let:ppp :test="x">
</let:ppp>
</let>

{{ x }}
`

render(source, document.getElementById('app')!)
