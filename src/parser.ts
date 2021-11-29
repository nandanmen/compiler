import { Token, TokenType } from "./tokenizer";

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

  let current = 0;

  // Builders

  function functionDeclaration(): FunctionDeclaration {
    /**
     * Identifiers are required in function declarations; you can't declare
     * an anonymous function in JS
     */
    const nextToken = assertNext(TokenType.Identifier);
    const id = identifier(nextToken);

    assertNext(TokenType.LeftParen);

    /**
     * Currently we only support one IDENTIFEIR param in functions
     * TODO: Support multiple IDENTIFIER params
     * TODO: Support other ways to declare params (destructuring)
     */
    const paramToken = assertNext(TokenType.Identifier);
    const param = identifier(paramToken);

    assertNext(TokenType.RightParen);
    assertType(peekNext(), TokenType.LeftCurly);

    return {
      type: "FunctionDeclaration",
      id,
      params: [param],
      body: blockStatement(),
    };
  }

  function blockStatement(): BlockStatement {
    return {
      type: "BlockStatement",
      body: [],
    };
  }

  function identifier(token: Token): Identifier {
    return {
      type: "Identifier",
      name: token.name!,
    };
  }

  // Utils

  function assertNext(type: TokenType) {
    const next = getNext();
    assertType(next, type);
    return next;
  }

  function assertType(token: Token, type: TokenType) {
    if (token.type !== type) {
      throw new SyntaxError(`Unexpected token: ${token.type}`);
    }
  }

  function getNext() {
    // ++_ means increment first then return
    return tokens[++current];
  }

  function peekNext() {
    return tokens[current + 1];
  }

  // Loop through all tokens

  const currentToken = tokens[current];

  // TODO: Support multiple statements in a program
  switch (currentToken.type) {
    case TokenType.Keyword: {
      if (currentToken.name === "function") {
        programNode.body.push(functionDeclaration());
        break;
      }
    }
    default: {
      throw new SyntaxError(`Unexpected token: ${currentToken.type}`);
    }
  }

  return programNode;
}
