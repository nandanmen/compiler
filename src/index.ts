import { strict as assert } from "assert";

import { tokenize, token } from "./tokenizer";
import { parse } from "./parser";

const input = `function hello(message) {
  console.log(message);
}`;

const tokens = tokenize(input);
console.log("Tokens: ", tokens);

assert.deepEqual(tokens, [
  token.keyword("function"),
  token.identifier("hello"),
  token.leftParen(),
  token.identifier("message"),
  token.rightParen(),
  token.leftCurly(),
  token.identifier("console"),
  token.dot(),
  token.identifier("log"),
  token.leftParen(),
  token.identifier("message"),
  token.rightParen(),
  token.semicolon(),
  token.rightCurly(),
]);

const ast = parse(tokens);
console.dir(ast, { depth: null });

assert.deepEqual(ast, {
  type: "Program",
  body: [
    {
      type: "FunctionDeclaration",
      id: {
        type: "Identifier",
        name: "hello",
      },
      params: [
        {
          type: "Identifier",
          name: "message",
        },
      ],
      body: {
        type: "BlockStatement",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              callee: {
                type: "MemberExpression",
                object: {
                  type: "Identifier",
                  name: "console",
                },
                property: {
                  type: "Identifier",
                  name: "log",
                },
              },
              arguments: [
                {
                  type: "Identifier",
                  name: "message",
                },
              ],
            },
          },
        ],
      },
    },
  ],
});
