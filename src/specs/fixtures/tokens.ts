import { token } from "../../tokenizer";

export const tokens = [
  token.function(),
  token.identifier("hello"),
  token.leftParen(),
  token.identifier("message"),
  token.rightParen(),
  token.leftCurly(),
  token.identifier("console"),
  token.dot(),
  token.identifier("log"),
  token.leftParen(),
  token.identifier("message"),
  token.rightParen(),
  token.semicolon(),
  token.rightCurly(),
];
