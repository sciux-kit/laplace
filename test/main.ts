import { components, defineComponent, flows, render } from '../src'
import f from '../src/flows/for'
import { type } from 'arktype'

const testAttrs = type({
  test: 'number'
})

const letAttrs = type({
  name: 'string',
  value: 'unknown'
})

const test = defineComponent<'test', typeof testAttrs.infer>((attrs, context) => {
  return {
    name: 'test',
    attrs: testAttrs,
    setup: () => {
      console.log('update test')
      console.log(attrs)
      console.error(context)
      return document.createTextNode(attrs.test.value.toString())
    },
    provides: {},
    globals: {},
  }
})
const letComp = defineComponent<'let', typeof letAttrs.infer>((attrs, context) => {
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
      // const text1 = document.createTextNode(`LET VAR ${attrs.name} = ${attrs.value.toString()}`)
      // node.appendChild(text1)
      const kids = children()
      console.log('kids:', kids)
      kids.forEach(child => {
        console.log(child, node)
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
flows.set('for', f)

const source = `
<let name="c" :value="22">
  <let #for="i in c" name="e" :value="333">
    <test :test="i" />
  </let>
</let>
`

render(source, document.getElementById('app')!)
