import { parseSource, render } from '../src'
import '../src/middlewares/fallthrough'
import '../src/middlewares/ref'
import '../src/builtins/for'
import '../src/builtins/if'
import '../src/builtins/let'
import '../src/builtins/value'

const source = `
<let :a="['foo', 'bar']"/>
<for :in="a" key="item">
    <value :data="item" />
</for>
`

render(source, document.getElementById('app')!)

