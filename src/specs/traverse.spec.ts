import { traverse } from "../traverse";
import { ast } from "./fixtures/ast";

describe("traverse", () => {
  it("should successfully update the AST", () => {
    traverse(ast, {
      FunctionDeclaration: (node) => {
        if (node.id.name === "hello") {
          node.id.name = "print";
        }
      },
    });

    expect(ast).toEqual({
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
  });
});
