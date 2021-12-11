export const ast = {
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
};

export const transformedAst = {
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
};
