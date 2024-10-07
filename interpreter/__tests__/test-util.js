const assert = require("assert");
const parser = require("../../parser/parser");

function test(eva, code, expected) {
  const exp = parser.parse(code);
  assert.strictEqual(eva.eval(exp), expected);
}

module.exports = { test };
