/**
 * parser.ts
 *
 * 使用遞迴下降或其他方法，將 Token 串解析為 AST。
 */

import { Token, TokenType } from "./token";
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

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): Statement[] {
    const statements: Statement[] = [];

    while (!this.isAtEnd()) {
      statements.push(this.declaration());
    }

    return statements;
  }

  private declaration(): Statement {
    // 根據語法：可能是「函式聲明」或「主程式」或「變數宣告」或其他語句
    if (this.match(TokenType.函式)) {
      return this.functionDeclaration();
    }

    if (this.check(TokenType.主程式)) {
      return this.mainBlock();
    }

    // 如果都不是，則當作一般 statement
    return this.statement();
  }

  private functionDeclaration(): FunctionDeclaration {
    // 假設語法格式： 函式 <識別符>(參數...) : \n <區塊> 結束
    const funcName = this.consume(TokenType.識別符, "函式需要名稱").lexeme;

    // 取得參數列表
    this.consume(TokenType.左括號, "函式需要 『 或 (");
    const params: string[] = [];
    if (!this.check(TokenType.右括號)) {
      do {
        const paramToken = this.consume(TokenType.識別符, "參數需要識別符");
        params.push(paramToken.lexeme);
      } while (this.match(TokenType.逗號)); // 只要還看到逗號，就繼續解析參數
    }
    this.consume(TokenType.右括號, "函式缺少 』 或 )");
    this.consume(TokenType.冒號, "函式缺少 冒號 :");

    // 函式本體：直到遇到 結束
    const body: Statement[] = [];
    while (!this.check(TokenType.結束) && !this.isAtEnd()) {
      body.push(this.statement());
    }
    this.consume(TokenType.結束, "函式缺少 結束");

    return {
      type: "FunctionDeclaration",
      funcName,
      params,
      body,
    };
  }

  private mainBlock(): MainBlock {
    // 格式： 主程式 : <區塊> 結束
    this.advance(); // consume 主程式
    this.consume(TokenType.冒號, "主程式需要冒號 :");
    const body: Statement[] = [];
    while (!this.check(TokenType.結束) && !this.isAtEnd()) {
      body.push(this.statement());
    }
    this.consume(TokenType.結束, "主程式需要 結束");
    return {
      type: "MainBlock",
      body,
    };
  }

  private statement(): Statement {
    if (this.match(TokenType.宣告)) return this.varDeclaration();
    if (this.match(TokenType.若)) return this.ifStatement();
    if (this.match(TokenType.當)) return this.whileStatement();
    if (this.match(TokenType.輸出)) return this.printStatement();
    if (this.match(TokenType.回傳)) return this.returnStatement();

    // 指派或函式呼叫 or 一般表達式
    return this.expressionStatement();
  }

  private varDeclaration(): VarDecl {
    // 語法：宣告 整數 x 為 10
    const dataTypeToken = this.consume(
      TokenType.整數,
      "目前只示範 '整數' 宣告，可自行擴充"
    );
    const varNameToken = this.consume(TokenType.識別符, "變數需要名稱");

    let initializer: Expression | undefined = undefined;
    if (this.match(TokenType.為)) {
      initializer = this.expression();
    }

    return {
      type: "VarDecl",
      varName: varNameToken.lexeme,
      initializer,
      dataType: dataTypeToken.lexeme,
    };
  }

  private ifStatement(): IfStatement {
    // 若 <條件> : <區塊> 否則: <區塊> 結束
    const condition = this.expression();
    this.consume(TokenType.冒號, "if後面缺少冒號");
    const thenBranch: Statement[] = [];
    while (
      !this.check(TokenType.否則) &&
      !this.check(TokenType.結束) &&
      !this.isAtEnd()
    ) {
      thenBranch.push(this.statement());
    }

    let elseBranch: Statement[] | undefined = undefined;
    if (this.match(TokenType.否則)) {
      this.consume(TokenType.冒號, "否則後面缺少冒號");
      elseBranch = [];
      while (!this.check(TokenType.結束) && !this.isAtEnd()) {
        elseBranch.push(this.statement());
      }
    }

    this.consume(TokenType.結束, "if/else 區塊需要結束");

    return {
      type: "IfStatement",
      condition,
      thenBranch,
      elseBranch,
    };
  }

  private whileStatement(): WhileStatement {
    // 當 <條件> : <區塊> 結束
    const condition = this.expression();
    this.consume(TokenType.冒號, "while後面缺少冒號");
    const body: Statement[] = [];
    while (!this.check(TokenType.結束) && !this.isAtEnd()) {
      body.push(this.statement());
    }
    this.consume(TokenType.結束, "while 區塊需要結束");

    return {
      type: "WhileStatement",
      condition,
      body,
    };
  }

  private printStatement(): PrintStatement {
    // 輸出 <expression>
    const expression = this.expression();
    return {
      type: "PrintStatement",
      expression,
    };
  }

  private returnStatement(): ReturnStatement {
    // 回傳 <expression>?
    let value: Expression | undefined = undefined;
    if (!this.check(TokenType.結束) && !this.isAtEnd()) {
      value = this.expression();
    }
    return {
      type: "ReturnStatement",
      value,
    };
  }

  private expressionStatement(): Statement {
    // 解析一個 expression
    const expr = this.expression();

    // 其他表達式的處理
    return {
      type: "ExpressionStatement",
      expr,
    } as Statement;
  }

  private expression(): Expression {
    // 先示範簡單二元運算
    return this.assignment();
  }

  /**
   * assignment() 嘗試解析指派運算子 (=, +=, -=, ...)
   * 若無法匹配，則回傳 equality() 結果
   */
  private assignment(): Expression {
    // 先解析左邊，可能是一個比較運算或更基礎的 expression
    const expr = this.equality();

    // 如果下一個 token 是 等號 (或 +=, -=)
    if (this.match(TokenType.等號, TokenType.加等於, TokenType.減等於)) {
      const equalsToken = this.previous(); // 取出剛匹配到的 '=' token
      const right = this.assignment(); // 右側可以是任何 expression

      // 檢查左邊是否是一個 variable
      if (expr.type === "Variable") {
        // 建立 AssignmentExpression 或 Assignment AST
        return {
          type: "Assignment",
          varName: (expr as any).name,
          operator: equalsToken.lexeme,
          value: right,
        } as Assignment;
      } else {
        // 如果左邊不是個變數，顯示語法錯誤
        throw this.error(equalsToken, "左邊不是可指派的變數");
      }
    }

    // 如果沒有匹配到 =，就單純回傳
    return expr;
  }

  private equality(): Expression {
    let expr = this.comparison();

    while (this.match(TokenType.等於, TokenType.不等於)) {
      const operator = this.previous().lexeme;
      const right = this.comparison();
      expr = {
        type: "Binary",
        left: expr,
        operator,
        right,
      } as Binary;
    }

    return expr;
  }

  private comparison(): Expression {
    let expr = this.term();

    while (
      this.match(
        TokenType.大於,
        TokenType.大於等於,
        TokenType.小於,
        TokenType.小於等於
      )
    ) {
      const operator = this.previous().lexeme;
      const right = this.term();
      expr = {
        type: "Binary",
        left: expr,
        operator,
        right,
      } as Binary;
    }

    return expr;
  }

  private term(): Expression {
    let expr = this.factor();

    while (this.match(TokenType.加, TokenType.減)) {
      const operator = this.previous().lexeme;
      const right = this.factor();
      expr = {
        type: "Binary",
        left: expr,
        operator,
        right,
      } as Binary;
    }

    return expr;
  }

  private factor(): Expression {
    let expr = this.unary();

    while (this.match(TokenType.乘, TokenType.除)) {
      const operator = this.previous().lexeme;
      const right = this.unary();
      expr = {
        type: "Binary",
        left: expr,
        operator,
        right,
      } as Binary;
    }

    return expr;
  }

  private unary(): Expression {
    // 此範例略過單元運算處理，直接跳到 primary
    return this.primary();
  }

  private primary(): Expression {
    if (this.match(TokenType.整數常量)) {
      const value = Number(this.previous().lexeme);
      return { type: "Literal", value } as Literal;
    }
    if (this.match(TokenType.字串常量)) {
      const value = this.previous().lexeme;
      return { type: "Literal", value } as Literal;
    }
    if (this.match(TokenType.識別符)) {
      const name = this.previous().lexeme;

      // 如果下一個 token 是 左括號 -> 代表 function call
      if (this.match(TokenType.左括號)) {
        // parse arguments
        const args: Expression[] = [];
        if (!this.check(TokenType.右括號)) {
          do {
            args.push(this.expression());
          } while (this.match(TokenType.逗號));
        }
        this.consume(TokenType.右括號, "函式呼叫缺少 )");

        return {
          type: "FunctionCall",
          callee: name,
          args,
        } as FunctionCall;
      } else {
        // 否則就是單純變數
        return {
          type: "Variable",
          name,
        } as Variable;
      }
    }

    throw this.error(this.peek(), "無效的 primary expression");
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }

  private error(token: Token, message: string): Error {
    // 簡易錯誤處理
    return new Error(
      `[第${token.line}行 詞位 ${token.lexeme}] 錯誤: ${message} `
    );
  }
}
