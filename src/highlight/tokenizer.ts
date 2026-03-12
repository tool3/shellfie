import type { Token, TokenPattern, TokenType } from './types';

/**
 * Core tokenization engine using regex patterns
 * Languages define patterns in priority order - first match wins
 */
export function tokenize(code: string, patterns: TokenPattern[]): Token[] {
  const tokens: Token[] = [];
  let remaining = code;
  let position = 0;

  while (remaining.length > 0) {
    let matched = false;

    for (const { type, pattern } of patterns) {
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;

      // Ensure pattern matches at start of remaining string
      const match = pattern.exec(remaining);

      if (match && match.index === 0) {
        const value = match[0];
        if (value.length > 0) {
          tokens.push({ type, value });
          remaining = remaining.slice(value.length);
          position += value.length;
          matched = true;
          break;
        }
      }
    }

    // If no pattern matched, consume one character as text
    if (!matched) {
      const char = remaining[0];
      // Merge with previous text token if possible
      const lastToken = tokens[tokens.length - 1];
      if (lastToken && lastToken.type === 'text') {
        lastToken.value += char;
      } else {
        tokens.push({ type: 'text', value: char });
      }
      remaining = remaining.slice(1);
      position++;
    }
  }

  return mergeAdjacentTokens(tokens);
}

/**
 * Merge adjacent tokens of the same type for cleaner output
 */
function mergeAdjacentTokens(tokens: Token[]): Token[] {
  if (tokens.length === 0) return tokens;

  const merged: Token[] = [];
  let current = { ...tokens[0] };

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === current.type) {
      current.value += token.value;
    } else {
      merged.push(current);
      current = { ...token };
    }
  }
  merged.push(current);

  return merged;
}

/**
 * Helper to create a pattern that matches at string boundaries
 * Useful for keywords that shouldn't match inside identifiers
 */
export function wordBoundary(words: string[]): RegExp {
  const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(${escaped.join('|')})\\b`);
}

/**
 * Common patterns reusable across languages
 */
export const COMMON_PATTERNS = {
  // Single-line comment starting with //
  lineComment: /\/\/[^\n]*/,

  // Single-line comment starting with #
  hashComment: /#[^\n]*/,

  // Multi-line comment /* ... */
  blockComment: /\/\*[\s\S]*?\*\//,

  // Double-quoted string with escape support
  doubleString: /"(?:[^"\\]|\\.)*"/,

  // Single-quoted string with escape support
  singleString: /'(?:[^'\\]|\\.)*'/,

  // Template literal / backtick string
  templateString: /`(?:[^`\\]|\\.)*`/,

  // Integer and float numbers
  number: /\b\d+\.?\d*(?:[eE][+-]?\d+)?\b/,

  // Hex numbers
  hexNumber: /\b0[xX][0-9a-fA-F]+\b/,

  // Binary numbers
  binaryNumber: /\b0[bB][01]+\b/,

  // Octal numbers
  octalNumber: /\b0[oO][0-7]+\b/,

  // Common operators
  operator: /[+\-*/%=<>!&|^~?:]+/,

  // Punctuation
  punctuation: /[{}[\]();,.:]/,

  // Whitespace (preserve as text)
  whitespace: /\s+/,

  // Generic identifier
  identifier: /[a-zA-Z_$][a-zA-Z0-9_$]*/,
} as const;

/**
 * Create patterns for a C-like language (JS, TS, Java, C#, Go, Rust, etc.)
 */
export function createCLikePatterns(options: {
  keywords: string[];
  types?: string[];
  builtins?: string[];
  constants?: string[];
  extraPatterns?: TokenPattern[];
}): TokenPattern[] {
  const patterns: TokenPattern[] = [];

  // Extra patterns first (highest priority)
  if (options.extraPatterns) {
    patterns.push(...options.extraPatterns);
  }

  // Comments (high priority)
  patterns.push(
    { type: 'comment', pattern: COMMON_PATTERNS.blockComment },
    { type: 'comment', pattern: COMMON_PATTERNS.lineComment }
  );

  // Strings
  patterns.push(
    { type: 'string', pattern: COMMON_PATTERNS.templateString },
    { type: 'string', pattern: COMMON_PATTERNS.doubleString },
    { type: 'string', pattern: COMMON_PATTERNS.singleString }
  );

  // Numbers
  patterns.push(
    { type: 'number', pattern: COMMON_PATTERNS.hexNumber },
    { type: 'number', pattern: COMMON_PATTERNS.binaryNumber },
    { type: 'number', pattern: COMMON_PATTERNS.octalNumber },
    { type: 'number', pattern: COMMON_PATTERNS.number }
  );

  // Constants (before keywords)
  if (options.constants?.length) {
    patterns.push({ type: 'constant', pattern: wordBoundary(options.constants) });
  }

  // Keywords
  patterns.push({ type: 'keyword', pattern: wordBoundary(options.keywords) });

  // Types
  if (options.types?.length) {
    patterns.push({ type: 'type', pattern: wordBoundary(options.types) });
  }

  // Built-ins
  if (options.builtins?.length) {
    patterns.push({ type: 'builtin', pattern: wordBoundary(options.builtins) });
  }

  // Function calls - identifier followed by (
  // Uses lookahead to not consume the parenthesis
  patterns.push({
    type: 'function',
    pattern: /[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()/,
  });

  // Method calls - .identifier followed by (
  patterns.push({
    type: 'function',
    pattern: /(?<=\.)[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()/,
  });

  // Operators and punctuation
  patterns.push(
    { type: 'operator', pattern: COMMON_PATTERNS.operator },
    { type: 'punctuation', pattern: COMMON_PATTERNS.punctuation }
  );

  // Whitespace and identifiers last
  patterns.push(
    { type: 'text', pattern: COMMON_PATTERNS.whitespace },
    { type: 'text', pattern: COMMON_PATTERNS.identifier }
  );

  return patterns;
}
