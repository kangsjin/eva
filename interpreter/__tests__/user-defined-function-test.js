const { test } = require("./test-util");

module.exports = (eva) => {
  test(
    eva,
    `
        (begin

            (def square (x)
                (* x x))

            (square 2)

        )
    `,
    4
  );

  test(
    eva,
    `
        (begin

            (def calc (x y)
                (begin
                    (var z 30)
                    (+ (* x y) z)
                ))    

            (calc 10 20)

        )
    `,
    230
  );

  // Closure:

  test(
    eva,
    `
    (begin
        (def greeter (word)
            (def inner (name)
                (+ word name)
            )
        )

        (var say-hi (greeter "Hello"))
        (say-hi "Soojin")
    )
    `,
    "HelloSoojin"
  );
};
