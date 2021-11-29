# Parser

Next step: Figure out how to convert the tokens to an AST

- The Babel AST seems to group the function body in a `BlockExpression` instead of the statements themselves
- **What's the difference between a statement and an expression?**
  - An expression resolves to a value, whereas a statement doesn't??
  - An `ExpressionStatement` is an expression where a statement is expected
  - `if` and `while` are examples of statements because they don't return anything
    - In some languages, they _do_ return something, in which case they are expressions

Here, the `console.log` is an `ExpressionStatement` because a function body is a series of statements, but the `console.log` call is an expression. 

```js
function hello(message) {
  console.log(message);
}
```

- **But why is there a need to wrap the expression in an additional layer? Is it wrong to say that a function body consists of either statements _or_ expressions?**
  - Maybe it's a spec thing? I should check the `estree` spec
- I think I'll leave the ast to something that makes sense to me, then I'll change it later when I find a reason to
- According to the [estree spec](https://github.com/estree/estree/blob/master/es5.md#functionbody), a function body is a `BlockStatement` with an array of `Directive`s or `Statement`s
  - So it does seem like a spec thing
- **But what's a directive?**
  - From [here](https://webplatform.github.io/docs/javascript/directives/), it looks like the only valid directive is `"use strict"` but I'm not sure if anything changed since the project was discontinued in 2015?
- I think I'll use an AST that conforms to the estree spec
