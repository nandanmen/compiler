import { tokenize } from "./tokenizer";
import { parse } from "./parser";
import type { FunctionDeclaration } from "./parser";
import { traverse } from "./traverse";
import { generate } from "./generate";

const input = `function hello(message) {
  console.log(message);
}`;

console.log("Input:");
console.log(input);

const tokens = tokenize(input);
console.log("Tokens:");
console.log(tokens);

const ast = parse(tokens);
console.log("Initial AST:");
console.dir(ast, { depth: null });

traverse(ast, {
  FunctionDeclaration: (node: FunctionDeclaration) => {
    if (node.id.name === "hello") {
      node.id.name = "print";
    }
  },
});

console.log("Transformed AST:");
console.dir(ast, { depth: null });

const output = generate(ast);

console.log("Output:");
console.log(output);
