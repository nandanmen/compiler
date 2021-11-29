export function tokenize(input: string): string[] {
  let start = 0;
  let current = 0;
  const tokens = [];

  function finishIdentifier() {
    while (isAlpha(input[current + 1])) {
      current++;
    }
    current++;
    const token = input.substring(start, current);
    console.log(token);
    start = current;
    return token;
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
      tokens.push(currentChar);
      start++;
      current++;
    } else {
      throw new Error(`Unknown character: ${currentChar}`);
    }
  }

  return tokens;
}

function isAlpha(char: string) {
  return !isWhitespace(char) && /[a-zA-Z]/.test(char);
}

function isWhitespace(char: string) {
  return /\s/.test(char);
}

const knownSingleCharacters = new Set(["(", ")", "{", "}", ".", ";"]);

function isSingleCharacter(char: string) {
  return knownSingleCharacters.has(char);
}
