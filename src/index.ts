import { strict as assert } from "assert";

import { tokenize } from "./tokenizer";

const input = `function hello(message) {
  console.log(message);
}`;

const out = tokenize(input);
console.log(out);

assert.deepEqual(out, [
  "function",
  "hello",
  "(",
  "message",
  ")",
  "{",
  "console",
  ".",
  "log",
  "(",
  "message",
  ")",
  ";",
  "}",
]);
