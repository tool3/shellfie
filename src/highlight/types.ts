/**
 * Token types for syntax highlighting
 * Maps to ANSI colors via the theme
 */
export type TokenType =
  | 'text'        // Default text (foreground)
  | 'comment'     // Comments (brightBlack/dim)
  | 'keyword'     // Language keywords (magenta)
  | 'string'      // String literals (green)
  | 'number'      // Numeric literals (yellow)
  | 'operator'    // Operators like +, -, =, etc. (cyan)
  | 'punctuation' // Brackets, commas, semicolons (foreground)
  | 'function'    // Function names (blue)
  | 'type'        // Type names, classes (yellow)
  | 'variable'    // Variables (red)
  | 'property'    // Object properties (cyan)
  | 'constant'    // Constants, booleans (brightYellow)
  | 'builtin'     // Built-in functions/types (brightCyan)
  | 'regex'       // Regular expressions (brightRed)
  | 'decorator'   // Decorators/annotations (brightMagenta)
  | 'tag'         // HTML/JSX tags (red)
  | 'attribute';  // HTML/JSX attributes (yellow)

/**
 * A single token produced by the tokenizer
 */
export interface Token {
  type: TokenType;
  value: string;
}

/**
 * Language tokenizer definition
 * Each language implements this interface
 */
export interface LanguageTokenizer {
  /** Language identifier (e.g., 'typescript', 'python') */
  name: string;

  /** Alternative names/aliases (e.g., 'ts' for typescript) */
  aliases: string[];

  /** File extensions (e.g., ['.ts', '.tsx']) */
  extensions: string[];

  /** Tokenize the input string into tokens */
  tokenize(code: string): Token[];
}

/**
 * Pattern definition for regex-based tokenization
 * Order matters - first match wins
 */
export interface TokenPattern {
  type: TokenType;
  pattern: RegExp;
}

/**
 * Language detection result
 */
export interface DetectionResult {
  language: string;
  confidence: number; // 0-1
}

/**
 * ANSI color codes for each token type
 */
export const TOKEN_TO_ANSI: Record<TokenType, string> = {
  text: '',                    // No color (default foreground)
  comment: '\x1b[90m',         // Bright black (gray)
  keyword: '\x1b[35m',         // Magenta
  string: '\x1b[32m',          // Green
  number: '\x1b[33m',          // Yellow
  operator: '\x1b[36m',        // Cyan
  punctuation: '',             // Default foreground
  function: '\x1b[34m',        // Blue
  type: '\x1b[33m',            // Yellow
  variable: '\x1b[31m',        // Red
  property: '\x1b[36m',        // Cyan
  constant: '\x1b[93m',        // Bright yellow
  builtin: '\x1b[96m',         // Bright cyan
  regex: '\x1b[91m',           // Bright red
  decorator: '\x1b[95m',       // Bright magenta
  tag: '\x1b[31m',             // Red
  attribute: '\x1b[33m',       // Yellow
};

export const ANSI_RESET = '\x1b[0m';
