import { Token, TokenType } from "./tokenizer";

export enum NodeType {
  Program = "Program",
  FunctionDeclaration = "FunctionDeclaration",
  Identifier = "Identifier",
  BlockStatement = "BlockStatement",
  ExpressionStatement = "ExpressionStatement",
  CallExpression = "CallExpression",
  MemberExpression = "MemberExpression",
}

export interface Node {
  type: string;
}

export interface Program extends Node {
  type: NodeType.Program;
  body: Statement[];
}

export interface FunctionDeclaration extends Function, Declaration {
  type: NodeType.FunctionDeclaration;
  id: Identifier;
}

export interface Identifier extends Node {
  type: NodeType.Identifier;
  name: string;
}

export interface BlockStatement extends Statement {
  type: NodeType.BlockStatement;
  body: Statement[];
}

export interface ExpressionStatement extends Statement {
  type: NodeType.ExpressionStatement;
  expression: Expression;
}

export interface CallExpression extends Expression {
  type: NodeType.CallExpression;
  callee: Expression;
  arguments: Expression[];
}

export interface MemberExpression extends Expression, Pattern {
  type: NodeType.MemberExpression;
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
    type: NodeType.Program,
    body: [],
  };

  let current = 0;

  // -- Util functions --

  /**
   * Given a list of types, check if the current token matches
   * one of the types and if so, consumes it. Otherwise, returns
   * false.
   */
  function match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (check(type)) {
        advance();
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if we've consumed all the tokens
   */
  function isAtEnd() {
    return current >= tokens.length;
  }

  /**
   * Returns true if the current token is of the given type
   */
  function check(type: TokenType) {
    if (isAtEnd()) return false;
    return peek().type === type;
  }

  /**
   * Returns the current token without consuming it
   */
  function peek() {
    return tokens[current];
  }

  /**
   * Consumes and returns the current token
   */
  function advance() {
    if (!isAtEnd()) current++;
    return previous();
  }

  /**
   * Returns the previous token
   */
  function previous() {
    return tokens[current - 1];
  }

  /**
   * Consumes and returns the current token if it matches the provided type.
   * Throws a syntax error if the token doesn't match the type.
   */
  function consume(type: TokenType) {
    if (check(type)) return advance();
    throw new SyntaxError(
      `Unexpected token: Expected ${type}, found ${peek().type}`
    );
  }

  /**
   * Repeatedly calls `consume` until `current` points to a token of the given
   * type. Assumes `consume` updates the current token pointer.
   */
  function consumeUntil(type: TokenType, consume: () => void) {
    while (!isAtEnd() && !match(type)) {
      consume();
    }

    /**
     * Throw a syntax error if we reached the end of input and didn't
     * find the type we were looking for.
     */
    if (isAtEnd() && previous().type !== type) {
      throw new SyntaxError(`Unexpected end of file. Expected ${type}`);
    }
  }

  // -- Builders --

  function statement(): Statement {
    if (check(TokenType.Keyword)) {
      if (peek().name === "function") {
        return declaration();
      }
    } else if (check(TokenType.LeftCurly)) {
      return blockStatement();
    }
    return expressionStatement();
  }

  function declaration(): Declaration {
    return functionDeclaration();
  }

  function functionDeclaration(): FunctionDeclaration {
    consume(TokenType.Keyword);
    const id = identifier();
    consume(TokenType.LeftParen);
    const param = identifier();
    consume(TokenType.RightParen);
    const body = blockStatement();
    return {
      type: NodeType.FunctionDeclaration,
      id,
      params: [param],
      body,
    };
  }

  function blockStatement(): BlockStatement {
    consume(TokenType.LeftCurly);

    const statements: Statement[] = [];

    consumeUntil(TokenType.RightCurly, () => {
      statements.push(statement());
    });

    return {
      type: NodeType.BlockStatement,
      body: statements,
    };
  }

  function expressionStatement(): ExpressionStatement {
    const expr = expression();
    consume(TokenType.Semicolon);
    return {
      type: NodeType.ExpressionStatement,
      expression: expr,
    };
  }

  function expression(): Expression {
    let expr: Expression = identifier();

    while (true) {
      if (match(TokenType.Dot)) {
        expr = memberExpression(expr);
      } else if (match(TokenType.LeftParen)) {
        expr = callExpression(expr);
      } else {
        break;
      }
    }

    return expr;
  }

  function callExpression(callee: Expression): CallExpression {
    const args: Expression[] = [];

    consumeUntil(TokenType.RightParen, () => {
      args.push(expression());
    });

    return {
      type: NodeType.CallExpression,
      arguments: args,
      callee,
    };
  }

  function memberExpression(object: Expression): MemberExpression {
    const property = identifier();
    return {
      type: NodeType.MemberExpression,
      object,
      property,
      computed: false,
    };
  }

  function identifier(): Identifier {
    const { name } = consume(TokenType.Identifier);
    return {
      type: NodeType.Identifier,
      name: name!,
    };
  }

  // -- Program --

  while (!isAtEnd()) {
    programNode.body.push(statement());
  }

  return programNode;
}
