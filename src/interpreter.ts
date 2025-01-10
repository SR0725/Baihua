/**
 * interpreter.ts
 *
 * 此處以最簡單方式執行程式：
 * 1. 維護一個「環境」（類似變數表）
 * 2. 遍歷 AST，執行語句
 *
 */

import {
  Statement,
  VarDecl,
  Assignment,
  IfStatement,
  WhileStatement,
  PrintStatement,
  MainBlock,
  FunctionDeclaration,
  ReturnStatement,
  FunctionCall,
  Literal,
  Variable,
  Binary,
  Expression,
} from "./ast";

export class Interpreter {
  // 簡易環境：key 為變數或函式名稱，value 可為數值或函式定義
  private globals: Map<string, any> = new Map();

  public interpret(statements: Statement[]): void {
    // 先找出所有函式宣告，存到環境
    // 其餘的語句執行
    for (const stmt of statements) {
      if (stmt.type === "FunctionDeclaration") {
        const funcDecl = stmt as FunctionDeclaration;
        this.globals.set(funcDecl.funcName, funcDecl);
      }
    }

    for (const stmt of statements) {
      if (stmt.type === "FunctionDeclaration") {
        // 已經處理過了
        continue;
      } else if (stmt.type === "MainBlock") {
        this.executeBlock((stmt as MainBlock).body);
      } else {
        this.execute(stmt);
      }
    }
  }

  private execute(statement: Statement): any {
    switch (statement.type) {
      case "VarDecl":
        return this.executeVarDecl(statement as VarDecl);
      case "IfStatement":
        return this.executeIf(statement as IfStatement);
      case "WhileStatement":
        return this.executeWhile(statement as WhileStatement);
      case "PrintStatement":
        return this.executePrint(statement as PrintStatement);
      case "FunctionCall":
        // 當作單純語句呼叫
        return this.executeFunctionCall(statement as FunctionCall);
      case "ReturnStatement":
        // 可能要配合函式執行
        return this.executeReturn(statement as ReturnStatement);
      case "ExpressionStatement":
        // 只是執行該 expression
        return this.evaluate((statement as any).expr);
      default:
        throw new Error(`尚未實作的語句類型: ${statement.type}`);
    }
  }

  private executeBlock(statements: Statement[]): void {
    for (const stmt of statements) {
      this.execute(stmt);
      // 若是 Return，就可以提早跳出
      if (stmt.type === "ReturnStatement") {
        return;
      }
    }
  }

  private executeVarDecl(stmt: VarDecl) {
    const value = stmt.initializer ? this.evaluate(stmt.initializer) : 0;
    this.globals.set(stmt.varName, value);
  }

  private executeIf(stmt: IfStatement) {
    const conditionValue = this.evaluate(stmt.condition);
    if (this.isTruthy(conditionValue)) {
      this.executeBlock(stmt.thenBranch);
    } else if (stmt.elseBranch) {
      this.executeBlock(stmt.elseBranch);
    }
  }

  private executeWhile(stmt: WhileStatement) {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.executeBlock(stmt.body);
    }
  }

  private executePrint(stmt: PrintStatement) {
    const value = this.evaluate(stmt.expression);
    console.log(value);
  }

  private executeReturn(stmt: ReturnStatement): any {
    // 最簡實作：只回傳值給呼叫端
    if (stmt.value) {
      return this.evaluate(stmt.value);
    }
    return undefined;
  }

  private executeFunctionCall(call: FunctionCall): any {
    const funcDecl = this.globals.get(call.callee) as
      | FunctionDeclaration
      | undefined;
    if (!funcDecl) {
      throw new Error(`函式 ${call.callee} 未宣告`);
    }

    // 簡化版：不處理區域作用域，只用全域
    // 先保存舊的 global(簡單做法)
    const oldEnv = new Map<string, any>(this.globals);

    // 帶入參數
    if (call.args.length !== funcDecl.params.length) {
      throw new Error(`函式 ${funcDecl.funcName} 參數數量不正確`);
    }
    for (let i = 0; i < call.args.length; i++) {
      const argVal = this.evaluate(call.args[i]);
      this.globals.set(funcDecl.params[i], argVal);
    }

    // 執行函式主體
    let returnValue: any;
    for (const stmt of funcDecl.body) {
      if (stmt.type === "ReturnStatement") {
        returnValue = this.executeReturn(stmt as ReturnStatement);
        break;
      } else {
        this.execute(stmt);
      }
    }

    // 恢復舊的全域狀態
    this.globals = oldEnv;
    return returnValue;
  }

  private evaluate(expr: Expression): any {
    switch (expr.type) {
      case "Literal":
        return (expr as Literal).value;
      case "Variable":
        return this.globals.get((expr as Variable).name);
      case "Binary":
        return this.evaluateBinary(expr as Binary);
      case "FunctionCall":
        // 當作表達式呼叫函式並回傳值
        return this.executeFunctionCall(expr as FunctionCall);
      case "Assignment":
        return this.evaluateAssignment(expr as Assignment);
      default:
        throw new Error(`尚未實作的表達式類型: ${expr.type}`);
    }
  }

  private evaluateAssignment(expr: Assignment) {
    const value = this.evaluate(expr.value);

    switch (expr.operator) {
      case "=":
        this.globals.set(expr.varName, value);
        break;
      case "+=":
        this.globals.set(expr.varName, this.globals.get(expr.varName) + value);
        break;
      case "-=":
        this.globals.set(expr.varName, this.globals.get(expr.varName) - value);
        break;
      default:
        throw new Error(`不支援的指派運算子: ${expr.operator}`);
    }
    return value;
  }

  private evaluateBinary(expr: Binary) {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);
    switch (expr.operator) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "==":
        return left === right;
      case "!=":
        return left !== right;
      case ">":
        return left > right;
      case "<":
        return left < right;
      case ">=":
        return left >= right;
      case "<=":
        return left <= right;
      default:
        throw new Error(`不支援的二元運算子: ${expr.operator}`);
    }
  }

  private isTruthy(value: any): boolean {
    // 簡易判斷：非 0 與非空字串視為真
    if (
      value === 0 ||
      value === "" ||
      value === null ||
      value === undefined ||
      value === false
    ) {
      return false;
    }
    return true;
  }
}
