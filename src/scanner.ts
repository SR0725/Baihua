/**
 * scanner.ts
 *
 * 詞彙分析器：將原始白話文程式碼字串掃描後，產生一串 Token。
 */

import { Token, TokenType } from "./token";
import { chinanumeralsToNum } from "chinesenum";

export class Scanner {
  private source: string;
  private tokens: Token[] = [];
  private current = 0; // 目前掃描位置
  private line = 1;

  // 關鍵字對應表
  private static keywords: { [key: string]: TokenType } = {
    主程式: TokenType.主程式,
    宣告: TokenType.宣告,
    令: TokenType.宣告,
    整數: TokenType.整數,
    為: TokenType.為,
    若: TokenType.若,
    否則: TokenType.否則,
    當: TokenType.當,
    結束: TokenType.結束,
    函式: TokenType.函式,
    回傳: TokenType.回傳,
    輸出: TokenType.輸出,
    註解: TokenType.註解,
  };

  constructor(source: string) {
    this.source = source;
  }

  public scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.scanToken();
    }
    this.tokens.push({ type: TokenType.EOF, lexeme: "", line: this.line });
    return this.tokens;
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    return this.source.charAt(this.current++);
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }

  private scanToken(): void {
    const c = this.advance();
    switch (c) {
      case " ":
      case "\r":
      case "\t":
        // 忽略空白
        break;
      case "\n":
        this.line++;
        break;
      case "=":
        if (this.match("=")) {
          // ==
          this.addToken(TokenType.等於, "==");
        } else {
          this.addToken(TokenType.等號, "=");
        }
        break;
      case "等":
        if (this.match("於")) {
          // ==
          this.addToken(TokenType.等於, "==");
        }
        break;
      case "設":
        if (this.match("為")) {
          // ==
          this.addToken(TokenType.等號, "=");
        }
        break;
      case "加":
        if (this.match("等") && this.match("於")) {
          this.addToken(TokenType.加等於, "+=");
        } else {
          this.addToken(TokenType.加, "+");
        }
        break;
      case "減":
        if (this.match("等") && this.match("於")) {
          // ==
          this.addToken(TokenType.減等於, "-=");
        } else {
          this.addToken(TokenType.減, "-");
        }
        break;
      case "乘":
        this.addToken(TokenType.乘, "*");
        break;
      case "除":
        this.addToken(TokenType.除, "/");
        break;
      case "!":
        if (this.match("=")) {
          // !=
          this.addToken(TokenType.不等於, "!=");
        }
        break;
      case ">":
        if (this.match("=")) {
          this.addToken(TokenType.大於等於, ">=");
        } else {
          this.addToken(TokenType.大於, ">");
        }
        break;
      case "<":
        if (this.match("=")) {
          this.addToken(TokenType.小於等於, "<=");
        } else {
          this.addToken(TokenType.小於, "<");
        }
        break;
      case "小":
        if (this.match("於")) {
          this.addToken(TokenType.小於, "<");
        }
        break;
      case "大":
        if (this.match("於")) {
          this.addToken(TokenType.大於, ">");
        }
        break;

      case "+":
        if (this.match("=")) {
          this.addToken(TokenType.加等於, "+=");
        } else {
          this.addToken(TokenType.加, "+");
        }
        break;
      case "-":
        if (this.match("=")) {
          this.addToken(TokenType.減等於, "-=");
        } else {
          this.addToken(TokenType.減, "-");
        }
        break;
      case "*":
        this.addToken(TokenType.乘, "*");
        break;
      case "/":
        // 簡易處理單行註解：若下一個字元是"/"，則忽略這一行
        if (this.match("/")) {
          while (this.peek() !== "\n" && !this.isAtEnd()) {
            this.advance();
          }
        } else {
          this.addToken(TokenType.除, "/");
        }
        break;
      case "『":
        this.addToken(TokenType.左括號, "('");
        break;
      case "』":
        this.addToken(TokenType.右括號, "')");
        break;
      case ":":
        this.addToken(TokenType.冒號, ":");
        break;
      case '"':
      case "「":
      case "」":
        this.stringLiteral();
        break;
      case ",":
        this.addToken(TokenType.逗號, ",");
        break;
      default:
        if (this.isDigit(c)) {
          this.numberLiteral(c);
        } else {
          this.identifierOrKeyword(c);
        }
        break;
    }
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;
    this.current++;
    return true;
  }

  private addToken(type: TokenType, lexeme: string) {
    this.tokens.push({ type, lexeme, line: this.line });
  }

  private isDigit(c: string): boolean {
    const chineseDigits = "零一二兩三四五六七八九十百千萬億兆京垓秭穰";
    return (c >= "0" && c <= "9") || chineseDigits.includes(c);
  }

  private numberLiteral(firstChar: string) {
    let lexeme = firstChar;
    while (this.isDigit(this.peek())) {
      lexeme += this.advance();
    }
    lexeme = lexeme.replaceAll("兩", "二");
    const num =
      firstChar >= "0" && firstChar <= "9"
        ? lexeme
        : chinanumeralsToNum(lexeme, { format: "cn" });
    this.addToken(TokenType.整數常量, num);
  }

  private stringLiteral() {
    // 掃描直到下一個 " 或 EOF
    let lexeme = "";
    while (!this.isAtEnd() && this.peek() !== '"' && this.peek() !== "」") {
      lexeme += this.advance();
    }
    // consume 結束的 "
    if (!this.isAtEnd()) this.advance();
    this.addToken(TokenType.字串常量, lexeme);
  }

  private identifierOrKeyword(firstChar: string) {
    let lexeme = firstChar;
    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      lexeme += this.advance();
    }

    // 檢查是否為關鍵字
    if (Scanner.keywords[lexeme] !== undefined) {
      this.addToken(Scanner.keywords[lexeme], lexeme);
    } else {
      this.addToken(TokenType.識別符, lexeme);
    }
  }

  private isAlphaNumeric(c: string): boolean {
    return /^[A-Za-z0-9\u4E00-\u9FFF]+$/.test(c);
  }
}
