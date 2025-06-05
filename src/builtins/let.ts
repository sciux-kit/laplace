import { type } from 'arktype'
import { defineComponent } from '../component'

export default defineComponent<'let', any>((attrs) => {
  return {
    name: 'let',
    attrs: type('object'),
    globals: attrs,
  }
})
