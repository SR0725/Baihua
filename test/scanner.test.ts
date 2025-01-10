/**
 * scanner.test.ts
 *
 * 中文註解：測試 Scanner 功能。
 */

import { Scanner } from "../src/scanner";
import { Token, TokenType } from "../src/token";

describe("Scanner", () => {
  it("能夠掃描最簡單的變數宣告", () => {
    const source = "宣告 整數 x 為 10";
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    // 簡易斷言
    expect(tokens[0].type).toBe(TokenType.宣告);
    expect(tokens[1].type).toBe(TokenType.整數);
    expect(tokens[2].type).toBe(TokenType.識別符); // x
    expect(tokens[3].type).toBe(TokenType.為);
    expect(tokens[4].type).toBe(TokenType.整數常量); // 10
    expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);
  });

  it("能夠掃描基本的 if else 語句", () => {
    const source = `
      若 x == 10:
        輸出 "等於10"
      否則:
        輸出 "不等於10"
      結束
    `;
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    // 確認關鍵 token 是否存在
    const lexemes = tokens.map((t) => t.lexeme);
    expect(lexemes).toContain("若");
    expect(lexemes).toContain("==");
    expect(lexemes).toContain("否則");
    expect(lexemes).toContain("結束");
  });

  it("能夠掃描簡單的當(while) 迴圈", () => {
    const source = `
      當 x < 5:
        x += 1
      結束
    `;
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    const lexemes = tokens.map((t) => t.lexeme);
    expect(lexemes).toContain("當");
    expect(lexemes).toContain("<");
    expect(lexemes).toContain("+=");
    expect(lexemes).toContain("結束");
  });

  it("能夠掃描函式宣告與呼叫", () => {
    const source = `
      函式 相增『甲, 乙』:
        回傳 甲 加 乙
      結束

      x = 相增『3, 5』
    `;
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    const lexemes = tokens.map((t) => t.lexeme);
    // 確認函式相關
    expect(lexemes).toContain("函式");
    expect(lexemes).toContain("回傳");
    expect(lexemes).toContain("相增");
    // 確認函式呼叫
    expect(lexemes).toContain("('");
    expect(lexemes).toContain("')");
    expect(lexemes).toContain("3");
    expect(lexemes).toContain("5");
  });

  it("能夠掃描複合程式 (包含宣告、if、while、函式等)", () => {
    const source = `
      宣告 整數 x 為 0
      函式 測試函式(a):
        若 a == 0:
          回傳 1
        否則:
          回傳 a
        結束
      結束

      當 x < 10:
        x += 測試函式(x)
      結束
    `;
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    // 只要不拋出錯誤，並有適當關鍵字出現，就算通過初步測試
    const lexemes = tokens.map((t) => t.lexeme);
    expect(lexemes).toContain("宣告");
    expect(lexemes).toContain("函式");
    expect(lexemes).toContain("若");
    expect(lexemes).toContain("否則");
    expect(lexemes).toContain("當");
  });

  it("能夠無視註解", () => {
    const source = `
      // 這是註解
    `;
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();
    console.log(tokens);
    expect(tokens.length).toBe(1); // 只有 EOF
  });
});
