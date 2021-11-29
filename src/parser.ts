import type { Token } from "./tokenizer";

interface Node {
  type: string;
}

interface Program extends Node {
  type: "Program";
  body: Statement[];
}

interface FunctionDeclaration extends Function, Declaration {
  type: "FunctionDeclaration";
  id: Identifier;
}

interface Identifier extends Node {
  type: "Identifier";
  name: string;
}

interface BlockStatement extends Statement {
  type: "BlockStatement";
  body: Statement[];
}

interface ExpressionStatement extends Statement {
  type: "ExpressionStatement";
  expression: Expression;
}

interface CallExpression extends Expression {
  type: "CallExpression";
  callee: Expression;
  arguments: Expression[];
}

interface MemberExpression extends Expression, Pattern {
  type: "MemberExpression";
  object: Expression;
  property: Expression;
  computed: boolean;
}

interface Statement extends Node {}
interface Expression extends Node {}
interface Pattern extends Node {}

interface Function extends Node {
  id: Identifier | null;
  params: Pattern[];
  body: FunctionBody;
}

interface Declaration extends Statement {}

interface FunctionBody extends BlockStatement {
  body: Statement[];
}

export function parse(tokens: Token[]): Program {
  return parseProgram(tokens);
}

function parseProgram(tokens: Token[]): Program {
  const programNode: Program = {
    type: "Program",
    body: [],
  };

  return programNode;
}
