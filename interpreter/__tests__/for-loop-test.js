const { test } = require("./test-util");

module.exports = (eva) => {
  test(
    eva,
    `
      (begin
        (var y 0)
        (for 
          (var i 0) 
          (<= i 10) 
          (++ i) 
          (+= y i)
        )

        y
      )
      
    `,
    55
  );
};
