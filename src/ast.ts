/**
 * ast.ts
 *
 * 定義程式語言的抽象語法樹結構
 */

export interface Statement {
  // 根據需求，可擴充不同 statement 類型
  type: string;
}

// 變數宣告語句
export interface VarDecl extends Statement {
  varName: string;
  initializer?: Expression;
  dataType?: string; // "整數", "文字"...等
}

// 指派語句
export interface Assignment extends Statement {
  type: "Assignment";
  varName: string;
  operator: "=" | "+=" | "-=" | "*=" | "/=";
  value: Expression;
}

// If 語句
export interface IfStatement extends Statement {
  condition: Expression;
  thenBranch: Statement[];
  elseBranch?: Statement[];
}

// While 語句
export interface WhileStatement extends Statement {
  condition: Expression;
  body: Statement[];
}

// 函式宣告
export interface FunctionDeclaration extends Statement {
  funcName: string;
  params: string[];
  body: Statement[];
}

// Return 語句
export interface ReturnStatement extends Statement {
  value?: Expression;
}

// 輸出語句
export interface PrintStatement extends Statement {
  expression: Expression;
}

// 函式呼叫 (做為一種表達式或語句)
export interface FunctionCall extends Statement, Expression {
  callee: string; // 函式名稱
  args: Expression[];
}

// 主程式區塊
export interface MainBlock extends Statement {
  body: Statement[];
}

/* =====================
   Expression 節點定義
   ===================== */

export interface Expression {
  type: string;
}

export interface Literal extends Expression {
  value: number | string;
}

export interface Binary extends Expression {
  left: Expression;
  operator: string; // "+", "-", "*", "/", ...
  right: Expression;
}

export interface Variable extends Expression {
  name: string;
}
