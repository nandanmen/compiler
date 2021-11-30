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

  function checkNext(type: TokenType) {
    if (isAtEnd()) return false;
    const next = peekNext();
    if (next) {
      return next.type === type;
    }
    return false;
  }

  /**
   * Returns the current token without consuming it
   */
  function peek() {
    return tokens[current];
  }

  function peekNext() {
    return tokens[current + 1];
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

  function consume(type: TokenType) {
    if (check(type)) return advance();
    throw new SyntaxError(
      `Unexpected token: Expected ${type}, found ${previous().type}`
    );
  }

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
      type: "FunctionDeclaration",
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
      type: "BlockStatement",
      body: statements,
    };
  }

  function expressionStatement(): ExpressionStatement {
    const expr = expression();
    consume(TokenType.Semicolon);
    return {
      type: "ExpressionStatement",
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
      type: "CallExpression",
      arguments: args,
      callee,
    };
  }

  function memberExpression(object: Expression): MemberExpression {
    const property = identifier();
    return {
      type: "MemberExpression",
      object,
      property,
      computed: false,
    };
  }

  function identifier(): Identifier {
    const { name } = consume(TokenType.Identifier);
    return {
      type: "Identifier",
      name: name!,
    };
  }

  // -- Program --

  while (!isAtEnd()) {
    programNode.body.push(statement());
  }

  return programNode;
}
