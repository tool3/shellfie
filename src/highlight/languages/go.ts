import type { LanguageTokenizer, Token } from '../types';
import { createCLikePatterns, tokenize, wordBoundary } from '../tokenizer';

const KEYWORDS = [
  'break', 'case', 'chan', 'const', 'continue', 'default', 'defer',
  'else', 'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import',
  'interface', 'map', 'package', 'range', 'return', 'select', 'struct',
  'switch', 'type', 'var',
];

const TYPES = [
  'bool', 'byte', 'complex64', 'complex128', 'error', 'float32', 'float64',
  'int', 'int8', 'int16', 'int32', 'int64', 'rune', 'string',
  'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uintptr', 'any',
];

const CONSTANTS = [
  'true', 'false', 'nil', 'iota',
];

const BUILTINS = [
  'append', 'cap', 'close', 'complex', 'copy', 'delete', 'imag',
  'len', 'make', 'new', 'panic', 'print', 'println', 'real', 'recover',
  'min', 'max', 'clear',
];

const patterns = createCLikePatterns({
  keywords: KEYWORDS,
  types: TYPES,
  constants: CONSTANTS,
  builtins: BUILTINS,
  extraPatterns: [
    // Raw string literals
    { type: 'string', pattern: /`[^`]*`/ },

    // Channel operator
    { type: 'operator', pattern: /<-/ },

    // Short variable declaration
    { type: 'operator', pattern: /:=/ },

    // Package names (simplified - after import)
    { type: 'string', pattern: /(?<=import\s+)"[^"]*"/ },
    { type: 'string', pattern: /(?<=import\s+\(\s*(?:[^)]*\n)*\s*)"[^"]*"/ },
  ],
});

export const go: LanguageTokenizer = {
  name: 'go',
  aliases: ['golang'],
  extensions: ['.go'],
  tokenize: (code: string): Token[] => tokenize(code, patterns),
};
