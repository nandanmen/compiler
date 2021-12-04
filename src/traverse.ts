import {
  BlockStatement,
  CallExpression,
  ExpressionStatement,
  FunctionDeclaration,
  MemberExpression,
  Node,
  NodeType,
  Program,
} from "./parser";

// TODO: Type this better
type Visitor = Partial<Record<NodeType, (node: any) => void>>;

export function traverse(tree: Node, visitor: Visitor) {
  function traverseArray(nodes: Node[]) {
    nodes.forEach((child) => traverseNode(child));
  }

  function traverseNode(node: Node) {
    const visitFunction = visitor[node.type as NodeType];
    if (visitFunction) {
      visitFunction(node);
    }

    switch (node.type) {
      case NodeType.Program:
        traverseArray((node as Program).body);
        break;
      case NodeType.BlockStatement:
        traverseArray((node as BlockStatement).body);
        break;
      case NodeType.CallExpression: {
        let current = node as CallExpression;
        traverseNode(current.callee);
        traverseArray(current.arguments);
        break;
      }
      case NodeType.ExpressionStatement:
        traverseNode((node as ExpressionStatement).expression);
        break;
      case NodeType.FunctionDeclaration: {
        let current = node as FunctionDeclaration;
        traverseNode(current.id);
        traverseArray(current.params);
        traverseNode(current.body);
        break;
      }
      case NodeType.Identifier:
        break;
      case NodeType.MemberExpression: {
        let current = node as MemberExpression;
        traverseNode(current.object);
        traverseNode(current.property);
        break;
      }
      default:
        throw new TypeError(`Unknown node type: ${node.type}`);
    }
  }

  traverseNode(tree);
}
