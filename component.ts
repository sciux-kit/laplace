import * as t from 'yup'


export type DefineComponent = {
  name: string
  emits?: string[]
  props?: t.ObjectShape
  setup?: (props: Record<string, any>) => Record<string, any>
  render?: (props: Record<string, any>) => string
}


const a: DefineComponent = {
  name: 'button',
  props: {
    type: t.string()
  }
}