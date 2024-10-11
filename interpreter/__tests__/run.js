const Eva = require("../Eva");
const Environment = require("../Environment");

const test = [
  "self-eval-test",
  "math-test",
  "variables-test",
  "block-test",
  "if-test",
  "while-test",
  "built-in-function-test",
  "user-defined-function-test",
];

const eva = new Eva();

test.forEach((name) => {
  try {
    const test = require(`./${name}`);
    test(eva);
    console.log("✅", name);
  } catch (error) {
    console.error("❌", name, error?.message ?? error);
    process.exit(1);
  }
});

console.log("✅ All assertions passed!");
eva.eval(["😍", '"수진"']);
