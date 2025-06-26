import { type } from 'arktype'
import { effect, ref, toRefs } from '@vue/reactivity'
import { defineComponent } from '../component'

export default defineComponent<'let', any>((attrs) => {

  const globals = Object.fromEntries(Object.entries(attrs).map(([key, value]) => [key, ref(value.value ?? value)]))
  effect(() => {
    Object.entries(attrs).forEach(([key, value]) => {
      globals[key].value = value.value ?? value
    })
  })

  return {
    name: 'let',
    attrs: type('object'),
    globals,
  }
})
