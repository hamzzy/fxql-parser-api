import {
  Amount,
  FXQLStatement,
  ParserError,
  ParsingResult,
  Token,
  TokenType,
} from './fxql.types';

class Lexer {
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
      .replace(/\\n/g, '\n') // Replace escaped newlines with actual newlines
      .replace(/\r\n/g, '\n') // Normalize line breaks
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

class Parser {
  private currentToken: Token;
  private readonly VALID_CURRENCIES = [
    'USD',
    'GBP',
    'EUR',
    'JPY',
    'NZD',
    'NGN',
  ];

  constructor(private lexer: Lexer) {
    this.currentToken = this.lexer.getNextToken();
  }

  private eat(tokenType: TokenType): void {
    if (this.currentToken.type === tokenType) {
      this.currentToken = this.lexer.getNextToken();
    } else {
      throw new ParserError(
        `Expected ${tokenType}, got ${this.currentToken.type}`,
        this.currentToken.line,
        this.currentToken.column,
      );
    }
  }

  private validateCurrency(currency: string, currencyType: string): void {
    // CURR1 and CURR2 validation
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new ParserError(
        `Invalid ${currencyType} currency: ${currency}. Must be exactly 3 uppercase characters.`,
        this.currentToken.line,
        this.currentToken.column,
      );
    }

    if (!this.VALID_CURRENCIES.includes(currency)) {
      throw new ParserError(
        `Unsupported ${currencyType} currency: ${currency}. Must be one of: ${this.VALID_CURRENCIES.join(', ')}`,
        this.currentToken.line,
        this.currentToken.column,
      );
    }
  }

  private validateAmount(amount: number, amountType: string): void {
    // Amount validation specific to BUY and SELL
    if (isNaN(amount)) {
      throw new ParserError(
        `Invalid ${amountType} amount: Not a valid number`,
        this.currentToken.line,
        this.currentToken.column,
      );
    }

    // Check for invalid numeric formats (like multiple decimals)
    const amountStr = amount.toString();
    if (amountStr.split('.').length > 2 || amountStr.includes('..')) {
      throw new ParserError(
        `Invalid ${amountType} amount format: ${amountStr}`,
        this.currentToken.line,
        this.currentToken.column,
      );
    }

    // Disallow negative numbers
    if (amount < 0) {
      throw new ParserError(
        `${amountType} amount cannot be negative: ${amount}`,
        this.currentToken.line,
        this.currentToken.column,
      );
    }
  }

  private validateCapAmount(amount: number): void {
    // CAP amount validation
    if (isNaN(amount)) {
      throw new ParserError(
        `Invalid CAP amount: Not a valid number`,
        this.currentToken.line,
        this.currentToken.column,
      );
    }

    // Must be a whole number or zero
    if (!Number.isInteger(amount) && amount !== 0) {
      throw new ParserError(
        `CAP amount must be a whole number: ${amount}`,
        this.currentToken.line,
        this.currentToken.column,
      );
    }

    // Disallow negative numbers
    if (amount < 0) {
      throw new ParserError(
        `CAP amount cannot be negative: ${amount}`,
        this.currentToken.line,
        this.currentToken.column,
      );
    }
  }

  private validateStatementNotEmpty(statement: FXQLStatement): void {
    // Ensure statement has at least one command (BUY, SELL, or CAP)
    if (!statement.buyAmount && !statement.sellAmount && !statement.capAmount) {
      throw new ParserError(
        'Invalid FXQL statement: Empty statement',
        this.currentToken.line,
        this.currentToken.column,
      );
    }
  }

  private parseAmount(
    amountType: string,
    validateFunc: (amount: number) => void,
  ): Amount {
    const token = this.currentToken;
    this.eat(TokenType.NUMBER);
    const amount = parseFloat(token.value);

    validateFunc(amount);

    return { value: amount };
  }

  private parseCurrencyPair(): [string, string] {
    const baseCurrency = this.currentToken.value;
    this.validateCurrency(baseCurrency, 'base');
    this.eat(TokenType.IDENTIFIER);
    this.eat(TokenType.DASH);
    const quoteCurrency = this.currentToken.value;
    this.validateCurrency(quoteCurrency, 'quote');
    this.eat(TokenType.IDENTIFIER);

    if (this.currentToken.type !== TokenType.LEFT_BRACE) {
      throw new ParserError(
        `Expected a single space after the currency pair.`,
        this.currentToken.line,
        this.currentToken.column,
      );
    }
    return [baseCurrency, quoteCurrency];
  }

  public parseStatement(): FXQLStatement {
    const [baseCurrency, quoteCurrency] = this.parseCurrencyPair();
    this.eat(TokenType.LEFT_BRACE);

    const statement: FXQLStatement = {
      baseCurrency,
      quoteCurrency,
    };

    if (this.currentToken.type === TokenType.RIGHT_BRACE) {
      throw new ParserError(
        'Invalid FXQL statement: Empty statement',
        this.currentToken.line,
        this.currentToken.column,
      );
    }

    while (this.currentToken.type === TokenType.IDENTIFIER) {
      const command = this.currentToken.value.toUpperCase();
      this.eat(TokenType.IDENTIFIER);

      switch (command) {
        case 'BUY':
          if (statement.buyAmount) {
            throw new ParserError(
              'Duplicate BUY command in statement',
              this.currentToken.line,
              this.currentToken.column,
            );
          }
          statement.buyAmount = this.parseAmount('BUY', (amount) =>
            this.validateAmount(amount, 'BUY'),
          );
          break;
        case 'SELL':
          if (statement.sellAmount) {
            throw new ParserError(
              'Duplicate SELL command in statement',
              this.currentToken.line,
              this.currentToken.column,
            );
          }
          statement.sellAmount = this.parseAmount('SELL', (amount) =>
            this.validateAmount(amount, 'SELL'),
          );
          break;
        case 'CAP':
          if (statement.capAmount) {
            throw new ParserError(
              'Duplicate CAP command in statement',
              this.currentToken.line,
              this.currentToken.column,
            );
          }
          statement.capAmount = this.parseAmount('CAP', this.validateCapAmount);
          break;
        default:
          throw new ParserError(
            `Unknown command: ${command}`,
            this.currentToken.line,
            this.currentToken.column,
          );
      }
    }

    this.eat(TokenType.RIGHT_BRACE);

    // Validate that statement is not empty
    this.validateStatementNotEmpty(statement);

    return statement;
  }
}

// Main parsing function
export function parseFXQLStatements(input: string): ParsingResult {
  // Normalize input and split into statements
  const statementStrings = Lexer.normalizeInput(input);

  const parsedResult: ParsingResult = {
    success: [],
    errors: [],
  };

  for (const statementString of statementStrings) {
    try {
      const lexer = new Lexer(statementString);
      const parser = new Parser(lexer);
      const statement = parser.parseStatement();
      parsedResult.success.push(statement);
    } catch (error) {
      // Collect all errors without stopping
      parsedResult.errors.push({
        input: statementString,
        error:
          error instanceof ParserError
            ? error.message
            : error instanceof Error
              ? error.message
              : String(error),
        line: error instanceof ParserError ? error.line : undefined,
        column: error instanceof ParserError ? error.column : undefined,
      });
    }
  }

  return parsedResult;
}

// Utility function to format FXQL statements
export function formatFXQLStatement(statement: FXQLStatement): string {
  return (
    [
      `${statement.baseCurrency}-${statement.quoteCurrency} {`,
      statement.buyAmount ? ` BUY ${statement.buyAmount.value}` : null,
      statement.sellAmount ? ` SELL ${statement.sellAmount.value}` : null,
      statement.capAmount ? ` CAP ${statement.capAmount.value}` : null,
      '}',
    ]
      .filter(Boolean)
      .join('\n') + '\n'
  );
}
