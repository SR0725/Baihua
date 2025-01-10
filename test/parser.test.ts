/**
 * parser.test.ts
 *
 * 中文註解：測試 Parser 功能。
 */

import { Scanner } from "../src/scanner";
import { Parser } from "../src/parser";
import { Statement } from "../src/ast";

describe("Parser", () => {
  it("能夠解析基本的變數宣告", () => {
    const source = `
      宣告 整數 x 為 10
      宣告 整數 y
    `;
    const ast = parseSource(source);

    // 預期有兩個 VarDecl
    expect(ast.length).toBe(2);
    expect(ast[0].type).toBe("VarDecl");
    expect(ast[1].type).toBe("VarDecl");
  });

  it("能夠解析 if else 語句", () => {
    const source = `
      若 1 == 1:
        輸出 "相等"
      否則:
        輸出 "不相等"
      結束
    `;
    const ast = parseSource(source);

    // 預期 ast[0] 為 IfStatement
    expect(ast[0].type).toBe("IfStatement");
    // 若要更進一步檢查，請自行斷言 condition / thenBranch / elseBranch 結構
  });

  it("能夠解析當(while) 迴圈", () => {
    const source = `
      當 x < 5:
        x += 1
      結束
    `;
    const ast = parseSource(source);

    // 預期 ast[0] 為 WhileStatement
    expect(ast[0].type).toBe("WhileStatement");
  });

  it("能夠解析函式宣告", () => {
    const source = `
      函式 測試函式『甲, 乙』:
        回傳 甲 加 乙
      結束
    `;
    const ast = parseSource(source);

    // 預期 ast[0] 為 FunctionDeclaration
    expect(ast[0].type).toBe("FunctionDeclaration");
    const funcDecl = ast[0] as any;
    expect(funcDecl.funcName).toBe("測試函式");
    expect(funcDecl.params).toEqual(["甲", "乙"]);
  });

  it("能夠解析函式呼叫 (作為 expressionStatement)", () => {
    const source = `
      // 這是註解
      函式 測試函式『甲, 乙』:
        回傳 甲 加 乙
        結束
      測試函式『3, 5』
    `;
    const ast = parseSource(source);

    // 因為我們的 parser 裡，把「單獨的表達式」包成 ExpressionStatement
    expect(ast[0].type).toBe("FunctionDeclaration");
    // 進一步檢查 expression
    const exprStmt = ast[1] as any;
    expect(exprStmt.expr.type).toBe("FunctionCall");
    expect(exprStmt.expr.callee).toBe("測試函式");
    expect(exprStmt.expr.args.length).toBe(2);
  });

  it("能夠解析多種語法綜合 (變數宣告, if, while, 函式, 函式呼叫)", () => {
    const source = `
      宣告 整數 x 為 0

      若 x 等於 0:
        x 設為 10
      否則:
        x 設為 5
      結束

      當 x 小於 20:
        x 加 1
      結束

      函式 相加『甲, 乙』:
        回傳 甲 加 乙
      結束

      x = 相加『x, 10』
    `;
    const ast = parseSource(source);

    // 簡易檢查
    // 1) VarDecl
    expect(ast[0].type).toBe("VarDecl");
    // 2) IfStatement
    expect(ast[1].type).toBe("IfStatement");
    // 3) WhileStatement
    expect(ast[2].type).toBe("WhileStatement");
    // 4) FunctionDeclaration
    expect(ast[3].type).toBe("FunctionDeclaration");
    // 5) expressionStatement (x = 相加(x, 10))
    expect(ast[4].type).toBe("ExpressionStatement");
  });
});

/**
 * 小工具：將 source -> Tokens -> AST, 方便重複使用
 */
function parseSource(source: string): Statement[] {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();
  const parser = new Parser(tokens);
  return parser.parse();
}
