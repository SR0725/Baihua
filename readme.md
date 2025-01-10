# 中文程式語言「白話文」：編譯器/直譯器專案

## 1. 專案簡介

本專案實作了一個名為「**白話文**」的簡易程式語言，以 **Node.js + TypeScript** 為基礎，並包含以下功能：

- **關鍵字完全中文化**：如「令」、「主程式」、「若」、「當」、「結束」等。
- **基本程式語言元素**：  
  - 變數宣告 (`令 整數 甲 為 三十一`)  
  - 條件控制 (`若 ... 否則 ... 結束`)  
  - 迴圈 (`當 ... 結束`)  
  - 函式宣告 / 呼叫 (`函式 加法『甲, 乙』: ... 結束`)  
  - 輸出 (`輸出 「文字」`)  
- **測試驅動開發 (TDD)**：使用 Jest 撰寫單元測試與整合測試。
- **可擴充性**：若未來需支援更多功能（如陣列、物件導向、多檔案匯入），可在此基礎上擴充。

這個「白話文」的程式碼作為編譯器課程的期末專案，不建議在商業專案中使用該語言開發。

---

## 2. 「白話文」的文法說明

### 2.1 目標與特色

- **易讀易懂**：儘可能用中文關鍵字與結構來表達程式意義。
- **基礎結構簡單**：只涵蓋最常見的編程元素，適用於教學示範。
- **類似 JavaScript/C++** 的流程控制結構：if/else、while、function、變數宣告等。
- **區塊使用 `結束` 關鍵字** 進行結束，或搭配冒號 `:` + 縮排表示結構。

### 2.2 語法概觀

1. **主程式**  
   - `主程式: ... 結束`  
   - 代表整個程式的入口點 (相當於 `main()` 函式)。
   - 這是可選的，你可以把程式直接寫在外頭，不寫 `主程式` 也行。

2. **變數宣告**  
   - `令 <型別> <變數名稱> 為 <初始值>`  
   - e.g. `令 整數 甲 為 三十一`  
   - 目前僅示範 `整數`, `文字(字串)`, `布林`。

3. **指派 (Assignment)**  
   - `甲 設為 三十一`  
   - `甲 = 甲 + 一`  
   - 若有支援 `加等於`, `減等於`, 亦可寫 `甲 加等於 一`。

4. **條件式 (if/else)**  
   ```
   若 <條件>:
       ...程式敘述...
   否則:
       ...程式敘述...
   結束
   ```

5. **迴圈 (while)**  
   ```
   當 <條件>:
       ...程式敘述...
   結束
   ```

6. **函式宣告 / 呼叫**  
   ```
   函式 相加『甲, 乙』:
       回傳 甲 加 乙
   結束

   輸出 相加『三十一, 一』
   ```
   - 其中 `回傳 <值>` 表示函式返回。

7. **輸出**  
   - `輸出 「Hello World」`  
   - `輸出 甲`  
   - 目前採用簡單 `console.log` 輸出。

8. **中文數字**  
   - 支援數字使用中文撰寫，如 `二十一`、`兩億七千八百四十二萬一千七百八十一`。

### 2.3 簡單範例程式

```
函式 次方『底數, 指數』:
    令 整數 結果 為 一
    令 整數 指針 為 零
    當 指針 小於 指數:
        結果 設為 結果 乘 底數
        指針 加等於 一
    結束
    回傳 結果
結束

// 2 的 10 次方
輸出 次方『二, 十』
```

---

## 3. 編譯器 (或直譯器) 原理與流程

本專案採用**語法解析 + AST + 直譯執行**的編譯器架構：

1. **Scanner (詞彙分析器)**  
   - 輸入：整個「白話文」原始碼 (string)。  
   - 輸出：Token 串列 (TokenType + lexeme + 行數)。  
   - 內容：自訂 TokenType 列舉，如「主程式」、「若」、「等於(==)」、「整數常量」、「字串常量」等等，識別字與保留字之分。

2. **Parser (語法分析器)**  
   - 輸入：Scanner 產生的 Token 串列。  
   - 輸出：抽象語法樹 (AST)。  
   - 內容：使用遞迴下降解析方法 (Recursive Descent)，根據語法規則構建 AST 節點 (如 `IfStatement`, `WhileStatement`, `FunctionDeclaration`, `BinaryExpression`, `Variable` 等)。

3. **AST (Abstract Syntax Tree) 定義**  
   - 主要包含 Statement 與 Expression 兩大類。  
   - Statement：`VarDecl`, `IfStatement`, `WhileStatement`, `FunctionDeclaration`, `ExpressionStatement`, `ReturnStatement`, `PrintStatement`…  
   - Expression：`Literal`, `Variable`, `Binary`, `FunctionCall`, `AssignmentExpression`…  
   - AST 是語意操作的核心。

4. **Interpreter (解釋器 / 執行器)**  
   - 輸入：AST  
   - 執行：深度遍歷 AST，依節點型別執行對應邏輯。  
     - 變數宣告：在「環境」(Map) 裡存一個 key-value  
     - IfStatement：先 evaluate 條件，然後執行對應分支  
     - WhileStatement：循環判斷條件  
     - FunctionDeclaration：存入全域函式表  
     - FunctionCall：找到函式定義 -> 建立參數 -> 執行函式體 -> 取得回傳值  
     - PrintStatement：`console.log` 輸出  
     - BinaryExpression (+, -, *, /, ==, !=, ...) 進行運算後回傳結果  
   - 輸出：程式執行過程（Console 輸出），或函式回傳值等。

5. **錯誤處理**：  
   - Scanner 發現不合法的字元，會拋錯。  
   - Parser 無法匹配語法，則拋出類似 `[第x行] 語法錯誤: ...`。  
   - Interpreter 執行時若發現未宣告的變數、未定義的函式等，也會拋錯。

---

## 4. 模組化架構與各檔案說明

### 4.1 `token.ts`  
- 定義 `TokenType` (如「令」、「若」、「當」、「整數常量」、「字串常量」等) 與 `Token` 介面 (type, lexeme, line)。  

### 4.2 `scanner.ts` (Scanner/Lexer)  
- 主要函式 `scanTokens()`：將原始碼逐字讀取，辨識各種 Token。  
- 忽略空白、處理字串、數字、比較運算子等。  
- 最後加上 `EOF` Token。

### 4.3 `ast.ts` (抽象語法樹)  
- 定義程式語言的所有語句 (Statement) 與表達式 (Expression) 節點介面。  
- 例如 `IfStatement { condition, thenBranch, elseBranch }`、`Binary { left, operator, right }`。  

### 4.4 `parser.ts` (Parser)  
- 使用遞迴下降法：  
  1. `parse()`: 讀 Token -> 多個 `declaration()`。  
  2. `declaration()`: 函式宣告 / 主程式 / 變數宣告 / statement…  
  3. `statement()`：if / while / print / return / expression…  
  4. `expression()`：assignment / equality / comparison / term / factor / unary / primary…  
  - 過程中建構 AST 節點，若有不合法 Token，拋出錯誤。

### 4.5 `interpreter.ts` (直譯器)  
- `interpret(ast)`: 遍歷整個 AST。  
- 以 Map 模擬全域或區域變數環境；以 Map 模擬函式表。  
- 執行每個 Statement，計算 Expression 結果。  
- `evaluate(expr)`: 遞迴計算表達式，回傳結果。

### 4.6 `index.ts` (程式進入點)  
- 讀取檔案原始碼 -> Scanner -> Parser -> AST -> Interpreter -> 執行。  
- 提供一個 `runChineseCode(source: string)` API，方便整合測試與直接呼叫。

### 4.7 `test/` 目錄 (Jest)  
- `scanner.test.ts`: 測試各種輸入字串，是否正確產生 Token。  
- `parser.test.ts`: 測試各種語法 (if, while, function, variable 等) 是否能正確解析成 AST。  
- `interpreter.test.ts`: 單元測試 Interpreter 是否能正確執行簡單案例 (變數宣告與運算、函式呼叫等)。  
- `integration.test.ts`: 整合測試，模擬實際程式碼執行完整流程。

---

## 5. 使用方式

1. **安裝依賴**  
   ```bash
   pnpm install
   ```

2. **執行測試**  
   ```bash
   pnpm test
   ```
   - 會自動跑 `scanner.test.ts`、`parser.test.ts`、`interpreter.test.ts`、`integration.test.ts` 等。

3. **編譯 TypeScript**  
   ```bash
   npm run build
   ```
   - 產生 `dist/` 目錄的可執行 JS 檔。

4. **執行白話文程式**  
   ```bash
   npm start examples/hello.hw
   ```
   - 其中 `examples/hello.hw` 為範例程式，如：  
     ```
     主程式:
       輸出 "Hello, 白話文!"
     結束
     ```

5. **在其他程式碼中直接呼叫 (可選)**  
   - `import { runChineseCode } from "./dist/index";`  
   - `runChineseCode("令 整數 變數 x 為 10 ...");`

---

## 結語

這個「白話文」編譯器/直譯器專案，示範了：

1. **語言設計**：使用中文關鍵字，降低初學者閱讀門檻。  
2. **編譯器核心流程**：Scanner -> Parser -> AST -> Interpreter。  
3. **測試驅動開發**：透過單元與整合測試，確保功能正確可維護。  
4. **可擴充性**：若要支援陣列、物件導向、錯誤處理機制 (try/catch) 等，只需在 Scanner / Parser / Interpreter 分別擴充語法規則與執行邏輯。
