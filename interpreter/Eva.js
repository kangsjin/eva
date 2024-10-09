const Environment = require("./Environment");

module.exports = class Eva {
  constructor(global = GlobalEnvironment) {
    this.global = global;
  }

  eval(exp, env = this.global) {
    // Self evaluating:

    if (this._isNumber(exp)) {
      return exp;
    }

    if (this._isString(exp)) {
      return exp.slice(1, -1);
    }

    // Math:

    // if (exp[0] === "+") {
    //   return this.eval(exp[1], env) + this.eval(exp[2], env);
    // }

    // if (exp[0] === "*") {
    //   return this.eval(exp[1], env) * this.eval(exp[2], env);
    // }

    // Comparison operators:

    // if (exp[0] === ">") {
    //   return this.eval(exp[1], env) > this.eval(exp[2], env);
    // }

    // if (exp[0] === ">=") {
    //   return this.eval(exp[1], env) >= this.eval(exp[2], env);
    // }

    // if (exp[0] === "<") {
    //   return this.eval(exp[1], env) < this.eval(exp[2], env);
    // }

    // if (exp[0] === "<=") {
    //   return this.eval(exp[1], env) <= this.eval(exp[2], env);
    // }

    // if (exp[0] === "==") {
    //   return this.eval(exp[1], env) === this.eval(exp[2], env);
    // }

    // Block:

    if (exp[0] === "begin") {
      const blockEnv = new Environment({}, env);
      return this._evalBlock(exp, blockEnv);
    }

    // Variable declaration:

    if (exp[0] === "var") {
      const [_, name, value] = exp;
      return env.define(name, this.eval(value, env));
    }

    // Variable assignment:

    if (exp[0] === "set") {
      const [_, name, value] = exp;
      return env.assign(name, this.eval(value, env));
    }

    // Variable lookup:

    if (this._isVariableName(exp)) {
      return env.lookup(exp);
    }

    // if-expressions:

    if (exp[0] === "if") {
      const [_tag, condition, consequent, alternate] = exp;

      if (this.eval(condition, env)) {
        return this.eval(consequent, env);
      }

      return this.eval(alternate, env);
    }

    // while-expression:

    if (exp[0] === "while") {
      const [_tag, condition, body] = exp;

      let result;
      while (this.eval(condition, env)) {
        result = this.eval(body, env);
      }

      return result;
    }

    // Function calls:

    if (Array.isArray(exp)) {
      const fn = this.eval(exp[0], env);
      const args = exp.slice(1).map((arg) => this.eval(arg, env));

      if (typeof fn === "function") {
        return fn(...args);
      }
    }

    throw `Unimplemented: ${JSON.stringify(exp)}`;
  }

  _evalBlock(block, env) {
    let result;
    const [_tag, ...expresions] = block;

    expresions.forEach((exp) => {
      result = this.eval(exp, env);
    });

    return result;
  }

  _isNumber(exp) {
    return typeof exp === "number"; // TODO: Check if the source is actually a number
  }

  _isString(exp) {
    return typeof exp === "string" && exp[0] === '"' && exp.slice(-1) === '"';
  }

  _isVariableName(exp) {
    // return typeof exp === "string" && /^[+\-*/<>=a-zA-Z0-9_]*$/.test(exp);
    if (typeof exp !== "string") return false;
    if (/^[+\-*/<>=a-zA-Z0-9_]*$/.test(exp)) return true;
    if (
      /(\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g.test(
        exp
      )
    )
      return true;
    return false;
  }
};

const GlobalEnvironment = new Environment({
  null: null,
  true: true,
  false: false,
  VERSION: "0.1",
  AUTHOR: "SOOJIN KANG",
  "+"(op1, op2) {
    return op1 + op2;
  },
  "*"(op1, op2) {
    return op1 * op2;
  },
  "-"(op1, op2 = null) {
    if (op2 == null) {
      return -op1;
    }
    return op1 - op2;
  },
  "/"(op1, op2) {
    return op1 / op2;
  },
  ">"(op1, op2) {
    return op1 > op2;
  },
  "<"(op1, op2) {
    return op1 < op2;
  },
  ">="(op1, op2) {
    return op1 >= op2;
  },
  "<="(op1, op2) {
    return op1 <= op2;
  },
  "=="(op1, op2) {
    return op1 === op2;
  },
  print(...args) {
    console.log(...args);
  },
  "😍"(name) {
    console.log("😍 I Love", name);
  },
});
