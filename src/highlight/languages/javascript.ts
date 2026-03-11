import type { LanguageTokenizer, Token } from '../types';
import { createCLikePatterns, tokenize } from '../tokenizer';

const KEYWORDS = [
  'async', 'await', 'break', 'case', 'catch', 'class', 'const',
  'continue', 'debugger', 'default', 'delete', 'do', 'else',
  'export', 'extends', 'finally', 'for', 'from', 'function',
  'if', 'import', 'in', 'instanceof', 'let', 'new', 'of',
  'return', 'static', 'super', 'switch', 'this', 'throw',
  'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
  'as', 'get', 'set',
];

const CONSTANTS = [
  'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
];

const BUILTINS = [
  'console', 'window', 'document', 'global', 'globalThis',
  'process', 'module', 'exports', 'require',
  'Object', 'Array', 'String', 'Number', 'Boolean', 'Symbol', 'BigInt',
  'Function', 'Date', 'RegExp', 'Error', 'Map', 'Set', 'WeakMap', 'WeakSet',
  'Promise', 'Proxy', 'Reflect', 'JSON', 'Math', 'Intl',
  'ArrayBuffer', 'DataView', 'Int8Array', 'Uint8Array',
  'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'fetch', 'Request', 'Response', 'Headers', 'URL', 'URLSearchParams',
];

const patterns = createCLikePatterns({
  keywords: KEYWORDS,
  constants: CONSTANTS,
  builtins: BUILTINS,
  extraPatterns: [
    // JSX tags (simplified)
    { type: 'tag', pattern: /<\/?[A-Z][a-zA-Z0-9]*/ },
    { type: 'tag', pattern: /<\/?[a-z][a-z0-9-]*/ },

    // Regex literals (simplified - doesn't handle all edge cases)
    { type: 'regex', pattern: /\/(?:[^/\\]|\\.)+\/[gimsuvy]*/ },

    // Arrow function
    { type: 'keyword', pattern: /=>/ },

    // Spread operator
    { type: 'operator', pattern: /\.{3}/ },

    // Optional chaining
    { type: 'operator', pattern: /\?\.[^0-9]/ },

    // Nullish coalescing
    { type: 'operator', pattern: /\?\?/ },
  ],
});

export const javascript: LanguageTokenizer = {
  name: 'javascript',
  aliases: ['js', 'jsx', 'mjs', 'cjs'],
  extensions: ['.js', '.jsx', '.mjs', '.cjs'],
  tokenize: (code: string): Token[] => tokenize(code, patterns),
};
