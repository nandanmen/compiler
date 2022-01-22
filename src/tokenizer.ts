export function tokenize(input: string): Token[] {
  let current = 0;
  const tokens = [];

  function finishIdentifier() {
    let name = "";
    while (isAlpha(input[current])) {
      name += input[current];
      current++;
    }

    const builder = keywords.get(name);
    if (builder) {
      return builder();
    }

    return token.identifier(name);
  }

  function finishStringLiteral() {
    let value = "";
    while (input[current] && input[current] !== "'") {
      value += input[current];
      current++;
    }

    if (input[current] === "'") {
      // consume the closing tick
      current++;
      return token.stringLiteral(value);
    }

    throw new Error(`Unterminated string, expected a closing '`);
  }

  while (current < input.length) {
    const currentChar = input[current];

    if (isWhitespace(currentChar)) {
      current++;
      continue;
    }

    if (isAlpha(currentChar)) {
      tokens.push(finishIdentifier());
    } else if (isSingleCharacter(currentChar)) {
      tokens.push(getCharToken(currentChar));
      current++;
    } else if (currentChar === "'") {
      // consume the first tick
      current++;
      tokens.push(finishStringLiteral());
    } else {
      throw new Error(`Unknown character: ${currentChar}`);
    }
  }

  return tokens;
}

// --

export enum TokenType {
  Function = "Function",
  Identifier = "Identifier",
  LeftParen = "LeftParen",
  RightParen = "RightParen",
  LeftCurly = "LeftCurly",
  RightCurly = "RightCurly",
  Dot = "Dot",
  Semicolon = "Semicolon",
  StringLiteral = "StringLiteral",
}

export type Token =
  | {
      type: TokenType;
    }
  | {
      type: TokenType.Identifier;
      name: string;
    }
  | {
      type: TokenType.StringLiteral;
      value: string;
    };

export const token = {
  function() {
    return {
      type: TokenType.Function,
    };
  },
  identifier(name: string) {
    return {
      type: TokenType.Identifier,
      name,
    };
  },
  leftParen() {
    return { type: TokenType.LeftParen };
  },
  rightParen() {
    return { type: TokenType.RightParen };
  },
  leftCurly() {
    return { type: TokenType.LeftCurly };
  },
  rightCurly() {
    return { type: TokenType.RightCurly };
  },
  dot() {
    return { type: TokenType.Dot };
  },
  semicolon() {
    return { type: TokenType.Semicolon };
  },
  stringLiteral(value: string) {
    return {
      type: TokenType.StringLiteral,
      value,
    };
  },
};

const keywords = new Map([["function", token.function]]);

// --

function isAlpha(char: string) {
  return /[a-zA-Z]/.test(char);
}

function isWhitespace(char: string) {
  return /\s/.test(char);
}

type SingleCharacterToken = "(" | ")" | "{" | "}" | "." | ";";

const knownSingleCharacters = new Map<SingleCharacterToken, () => Token>([
  ["(", token.leftParen],
  [")", token.rightParen],
  ["{", token.leftCurly],
  ["}", token.rightCurly],
  [".", token.dot],
  [";", token.semicolon],
]);

function isSingleCharacter(char: string): char is SingleCharacterToken {
  return knownSingleCharacters.has(char as SingleCharacterToken);
}

function getCharToken(char: SingleCharacterToken) {
  const builder = knownSingleCharacters.get(char);
  return builder!();
}
