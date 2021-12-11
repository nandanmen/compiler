import { generate } from "../generate";
import { transformedAst } from "./fixtures/ast";

describe("generate", () => {
  it("should successfully generate code from an AST", () => {
    const output = generate(transformedAst);
    expect(output).toEqual(`function print(message) {
  console.log(message);
}`);
  });
});
