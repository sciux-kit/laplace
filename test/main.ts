import { components, defineComponent, render } from '../src'
import { type } from 'arktype'

const testAttrs = type({
  test: 'number'
})

const letAttrs = type({
  name: 'string',
  value: 'unknown'
})

const test = defineComponent<'test', typeof testAttrs.infer>((context, attrs) => {
  return {
    name: 'test',
    attrs: testAttrs,
    setup: () => {
      console.log('update test')
      console.log(attrs)
      return document.createTextNode(attrs.test.value.toString())
    },
    provides: {},
    globals: {},
  }
})
const letComp = defineComponent<'let', typeof letAttrs.infer>((context, attrs) => {
  const provides = {
    [attrs.name.value]: attrs.value,
  }
  console.log('provides:', provides)
  return {
    name: 'let',
    attrs: letAttrs,
    setup: (children) => {
      console.log('update let')
      const node = document.createElement('div')
      const text1 = document.createTextNode(`LET VAR ${attrs.name} = ${attrs.value.toString()}`)
      node.appendChild(text1)
      children().forEach(child => {
        node.appendChild(child)
      })
      return node
    },
    provides,
    globals: {},
  }
})
components.set('test', test)
components.set('let', letComp)

const source = `
<let name="test" :value="2233 + 333">
  <test :test="test"/>
</let>
`

render(source, document.getElementById('app')!)
