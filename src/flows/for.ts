import { defineFlow } from "../flow";
import { BaseNode } from "../parser";
import { addActiveContext, createProcessor, getContext } from "../renderer";

export default defineFlow({
  name: 'for',
  type: 'pre',
  flow(value, source, render) {
    return document.createElement('div')
  },
})
