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

flows.set('for', f)

const source = `
<let :c="[1,2,3,4,5]"/>
{{ c }}
`

console.log(components)

render(source, document.getElementById('app')!)
