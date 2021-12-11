import { parse } from "../parser";
import { tokens } from "./fixtures/tokens";

describe("parser", () => {
  it("should successfully parse the tokens into an AST", () => {
    const ast = parse(tokens);
    expect(ast).toEqual({
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
  });
});
