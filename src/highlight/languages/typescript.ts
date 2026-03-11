import type { LanguageTokenizer, Token } from '../types';
import { createCLikePatterns, tokenize, wordBoundary } from '../tokenizer';

const KEYWORDS = [
  // JavaScript keywords
  'async', 'await', 'break', 'case', 'catch', 'class', 'const',
  'continue', 'debugger', 'default', 'delete', 'do', 'else',
  'export', 'extends', 'finally', 'for', 'from', 'function',
  'if', 'import', 'in', 'instanceof', 'let', 'new', 'of',
  'return', 'static', 'super', 'switch', 'this', 'throw',
  'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
  'as', 'get', 'set',
  // TypeScript-specific
  'abstract', 'declare', 'enum', 'implements', 'interface',
  'namespace', 'private', 'protected', 'public', 'readonly',
  'type', 'module', 'is', 'keyof', 'infer', 'never', 'unknown',
  'asserts', 'override', 'satisfies', 'using',
];

const TYPES = [
  'any', 'boolean', 'number', 'string', 'symbol', 'bigint',
  'void', 'never', 'unknown', 'object', 'undefined', 'null',
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
  // TypeScript utility types
  'Partial', 'Required', 'Readonly', 'Record', 'Pick', 'Omit',
  'Exclude', 'Extract', 'NonNullable', 'Parameters', 'ReturnType',
  'InstanceType', 'ThisParameterType', 'OmitThisParameter',
  'ThisType', 'Awaited', 'Uppercase', 'Lowercase', 'Capitalize',
];

const patterns = createCLikePatterns({
  keywords: KEYWORDS,
  types: TYPES,
  constants: CONSTANTS,
  builtins: BUILTINS,
  extraPatterns: [
    // Decorators
    { type: 'decorator', pattern: /@[a-zA-Z_][a-zA-Z0-9_]*/ },

    // JSX/TSX tags
    { type: 'tag', pattern: /<\/?[A-Z][a-zA-Z0-9]*/ },
    { type: 'tag', pattern: /<\/?[a-z][a-z0-9-]*/ },

    // Generic type parameters (simplified)
    { type: 'type', pattern: /<[A-Z][a-zA-Z0-9]*(?:\s*,\s*[A-Z][a-zA-Z0-9]*)*>/ },

    // Type assertions
    { type: 'keyword', pattern: wordBoundary(['as', 'is']) },

    // Regex literals
    { type: 'regex', pattern: /\/(?:[^/\\]|\\.)+\/[gimsuvy]*/ },

    // Arrow function
    { type: 'keyword', pattern: /=>/ },

    // Spread operator
    { type: 'operator', pattern: /\.{3}/ },

    // Optional chaining
    { type: 'operator', pattern: /\?\.[^0-9]/ },

    // Non-null assertion
    { type: 'operator', pattern: /!\./ },

    // Nullish coalescing
    { type: 'operator', pattern: /\?\?/ },
  ],
});

export const typescript: LanguageTokenizer = {
  name: 'typescript',
  aliases: ['ts', 'tsx'],
  extensions: ['.ts', '.tsx', '.mts', '.cts'],
  tokenize: (code: string): Token[] => tokenize(code, patterns),
};
