import { strict as assert } from "assert";

import { tokenize, token } from "./tokenizer";
import { parse } from "./parser";
import type { FunctionDeclaration } from "./parser";
import { traverse } from "./traverse";

const input = `function hello(message) {
  console.log(message);
}`;

console.log("Input:");
console.log(input);

const tokens = tokenize(input);
console.log("Tokens:");
console.log(tokens);

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
console.log("Initial AST:");
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
                computed: false,
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

traverse(ast, {
  FunctionDeclaration: (node: FunctionDeclaration) => {
    if (node.id.name === "hello") {
      node.id.name = "print";
    }
  },
});

console.log("Transformed AST:");
console.dir(ast, { depth: null });

assert.deepEqual(ast, {
  type: "Program",
  body: [
    {
      type: "FunctionDeclaration",
      id: {
        type: "Identifier",
        name: "print",
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
                computed: false,
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
