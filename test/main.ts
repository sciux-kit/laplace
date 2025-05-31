import { components, defineComponent, flows, render } from "../src";
import f from "../src/flows/for";
import { elseFlow, elseIfFlow, ifFlow } from "../src/flows/condition";
import { type } from "arktype";
import { laplace2domlike } from "../src/dom-compat";
import { parse } from "../src/parser";
import { querySelectorXPath } from "../src/selector";

const testAttrs = type({
  test: "number",
});

const letAttrs = type({
  name: "string",
  value: "unknown",
});

const flowsToRegister = [f, ifFlow, elseIfFlow, elseFlow];

components.set(
  "br",
  defineComponent((attrs) => {
    return {
      name: "br",
      attrs: type("object"),
      globals: {}
    };
  }),
);

components.set(
  "ppp",
  defineComponent((attrs) => {
    return {
      name: "ppp",
      attrs: type("object"),
      globals: {},
      setup(children) {
        const p = document.createElement("p")
        for (const child of children()) {
          if (child) p.appendChild(child)
        }
        return p;
      }
    };
  }),
);

for (const flow of flowsToRegister) {
  flows.set(flow.name, flow);
}

flows.set("if", ifFlow);
flows.set("else", elseFlow);
flows.set("else-if", elseIfFlow);

const source = `
<ppp>
<let :c="[1,2,3,4,5]"/>
<let :x="3" />
{{ c }}
<ppp #if="false">
{{ x }}
</ppp><ppp #else-if="false">
  what
</ppp><ppp #else>
2 {{ x }}
</ppp>
</ppp>
`;

console.log(components);

console.log(parse(source))
render(source, document.getElementById("app")!);

console.log(laplace2domlike(parse(source)));
console.log(querySelectorXPath(parse(source), "/root/"));
