const { test } = require("./test-util");

module.exports = (eva) => {
  test(
    eva,
    `
        (begin
            (var x 10)

            (-- x)
        )
    `,
    9
  );

  test(
    eva,
    `
        (begin
            (var x 10)

            (-= x 5)
        )
    `,
    5
  );
};
