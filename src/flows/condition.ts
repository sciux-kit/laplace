import { toValue } from "@vue/reactivity";
import { defineFlow } from "../flow";
import { createProcessor, getContext } from "../renderer";

export default defineFlow({
  name: 'if',
  type: 'pre',
  flow(value, source, render) {
    const condition = createProcessor(getContext())(value)
    if (toValue(condition)) {
      return render(source)
    }
    return []
  }
})
