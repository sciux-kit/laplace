import { defineComponent } from "../component"
import { type } from "arktype"

export default defineComponent<'let', any>((attrs) => {
  return {
    name: 'let',
    attrs: type('object'),
    globals: attrs
  }
})
