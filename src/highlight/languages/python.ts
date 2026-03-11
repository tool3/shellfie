import type { LanguageTokenizer, Token, TokenPattern } from '../types';
import { COMMON_PATTERNS, tokenize, wordBoundary } from '../tokenizer';

const KEYWORDS = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else',
  'except', 'finally', 'for', 'from', 'global', 'if', 'import',
  'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise',
  'return', 'try', 'while', 'with', 'yield', 'match', 'case',
];

const BUILTINS = [
  'abs', 'all', 'any', 'ascii', 'bin', 'bool', 'bytearray', 'bytes',
  'callable', 'chr', 'classmethod', 'compile', 'complex', 'delattr',
  'dict', 'dir', 'divmod', 'enumerate', 'eval', 'exec', 'filter',
  'float', 'format', 'frozenset', 'getattr', 'globals', 'hasattr',
  'hash', 'help', 'hex', 'id', 'input', 'int', 'isinstance', 'issubclass',
  'iter', 'len', 'list', 'locals', 'map', 'max', 'memoryview', 'min',
  'next', 'object', 'oct', 'open', 'ord', 'pow', 'print', 'property',
  'range', 'repr', 'reversed', 'round', 'set', 'setattr', 'slice',
  'sorted', 'staticmethod', 'str', 'sum', 'super', 'tuple', 'type',
  'vars', 'zip', '__import__',
];

const TYPES = [
  'int', 'float', 'str', 'bool', 'list', 'dict', 'set', 'tuple',
  'bytes', 'bytearray', 'complex', 'frozenset', 'object', 'type',
  'None', 'Callable', 'Optional', 'Union', 'Any', 'List', 'Dict',
  'Set', 'Tuple', 'Type', 'Sequence', 'Mapping', 'Iterable', 'Iterator',
];

const patterns: TokenPattern[] = [
  // Comments
  { type: 'comment', pattern: COMMON_PATTERNS.hashComment },

  // Docstrings (triple-quoted strings)
  { type: 'string', pattern: /"""[\s\S]*?"""/ },
  { type: 'string', pattern: /'''[\s\S]*?'''/ },

  // F-strings (simplified)
  { type: 'string', pattern: /f"(?:[^"\\]|\\.)*"/ },
  { type: 'string', pattern: /f'(?:[^'\\]|\\.)*'/ },

  // Raw strings
  { type: 'string', pattern: /r"(?:[^"\\]|\\.)*"/ },
  { type: 'string', pattern: /r'(?:[^'\\]|\\.)*'/ },

  // Byte strings
  { type: 'string', pattern: /b"(?:[^"\\]|\\.)*"/ },
  { type: 'string', pattern: /b'(?:[^'\\]|\\.)*'/ },

  // Regular strings
  { type: 'string', pattern: COMMON_PATTERNS.doubleString },
  { type: 'string', pattern: COMMON_PATTERNS.singleString },

  // Decorators
  { type: 'decorator', pattern: /@[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*/ },

  // Numbers
  { type: 'number', pattern: COMMON_PATTERNS.hexNumber },
  { type: 'number', pattern: COMMON_PATTERNS.binaryNumber },
  { type: 'number', pattern: COMMON_PATTERNS.octalNumber },
  { type: 'number', pattern: /\b\d+\.?\d*(?:[eE][+-]?\d+)?j?\b/ },  // Complex numbers

  // Keywords
  { type: 'keyword', pattern: wordBoundary(KEYWORDS) },

  // Built-ins
  { type: 'builtin', pattern: wordBoundary(BUILTINS) },

  // Types (for type hints)
  { type: 'type', pattern: wordBoundary(TYPES) },

  // Magic methods/attributes
  { type: 'builtin', pattern: /__[a-zA-Z_][a-zA-Z0-9_]*__/ },

  // Self and cls
  { type: 'variable', pattern: /\b(self|cls)\b/ },

  // Operators
  { type: 'operator', pattern: /->|:=|[+\-*/%@=<>!&|^~]=?|\*\*|\/\/|<<|>>/ },

  // Punctuation
  { type: 'punctuation', pattern: /[{}[\]();,.:@]/ },

  // Whitespace
  { type: 'text', pattern: COMMON_PATTERNS.whitespace },

  // Identifiers
  { type: 'text', pattern: /[a-zA-Z_][a-zA-Z0-9_]*/ },
];

export const python: LanguageTokenizer = {
  name: 'python',
  aliases: ['py', 'python3'],
  extensions: ['.py', '.pyw', '.pyi'],
  tokenize: (code: string): Token[] => tokenize(code, patterns),
};
