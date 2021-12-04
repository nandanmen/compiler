import {
  BlockStatement,
  CallExpression,
  ExpressionStatement,
  FunctionDeclaration,
  MemberExpression,
  Node,
  NodeType,
  Program,
  Identifier,
} from "./parser";

export function generate(node: Node): string {
  switch (node.type) {
    case NodeType.Program:
      return (node as Program).body.map(generate).join("\n");
    case NodeType.BlockStatement:
      return `{
  ${(node as BlockStatement).body.map(generate).join("\n")}
}`;
    case NodeType.CallExpression: {
      const callExpr = node as CallExpression;
      return `${generate(callExpr.callee)}(${callExpr.arguments
        .map(generate)
        .join(", ")})`;
    }
    case NodeType.ExpressionStatement:
      return generate((node as ExpressionStatement).expression) + ";";
    case NodeType.FunctionDeclaration: {
      let current = node as FunctionDeclaration;
      return `function ${generate(current.id)}(${current.params
        .map(generate)
        .join(", ")}) ${generate(current.body)}`;
    }
    case NodeType.Identifier:
      return (node as Identifier).name;
    case NodeType.MemberExpression: {
      let current = node as MemberExpression;
      return `${generate(current.object)}.${generate(current.property)}`;
    }
    default:
      throw new TypeError(`Unknown node type: ${node.type}`);
  }
}
