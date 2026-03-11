import type { LanguageTokenizer, Token, TokenPattern } from '../types';
import { COMMON_PATTERNS, tokenize } from '../tokenizer';

const patterns: TokenPattern[] = [
  // Property keys (strings followed by colon)
  { type: 'property', pattern: /"(?:[^"\\]|\\.)*"(?=\s*:)/ },

  // String values
  { type: 'string', pattern: COMMON_PATTERNS.doubleString },

  // Boolean and null
  { type: 'constant', pattern: /\b(true|false|null)\b/ },

  // Numbers
  { type: 'number', pattern: /-?\b\d+\.?\d*(?:[eE][+-]?\d+)?\b/ },

  // Punctuation
  { type: 'punctuation', pattern: /[{}[\],:.]/ },

  // Whitespace
  { type: 'text', pattern: COMMON_PATTERNS.whitespace },
];

export const json: LanguageTokenizer = {
  name: 'json',
  aliases: ['jsonc', 'json5'],
  extensions: ['.json', '.jsonc', '.json5'],
  tokenize: (code: string): Token[] => tokenize(code, patterns),
};
