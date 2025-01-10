/**
 * index.ts
 *
 * 中文註解：程式進入點，可由此讀取白話文程式碼 -> Scanner -> Parser -> Interpreter
 * 執行白話文程式碼。
 */

import fs from "fs";
import path from "path";
import { Scanner } from "./scanner";
import { Parser } from "./parser";
import { Interpreter } from "./interpreter";

function runChineseCode(source: string, options?: { debug: boolean }) {
  const { debug } = options || {};
  debug && console.log("正在編譯並執行程式碼:" + source);
  // 1. 詞彙分析
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();
  debug && console.log("詞彙分析完成, 共" + tokens.length + "個 Token");
  // 2. 語法分析
  const parser = new Parser(tokens);
  const ast = parser.parse();
  debug && console.log("抽象語法樹解析完成: " + JSON.stringify(ast, null, 2));

  // 3. 執行 (直譯)
  const interpreter = new Interpreter();
  const start = performance.now();
  debug && console.log("開始執行程式碼\n======================");
  interpreter.interpret(ast);
  const end = performance.now();
  debug && console.log("======================\n執行完畢");
  debug && console.log("執行時間: " + (end - start) + "ms");
}

// 執行參數
if (require.main === module) {
  const args = process.argv.slice(2);
  const filename = args[0];
  const debug = args.includes("--debug");

  console.log("args: " + args);

  console.log("filename: " + filename);
  if (!filename) {
    console.log("請指定白話文檔案路徑，例如： npm start examples/hello.baihua");
    console.log("可選參數：--debug 開啟除錯模式");
    process.exit(1);
  }

  const codePath = path.resolve(filename);
  if (!fs.existsSync(codePath)) {
    console.log("檔案不存在:", codePath);
    process.exit(1);
  }

  const source = fs.readFileSync(codePath, "utf-8");
  runChineseCode(source, { debug });
}

export { runChineseCode };
