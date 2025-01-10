/**
 * integration.test.ts
 *
 * 中文註解：整合測試，模擬一個多功能程式碼案例
 */

import { runChineseCode } from "../src/index";

describe("IntegrationTest", () => {
  it("宣告變數，輸出變數", () => {
    const source = `
    宣告 整數 x 為 21
    輸出 x
    `;

    const logs: any[] = [];
    const originalLog = console.log;
    console.log = (msg: any) => logs.push(msg);

    runChineseCode(source);

    console.log = originalLog;
    console.log(logs);

    // 不等於10
    expect(logs).toContain(21);
  });

  it("能夠執行基本的 if else 語句", () => {
    const source = `
    宣告 整數 x 為 0
    若 x == 10:
      輸出 "等於10"
    否則:
      輸出 "不等於10"
    結束
    `;
    const logs: any[] = [];
    const originalLog = console.log;
    console.log = (msg: any) => logs.push(msg);

    runChineseCode(source);

    console.log = originalLog;
    console.log(logs);

    // 不等於10
    expect(logs).toContain("不等於10");
  });

  it("能夠執行簡單的當(while) 迴圈", () => {
    const source = `
      宣告 整數 x 為 0
      當 x < 24:
        x += 1
        輸出 x
      結束
    `;
    const logs: any[] = [];
    const originalLog = console.log;
    console.log = (msg: any) => logs.push(msg);

    runChineseCode(source);

    console.log = originalLog;
    // 不等於10
    expect(logs).toContain(24);
    expect(logs).not.toContain(25);
  });

  it("能夠執行函式呼叫", () => {
    const source = `
      函式 測試函式『甲, 乙』:
        回傳 甲 加 乙
        結束
      輸出 測試函式『3, 5』 加 測試函式『4, 1』
    `;
    const logs: any[] = [];
    const originalLog = console.log;
    console.log = (msg: any) => logs.push(msg);

    runChineseCode(source);

    console.log = originalLog;

    expect(logs).toContain(13);
  });
});
