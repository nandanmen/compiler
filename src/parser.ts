import type { Token } from "./tokenizer";

export function parse(tokens: Token[]) {
  return parseProgram(tokens);
}

function parseProgram(tokens: Token[]) {}
