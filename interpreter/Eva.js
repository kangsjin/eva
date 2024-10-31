const Environment = require("./Environment");
const Transformer = require("./Transformer");

module.exports = class Eva {
  constructor(global = GlobalEnvironment) {
    this.global = global;
    this._transformer = new Transformer();
  }

  eval(exp, env = this.global) {
    // Self evaluating:

    if (this._isNumber(exp)) {
      return exp;
    }

    if (this._isString(exp)) {
      return exp.slice(1, -1);
    }

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
      const [_, ref, value] = exp;

      // Assignment to a property:

      if (ref[0] === "prop") {
        const [_tag, instance, propName] = ref;
        const instanceEnv = this.eval(instance, env);
        return instanceEnv.define(propName, this.eval(value, env));
      }

      // Assignment to a variable:

      return env.assign(ref, this.eval(value, env));
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

    // Function declaration: (def square (x) (* x x))
    // Syntactic sugar for: (var square (lambda (x) (* x x)))

    if (exp[0] === "def") {
      // JIT-transpile to a variable declaration
      const varExp = this._transformer.transformDefToVarLambda(exp);

      return this.eval(varExp, env);
    }

    // Switch-expression: (switch (cond1, block1) ...)
    // Syntactic sugar for nested if-expressions

    if (exp[0] === "switch") {
      const ifExp = this._transformer.transformSwitchToIf(exp);

      return this.eval(ifExp, env);
    }

    // For-loop: (for init condition modifier body)
    // Syntactic sugar for: (begin init (while condition (begin body modifier)))

    if (exp[0] === "for") {
      const forExp = this._transformer.transformForToWhile(exp);

      return this.eval(forExp, env);
    }

    // Increment: (++ foo)
    // Syntactic sugar for: (set foo (+ foo 1))

    if (exp[0] === "++") {
      const setExp = this._transformer.transformIncToSet(exp);

      return this.eval(setExp, env);
    }

    // decrement: (-- foo)
    // Syntactic sugar for: (set foo (- foo 1))

    if (exp[0] === "--") {
      const setExp = this._transformer.transformDecToSet(exp);

      return this.eval(setExp, env);
    }

    // Increment: (+= foo inc)
    // Syntactic sugar for: (set foo (+ foo inc))

    if (exp[0] === "+=") {
      const setExp = this._transformer.transformIncValToSet(exp);

      return this.eval(setExp, env);
    }

    // Decrement: (-= foo dec)
    // Syntactic sugar for: (set foo (- foo dec))

    if (exp[0] === "-=") {
      const setExp = this._transformer.transformDecValToSet(exp);

      return this.eval(setExp, env);
    }

    // Lambda function: (lambda (x) (* x x))
    if (exp[0] === "lambda") {
      const [_tag, params, body] = exp;

      return {
        params,
        body,
        env,
      };
    }

    // Class declaration: (class <Name> <Parent> <Body>)

    if (exp[0] === "class") {
      const [_tag, name, parent, body] = exp;

      const parentEnv = this.eval(parent, env) || env;

      const classEnv = new Environment({}, parentEnv);

      this._evalBody(body, classEnv);

      return env.define(name, classEnv);
    }

    if (exp[0] === "new") {
      const classEnv = this.eval(exp[1], env);

      const instanceEnv = new Environment({}, classEnv);

      const args = exp.slice(2).map((arg) => this.eval(arg, env));

      this._callUserDefinedFunction(classEnv.lookup("constructor"), [
        instanceEnv,
        ...args,
      ]);

      return instanceEnv;
    }

    if (exp[0] === "prop") {
      const [_tag, instance, name] = exp;

      const instanceEnv = this.eval(instance, env);

      return instanceEnv.lookup(name);
    }

    // Function calls:

    if (Array.isArray(exp)) {
      const fn = this.eval(exp[0], env);
      const args = exp.slice(1).map((arg) => this.eval(arg, env));

      // 1. Native JS function:

      if (typeof fn === "function") {
        return fn(...args);
      }

      // 2. User-defined function:

      return this._callUserDefinedFunction(fn, args);
    }

    throw `Unimplemented: ${JSON.stringify(exp)}`;
  }

  _callUserDefinedFunction(fn, args) {
    const activationRecord = {};
    fn.params.forEach((param, index) => {
      activationRecord[param] = args[index];
    });

    // const activationEnv = new Environment(activationRecord, env); // dynamic scope!
    const activationEnv = new Environment(activationRecord, fn.env); // static(lexical) scope !

    return this._evalBody(fn.body, activationEnv);
  }

  _evalBody(exp, env) {
    if (exp[0] === "begin") {
      return this._evalBlock(exp, env);
    }
    return this.eval(exp, env);
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
