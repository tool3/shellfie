import type { LanguageTokenizer, Token, TokenPattern } from '../types';
import { COMMON_PATTERNS, tokenize } from '../tokenizer';

const patterns: TokenPattern[] = [
  // Comments
  { type: 'comment', pattern: /<!--[\s\S]*?-->/ },

  // DOCTYPE
  { type: 'keyword', pattern: /<!DOCTYPE[^>]*>/i },

  // CDATA sections
  { type: 'string', pattern: /<!\[CDATA\[[\s\S]*?\]\]>/ },

  // Script and style content (treat as strings to avoid confusion)
  { type: 'string', pattern: /<script[^>]*>[\s\S]*?<\/script>/i },
  { type: 'string', pattern: /<style[^>]*>[\s\S]*?<\/style>/i },

  // Closing tags
  { type: 'tag', pattern: /<\/[a-zA-Z][a-zA-Z0-9-]*\s*>/ },

  // Self-closing tags and opening tags with attributes
  {
    type: 'tag',
    pattern: /<[a-zA-Z][a-zA-Z0-9-]*(?=[\s/>])/,
  },

  // Attribute names
  { type: 'attribute', pattern: /(?<=\s)[a-zA-Z_:][a-zA-Z0-9_:.-]*(?=\s*=)/ },

  // Boolean attributes (no value)
  { type: 'attribute', pattern: /(?<=\s)[a-zA-Z_:][a-zA-Z0-9_:.-]*(?=[\s/>])/ },

  // Attribute values
  { type: 'string', pattern: COMMON_PATTERNS.doubleString },
  { type: 'string', pattern: COMMON_PATTERNS.singleString },

  // Tag closing brackets
  { type: 'tag', pattern: /\/?>/ },

  // Entities
  { type: 'constant', pattern: /&[a-zA-Z0-9#]+;/ },

  // Whitespace
  { type: 'text', pattern: COMMON_PATTERNS.whitespace },

  // Text content
  { type: 'text', pattern: /[^<>&]+/ },
];

export const html: LanguageTokenizer = {
  name: 'html',
  aliases: ['htm', 'xhtml', 'xml', 'svg'],
  extensions: ['.html', '.htm', '.xhtml', '.xml', '.svg'],
  tokenize: (code: string): Token[] => tokenize(code, patterns),
};
