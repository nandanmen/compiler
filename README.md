Given the following code:

```js
function hello(message) {
  console.log(message);
}
```

What would the corresponding tokens be?

- keyword `function`
- identifier `hello`
- left paren `(`
- identifier `message`
- right paren `)`
- left curly `{`
- identifier `console`
- dot `.`
- identifier `log`
- left paren `(`
- identifier `message`
- right paren `)`
- semicolon `;`
- right curly `}`

I tested this against Babel's tokenizer which returns this same output ^
