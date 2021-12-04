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

Let's jump into that `expression()` function call.


