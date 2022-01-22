export function tokenize(input: string): Token[] {
  let start = 0;
  let current = 0;
  const tokens = [];

  function finishIdentifier() {
    while (isAlpha(input[current])) {
      current++;
    }
    const name = input.substring(start, current);
    start = current;

    const builder = keywords.get(name);
    if (builder) {
      return builder();
    }

    return token.identifier(name);
  }

  while (current < input.length) {
    const currentChar = input[current];

    if (isWhitespace(currentChar)) {
      start++;
      current++;
      continue;
    }

    if (isAlpha(currentChar)) {
      tokens.push(finishIdentifier());
    } else if (isSingleCharacter(currentChar)) {
      tokens.push(getCharToken(currentChar));
      start++;
      current++;
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
}

export type Token = {
  type: TokenType;
  name?: string;
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
