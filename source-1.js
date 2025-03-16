/* eslint-disable unicorn/new-for-builtins */
/* eslint-disable antfu/top-level-function */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const __template = (__parentContext) => {
  const __context = createContext(__parentContext)

  const __element$0 = ((__context) => { /* Scope 0 */
    return createFor(
      __context,
      createExpression(__context, ({ list }) => list),
      (__context, i) => {
        return createElement('block', null, createIfBranch(
          __context,
          createExpression(__context, () => i % 2 === 0),
          () => {
            return createElement(
              'block',
              null,
              createInterpolation(
                createExpression(__context, () => i),
              ),
            )
          },
          createIfElseBranch(
            __context,
            () => {
              return createElement('block', null, '1')
            },
          ),
        ))
      },
    )
  })(mergeContext(
    __context,
    'list',
    ({ foo }) => Array(foo).items(),
  ))

  const __root = __element$0

  return __root
}
