/**
 * interpreter.test.ts
 *
 * 中文註解：測試 Interpreter 功能。
 * 這裡僅示範簡單案例，實務上可攔截 console.log 或使用 mock 來驗證輸出。
 */

import { Scanner } from "../src/scanner";
import { Parser } from "../src/parser";
import { Interpreter } from "../src/interpreter";

describe("Interpreter", () => {
  it("能夠執行最簡單的變數宣告與輸出", () => {
    const source = `
    主程式:
      宣告 整數 x 為 10
      輸出 x
    結束
    `;
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // 攔截 console.log
    const logs: any[] = [];
    const originalLog = console.log;
    console.log = (msg: any) => logs.push(msg);

    const interpreter = new Interpreter();
    interpreter.interpret(ast);

    console.log = originalLog;
    // 期望輸出為 10
    expect(logs).toContain(10);
  });
});
