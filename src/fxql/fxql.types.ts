// Token Types
export enum TokenType {
  IDENTIFIER = 'alphabet',
  NUMBER = 'NUMBER',
  LEFT_BRACE = 'LEFT_BRACE',
  RIGHT_BRACE = 'RIGHT_BRACE',
  DASH = 'negative',
  EOF = 'EOF',
}

// Token Interface
export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// Amount Interface
export interface Amount {
  value: number;
}

// FXQL Statement Interface
export interface FXQLStatement {
  baseCurrency: string;
  quoteCurrency: string;
  buyAmount?: Amount;
  sellAmount?: Amount;
  capAmount?: Amount;
}

// Parsing Result Interface
export interface ParsingResult {
  success: FXQLStatement[];
  errors: {
    input: string;
    error: string;
    line?: number;
    column?: number;
  }[];
}

// Validation Context
export interface ValidationContext {
  line: number;
  column: number;
  input?: string;
}

// Validator Interface
export interface Validator<T> {
  validate(value: T, context: ValidationContext): void;
}

// Enhanced Parser Error
export class ParserError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number,
    public input?: string,
  ) {
    super(message);
    this.name = 'ParserError';
  }
}

export interface FXQLEntry {
  EntryId?: number;
  SourceCurrency: string;
  DestinationCurrency: string;
  SellPrice: number | null;
  BuyPrice: number | null;
  CapAmount: number | null;
}

export interface FXQLResponse {
  message: string;
  code: string;
  data: FXQLEntry[];
}
