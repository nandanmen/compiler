# Tokenizer

1. If it starts with a letter, it's an identifier
2. There's also the simple one character tokens: `(`, `)`, `{`, `}`, `.` and `;`
3. If it's whitespace, skip

- I started by cloning Babel's source and adding `console.log`s at places where I think tokens were being generated
- Eventually I found the main token generation code and was able to print out all the tokens of my input, which was:

```js
function hello(message) {
  console.log(message);
}
```

- My goal was to be able to turn the above code into the following code:

```js
function print(message) {
  console.log(message);
}
```

- This meant that the scope of my tokens were literally just the tokens that was in the above code snippet
  - Yep, even things like numbers and string literals aren't supported in my compiler
  - This wouldn't work to be a real compiler of course, but the whole project introduced me to core compiler concepts and the skills to build an actual compiler

So let's explore the most convoluted way of changing a function's name from 'hello' to 'print', shall we?

Babel is essentially a pipeline with four phases:

1. Tokenization,
2. Parsing,
3. Transformation,
4. Generation

At a high level, each phase:

1. **Tokenization** -> Converts the input string into a list of "words" called tokens
2. **Parsing** -> Converts the list of tokens into a tree where each token is grouped by its semantic meaning
3. **Transformation** -> Transforms one AST to another by passing the tree through various plugins
   1. Question -> How does Babel support running multiple plugins? Wouldn't each plugin assume the given AST is the source AST and not the output of another plugin? (Maybe a good idea to message Nicolo about this)
4. **Generation** -> Transforms an AST back into valid code

## Tokenization

The first phase of the compiler converts a code string into a list of "words" or tokens. A token is the smallest group of characters in the code string that has meaning. For example, in the following JS code:

```js
const hello = 'world'
```

The tokens are:

- const (keyword)
- hello (identifier)
- = (equals)
- 'world' (string literal)

The word 'const' has a meaning, which is to declare a new constant variable, but the two letters 'rl' in 'world' doesn't.

Actual code will likely has characters that we wouldn't recognize, because while we see nicely formatted code in our editors:

```js
function hello(message) {
  console.log(message)
}
```

All the computer sees is a long string with new lines and whitespace characters:

```
function hello(message) {\n  console.log(message)\n}
```

I like to think of the tokenizer as a printing machine where the input is this long string and the output are the tokens that we need.

So where would we begin?

First, let's figure out what tokens are in the code snippet above.

```js
function hello(message) {
  console.log(message);
}
```

From what I can tell, the tokens should be:

- function (keyword)
- hello (identifier)
- ( (left paren)
- message (identifier)
- ) (right paren)
- { (left curly)
- console (identifier)
- . (dot)
- log (identifier)
- ( (left paren)
- message (identifier)
- ) (right paren)
- ; (semicolon)
- } (right curly)

I went ahead and cloned `@babel/parser` to figure out if my tokens were correct. It took a bit of time to figure out where the tokenizer was, but when I found it, I just added a few `console.log` statements to find the printed tokens. It ended up being correct, so let's move on the implementation.

The simplest tokens are the ones that are only one character wide, so I collected them all and added them into a set:

```js
const singleCharacterTokens = new Set(["(", ")", "{", "}", ".", ";"])
```

Let's also add the boilerplate for looping over the input string:

```ts
function tokenize(input: string) {
  let current = 0;

  const tokens = [];

  while (current < input.length) {
    const currentChar = input[current];

    // If the current character is in the single character set,
    // add it to the list of tokens
    if (singleCharacterTokens.has(currentChar)) {
      tokens.push(currentChar);
    }
    current++;
  }

  return tokens;
}
```

But what about the multi character tokens? In our input code, there's two types: identifier tokens and keyword tokens. Keyword tokens are just identifier tokens that are reserved because they have a specific use in the language, like `function`, `let`, and `while`.

So let's add another set for known keywords:

```ts
const keywords = new Set(["function"])
```

We only have `function` as a keyword here because remember our goal is to convert _only_ this input string. Everything else isn't guaranteed to work yet.

Next is to parse identifiers. Identifier tokens always start with an alphabetic character, so let's start with that:

```ts
function tokenize(input: string) {
  let current = 0;

  const tokens = [];

  while (current < input.length) {
    const currentChar = input[current];

    // If the current character is in the single character set,
    // add it to the list of tokens
    if (singleCharacterTokens.has(currentChar)) {
      tokens.push(currentChar);
    }

    if (/[a-zA-Z]/.test(currentChar)) {
      // identifier
    }

    current++;
  }

  return tokens;
}
```

We'll need to add another cursor because we need to know where the identifier starts and ends to extract it to a token. So we'll add another cursor called `start`:

```ts
function tokenize(input: string) {
  let start = 0;
  let current = 0;

  const tokens = [];

  while (current < input.length) {
    const currentChar = input[current];

    // If the current character is in the single character set,
    // add it to the list of tokens
    if (singleCharacterTokens.has(currentChar)) {
      tokens.push(currentChar);
    }

    if (/[a-zA-Z]/.test(currentChar)) {
      // identifier
    }

    current++;
  }

  return tokens;
}
```

Inside the identifier block, we're going to keep iterating until we don't find any alphanumeric characters anymore:

```ts
const isAlpha = char => /[a-zA-Z]/.test(char)

if (isAlpha(currentChar)) {
  while (isAlpha(input[current])) {
    current++;
  }
  const identifier = input.substring(start, current);
}
```

Once we're done, we want to reset `start` back to the value of `current` because we're done parsing this token:

```ts
const isAlpha = char => /[a-zA-Z]/.test(char)

if (isAlpha(currentChar)) {
  while (isAlpha(input[current])) {
    current++;
  }
  const identifier = input.substring(start, current);
  start = current;
}
```

At this point, it's possible that our identifier is actually a reserved word (i.e. a keyword), so let's check if our set of keywords contains the identifier's name:

```ts
const isAlpha = char => /[a-zA-Z]/.test(char)

if (isAlpha(currentChar)) {
  while (isAlpha(input[current])) {
    current++;
  }
  const identifier = input.substring(start, current);
  start = current;

  if (keywords.has(identifier)) {
    // is a keyword
  }

  // is an identifier
}
```

So far we've only returned the tokens as its literal string, but it probably makes more sense to wrap them in an object that has a type so the other code in the pipeline has more context (it also lets us differentiate between keywords and non-keywords).

Here's the complete list of changes for adding this feature:

```ts
// List of supported token types
export enum TokenType {
  Keyword = "Keyword",
  Identifier = "Identifier",
  LeftParen = "LeftParen",
  RightParen = "RightParen",
  LeftCurly = "LeftCurly",
  RightCurly = "RightCurly",
  Dot = "Dot",
  Semicolon = "Semicolon",
}

// The token object itself
export type Token = {
  type: TokenType;
  name?: string;
};

// Builder functions for each token
export const token = {
  keyword(name: string) {
    return {
      type: TokenType.Keyword,
      name,
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

// Supported single character tokens
type SingleCharacterToken = "(" | ")" | "{" | "}" | "." | ";";

// A map of single character token -> builder pairs (makes it easier
// to construct them later on)
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

// Constructs the single character token object given the literal string value
function getCharToken(char: SingleCharacterToken) {
  const builder = knownSingleCharacters.get(char);
  return builder!();
}
```

Let's go back to the identifiers. If our identifier turns out to be a keyword, we'll build a keyword token. Otherwise, we'll build an identifier:

```ts
const isAlpha = char => /[a-zA-Z]/.test(char)

if (isAlpha(currentChar)) {
  while (isAlpha(input[current])) {
    current++;
  }
  const identifier = input.substring(start, current);
  start = current;

  if (keywords.has(identifier)) {
    tokens.push(token.keyword(identifier))
  }

  tokens.push(token.identifier(identifier))
}
```

> An alternative that I considered doing is making each unique keyword its own token type, so instead of having an umbrella "keyword" type there would be one for each keyword e.g. "function", "for", "while", etc. When I initially wrote this I decided to just go with whatever implementation is faster, but I think in hindsight I should've categorized them into individual token types. It would've made the parsing phase quite a bit easier.

And with that we're _almost_ done - we just need to handle two edge cases. The first, we need to skip over the character if it's whitespace:

```ts
function tokenize(input: string): Token[] {
  let start = 0;
  let current = 0;
  const tokens = [];

  function finishIdentifier() {
    while (isAlpha(input[current])) {
      current++;
    }
    const name = input.substring(start, current);
    start = current;

    if (keywords.has(name)) {
      return token.keyword(name);
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
    }
  }

  return tokens;
}
```

And throw an error if we find a character in the input code that we don't recognize:

```ts
function tokenize(input: string): Token[] {
  let start = 0;
  let current = 0;
  const tokens = [];

  function finishIdentifier() {
    while (isAlpha(input[current])) {
      current++;
    }
    const name = input.substring(start, current);
    start = current;

    if (keywords.has(name)) {
      return token.keyword(name);
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
```

With that, we have our tokenizer!

## Parser

The parser is easily the most complicated part of the whole compiler. Its purpose is to take the list of tokens and turn them into an abstract syntax tree, where the tokens are grouped together into "nodes" that share a semantic meaning.

For example, the following code:

```ts
console.log(message);
```

Corresponds to the following syntax tree:

```ts
{
  type: "ExpressionStatement",
  expression: {
    type: "CallExpression",
    callee: {
      type: "MemberExpression",
      object: {
        type: "Identifier",
        name: "console"
      },
      property: {
        type: "Identifier",
        name: "log"
      },
      computed: false
    },
    arguments: [
      {
        type: "Identifier",
        name: "message"
      }
    ]
  }
}
```

A syntax tree provides _context_ to the tokens. For example, the `console` word was merely an identifier token in the first phase. Here, we find much more information on how it's used. The console is not just an identifier; it's the object in a `MemberExpression`, which is itself part of a `CallExpression`.

Representing the code this way lets us transform it in ways that are context-specific and are difficult to do using something like regex e.g. changing only the second argument of a function call.

This ease of use for the end user means that the complexity lives somewhere else: in the parser.

My first go at writing a parser involved a lot of just hacking around - I tried to construct the syntax tree based on what I know about the JavaScript language. Needless to say, I wasn't able to get very far. I was particularly stuck in trying to parse this seemingly simple expression:

```js
console.log(message);
```

Of course the parser doesn't see the code string directly. Instead, it receives the list of tokens that was generated by the tokenizer. This meant that the input was more like this:

```
[console] [.] [log] [(] [message] [)] [;]
```

Nevertheless, this simple expression got me stuck because of the recursive nature of the syntax. You see, the whole line is an `ExpressionStatement` because it ends with a semicolon - this part was easy enough.

So I started my parser with something like this:

```ts
function expressionStatement() {
  // Parse the expression out of the tokens
  const expr = expression();

  /**
   * Consume is a helper function that checks if the current token is of
   * the given token type. If it is, it increments the current cursor. If
   * it isn't, it'll throw a syntax error.
   *
   * Here, we check that the current token is a semicolon.
   */
  consume(TokenType.Semicolon);
}
```

Let's jump into that `expression()` function call. What token do we expect when trying to parse an expression?

I... wasn't sure, so I thought I would keep it simple and only support those expressions that exist in the input, which are *call* expressions and *member* expressions. So how do we differentiate between the two?

Here's a call expression:

```js
hello()
```

Here's a member expression:

```js
hello.world
```

Here's a member expression *inside a call expression*:

```js
hello.world()
```

And here's a call expression *inside a member expression*:

```js
hello().world
```

What differences do you notice? Well, a call expression always ends with a parentheses pair, while a member expression always ends with a dot and an identifier token (technically there's also *computed* member expressions, but we won't get to that here).

While we can probably identify the two pretty easily with our eyes, a parser has a much harder time doing so. That's because the tokens that make these expressions a call expression or member expression can happen anywhere down the line:

```
[some] [super] [long] [expression] ... [.] [call] // aha! a member expression... but where were we?
```

While parsing the start of this sequence, there's no way for the parser to know that it's part of a member expression until it hits the dot token.

At this point I got pretty lost so I decided to scrap the parser altogether and start from scratch. This time I wanted to start with a more formal definition of the language.

Something I learned in my last year of my computer science degree was the EBNF notation - a fancy notation for describing programming languages. I'm going to be honest - I have no idea what the correct syntax is. But it was nevertheless a useful way of describing what is and isn't correct language syntax.

I went ahead and tried to make a small grammar for JavaScript, just enough to encompass my hello world input. Here's what I made:

```
// A program is a series of statements
Program -> Statement*

// A statement can either be an expression statement, function declaration,
// or a block statement (I got block statement from the AST)
Statement -> ExpressionStatement | FunctionDeclaration | BlockStatement

// An expression statement is an expression followed by a semicolon
// (I enforced the semicolon here because it's more complicated otherwise)
ExpressionStatement -> Expression ";"

FunctionDeclaration -> "function" Identifier "(" Identifier* ")" BlockStatement

BlockStatement -> "{" Statement* "}"

Identifier -> STRING

Expression -> CallExpression | MemberExpression | Identifier;

// e.g. hello(message)
CallExpression -> Expression "(" Identifier* ")"

// e.g. hello.world
MemberExpression -> Expression "." Identifier
```

Let's focus on the last three definitions there - `Expression`, `CallExpression`, and `MemberExpression`.

How would we decompose the following code using the above grammar?

```js
console.log(message)
```

First and foremost it's a `CallExpression`, because it ends with the parenthesis pair:

```
console.log(message) -> CallExpression
console.log -> Expression
(message) -> Makes it a call expression
```

We can break down the `console.log` further:

```
console.log -> MemberExpression
console -> Expression -> Identifier
log -> Identifier
```

Easy enough, right? So how would we translate this into code?

The nice thing about having the formal grammar is it lends itself really well into a recursive parser implementation. Take the following snippet for example:

```
Statement -> ExpressionStatement | FunctionDeclaration | BlockStatement

ExpressionStatement -> Expression ";"

FunctionDeclaration -> "function" Identifier "(" Identifier* ")" BlockStatement

BlockStatement -> "{" Statement* "}"
```

We start with a function to parse a statement:

```ts
function statement() {
  // TODO
}
```

Looking at the grammar, we know that a statement can either be an expression statement, a function declaration, or a block statement. Which _tokens_ lets us determine which of these three options we should parse?

Well, if the token is a keyword with the type `function`, then we know we should parse a function declaration. Likewise, if the token is a left curly bracket, then we should parse a block statement. If it's neither of them, then we should try parsing an expression statement:

```ts
function statement() {
  if (check(TokenType.Keyword)) {
    if (peek().name === "function") {
      return declaration();
    }
  } else if (check(TokenType.LeftCurly)) {
    return blockStatement();
  }
  return expressionStatement();
}
```

Notice how nicely this matches with our grammar?

Let's dive a bit deeper into the `expressionStatement()` call. Here's the grammar for an expression statement:

```
ExpressionStatement -> Expression ";"
```

In code, this would look like:

```ts
function expressionStatement() {
  const expression = expression();
  consume(TokenType.Semicolon);

  return {
    type: "ExpressionStatement",
    expression,
  }
}
```

Nice! Going another level, let's take a look at the `expression()` call. Here's the grammar for an Expression:

```
Expression -> CallExpression | MemberExpression | Identifier;

// e.g. hello(message)
CallExpression -> Expression "(" Identifier* ")"

// e.g. hello.world
MemberExpression -> Expression "." Identifier
```

When I tried translating this to code, I was getting confused. Unlike the statement definition that we had before, there's no token that lets us immediately identify a CallExpression from a MemberExpression.

In the grammar, both of these nodes start with an expression. So I figured to check if the *next* token is either a dot or a left paren. If it's a dot, then I would parse a member expression; if it's a left paren, I would parse a call expression.

```ts
function expression() {
  if (checkNext(TokenType.LeftParen)) {
    return callExpression();
  }
  if (checkNext(TokenType.Dot)) {
    return memberExpression();
  }
  return identifier();
}
```

Then my `callExpression` and `memberExpression` functions would look something like this:

```ts
function callExpression() {
  const callee = expression();
  // other stuff
}

function memberExpression() {
  const object = expression();
  // other stuff
}
```

Indeed this doesn't work because there's an infinite loop between `expression` and `callExpression` - expression calls callExpression, and callExpression calls expression back without doing anything to the tokens.

At this point, I turned to the Crafting Interpreters book to see if it describes a solution for this. Lucky for me, it does!

The main problem lied in the grammar definition, specifically the definition of `CallExpression` and `MemberExpression`:

```
Expression -> CallExpression | MemberExpression | Identifier;

// e.g. hello(message)
CallExpression -> Expression "(" Identifier* ")"

// e.g. hello.world
MemberExpression -> Expression "." Identifier
```

You see, both of these definitions are *left-recursive*, meaning if you repeatedly unwrap `Expression` it would grow leftward:

```
CallExpression -> ... CallExpression CallExpression "(" Identifier* ")"
                      <-- grows to the left
```

In terms of the grammar on its own this is perfectly ok - after all, the following code is a completely valid `CallExpression`:

```js
hello()()()()()
```

But in terms of the parser, defining the grammar this way makes things difficult because the parser consumes tokens from left to right.

The fix was to flip the grammar definition around. Instead of defining a `CallExpression` as an `Expression` plus some parentheses, we define it as an *identifier* plus an *arbitrary number* of parentheses:

```
CallExpression -> Identifier ("(" Identifier* ")")*
```

In the code, we can now do something like:

```ts
function callExpression() {
  let expr = identifier()

  /**
   * If we find a left paren, we want to wrap the current expression
   * into a call expression. This lets us nest call expressions like
   * if we have `hello()()()`.
   */ 
  while (match(TokenType.LeftParen)) {
    expr = finishCallExpression(expr)
  }

  return expr
}

function finishCallExpression(callee: Expression) {
  const args: Expression[] = [];

  /**
   * consumeUntil is a helper function that repeatedly advances
   * the cursor until it hits a token of the given type.
   */ 
  consumeUntil(TokenType.RightParen, () => {
    args.push(expression());
  });

  return {
    type: NodeType.CallExpression,
    arguments: args,
    callee,
  };
}
```

Good stuff! This lets us successfully parse a nested call expression like this one:

```js
hello()()()
```

Except it _doesn't_ let us parse a call expression where the callee is another expression like:

```js
console.log(message)
```
