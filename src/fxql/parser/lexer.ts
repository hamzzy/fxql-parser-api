import { Token, TokenType, ParserError } from '../fxql.types';

export class Lexer {
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private currentChar: string | null;
  private readonly normalizedText: string;

  constructor(text: string) {
    // Pre-process the input text to handle escaped newlines and normalize spaces
    this.normalizedText = text
      .replace(/\\n/g, '\n') // Replace escaped newlines with actual newlines
      .replace(/\r\n/g, '\n') // Normalize line breaks
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim();

    this.currentChar =
      this.normalizedText.length > 0 ? this.normalizedText[0] : null;
  }

  private advance(): void {
    if (this.currentChar === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }

    this.position++;

    if (this.position > this.normalizedText.length - 1) {
      this.currentChar = null;
    } else {
      this.currentChar = this.normalizedText[this.position];
    }
  }

  private skipWhitespace(): void {
    while (this.currentChar !== null && /\s/.test(this.currentChar)) {
      this.advance();
    }
  }

  private number(): Token {
    let result = '';
    const startColumn = this.column;
    const startLine = this.line;

    while (
      this.currentChar !== null &&
      (/\d/.test(this.currentChar) || this.currentChar === '.')
    ) {
      result += this.currentChar;
      this.advance();
    }

    return {
      type: TokenType.NUMBER,
      value: result,
      line: startLine,
      column: startColumn,
    };
  }

  private identifier(): Token {
    let result = '';
    const startColumn = this.column;
    const startLine = this.line;

    while (this.currentChar !== null && /[a-zA-Z0-9]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }

    return {
      type: TokenType.IDENTIFIER,
      value: result,
      line: startLine,
      column: startColumn,
    };
  }

  public getNextToken(): Token {
    while (this.currentChar !== null) {
      if (/\s/.test(this.currentChar)) {
        this.skipWhitespace();
        continue;
      }

      if (/\d/.test(this.currentChar)) {
        return this.number();
      }

      if (/[a-zA-Z]/.test(this.currentChar)) {
        return this.identifier();
      }

      if (this.currentChar === '{') {
        this.advance();
        return {
          type: TokenType.LEFT_BRACE,
          value: '{',
          line: this.line,
          column: this.column - 1,
        };
      }

      if (this.currentChar === '}') {
        this.advance();
        return {
          type: TokenType.RIGHT_BRACE,
          value: '}',
          line: this.line,
          column: this.column - 1,
        };
      }

      if (this.currentChar === '-') {
        this.advance();
        return {
          type: TokenType.DASH,
          value: '-',
          line: this.line,
          column: this.column - 1,
        };
      }

      throw new ParserError(
        `Invalid character: ${this.currentChar}`,
        this.line,
        this.column,
      );
    }

    return {
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column,
    };
  }

  public static normalizeInput(input: string): string[] {
    // Remove comments
    const cleanInput = input.replace(/#.*$/gm, '').trim();

    // Split input into statements, handling various input formats
    return cleanInput
      .replace(/\r\n/g, '\n') // Normalize line breaks
      .split(/\s*}\s*/) // Split by closing braces with optional whitespace
      .filter((statement) => statement.trim()) // Remove empty statements
      .map((statement) => {
        // Normalize each statement
        return statement.trim() + '}';
      });
  }
}
