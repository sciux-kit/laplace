const __template = (__parentContext) => {
  let __context = createContext(__parentContext);
  const __root = (() => (createDocument(
    createComment(' Document Global Scope '),
    /* Scope Context */
    (((__context) => /* Scope Start [foo] */
    (createFragment(createComment(' Scope 0 Start'), /* Scope Context */
      (((__context) => /* Scope Start [list] */
      (createFragment(createFor(__context, /* [for] Target */createExpression(
        __context,
        ({ list }) => list), (__context) => /* [block] Element Start */
        createElement('block', /* Attributes */
  /* Record Start */({
            /* : built-in directive for */
          }) /* Record End */
          ,
  /* Children */ null
        )
  /* [block] Element End*/, (__context,  /* [for] Params */ i) => createFragment(createIf(__context,
          {
      /* [if] Branch Count */ __n: 1,
      /* [if] Branches */
      /* [if] Branch 0 */ 0: [createExpression(
            __context,
            (/* Empty */) => i % 2 === 0), (__context) => (/* [block] Element Start */
              createElement('block', /* Attributes */
  /* Record Start */({
                  /* : built-in directive if */
                }) /* Record End */
                ,
  /* Children */ createInterpolation(__context, createExpression(
                  __context,
                  (/* Empty */) => `${i} is even.`))
              )
  /* [block] Element End*/)]
            ,
  /* [if] Else */ __else: (__context) => /* [block] Element Start */
              createElement('block', /* Attributes */
  /* Record Start */({
                  /* : built-in directive else */
                }) /* Record End */
                ,
  /* Children */ createText(`It is odd.`)
              )
            /* [block] Element End*/
          }))), createComment(' Scope 0 End'))
      ))(mergeContext(__context,
  /* Record Start */({
          list: createExpression(
            __context,
            ({ foo }) => Object.keys(Array.from({ length: foo })))
        }) /* Record End */
      ))))
    ))(mergeContext(__context,
  /* Record Start */({
        foo: createExpression(
          __context,
          (/* Empty */) => 5 * 2)
      }) /* Record End */
    ))))))();
  return __root;
};