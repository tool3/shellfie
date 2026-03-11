import type { LanguageTokenizer, Token } from '../types';
import { createCLikePatterns, tokenize } from '../tokenizer';

const KEYWORDS = [
  'abstract', 'assert', 'break', 'case', 'catch', 'class', 'const',
  'continue', 'default', 'do', 'else', 'enum', 'extends', 'final',
  'finally', 'for', 'goto', 'if', 'implements', 'import', 'instanceof',
  'interface', 'native', 'new', 'package', 'private', 'protected',
  'public', 'return', 'static', 'strictfp', 'super', 'switch',
  'synchronized', 'this', 'throw', 'throws', 'transient', 'try',
  'volatile', 'while', 'yield', 'var', 'record', 'sealed', 'permits',
  'non-sealed', 'when',
];

const TYPES = [
  'boolean', 'byte', 'char', 'double', 'float', 'int', 'long', 'short', 'void',
  'String', 'Object', 'Integer', 'Long', 'Double', 'Float', 'Boolean',
  'Character', 'Byte', 'Short', 'Void', 'Class', 'System', 'Math',
  'List', 'ArrayList', 'LinkedList', 'Map', 'HashMap', 'TreeMap',
  'Set', 'HashSet', 'TreeSet', 'Collection', 'Collections', 'Arrays',
  'Optional', 'Stream', 'Collectors', 'Function', 'Consumer', 'Supplier',
  'Predicate', 'BiFunction', 'Comparable', 'Comparator', 'Iterable', 'Iterator',
  'Exception', 'RuntimeException', 'Error', 'Throwable',
];

const CONSTANTS = [
  'true', 'false', 'null',
];

const BUILTINS = [
  'println', 'print', 'printf', 'format',
];

const patterns = createCLikePatterns({
  keywords: KEYWORDS,
  types: TYPES,
  constants: CONSTANTS,
  builtins: BUILTINS,
  extraPatterns: [
    // Annotations
    { type: 'decorator', pattern: /@[a-zA-Z_][a-zA-Z0-9_]*(?:\([^)]*\))?/ },

    // Generic type parameters
    { type: 'type', pattern: /<[A-Z][a-zA-Z0-9]*(?:\s*,\s*[A-Z][a-zA-Z0-9]*)*>/ },

    // Character literals
    { type: 'string', pattern: /'(?:[^'\\]|\\.)'/ },

    // Text blocks (Java 15+)
    { type: 'string', pattern: /"""[\s\S]*?"""/ },

    // Lambda arrow
    { type: 'operator', pattern: /->/ },

    // Method reference
    { type: 'operator', pattern: /::/ },
  ],
});

export const java: LanguageTokenizer = {
  name: 'java',
  aliases: [],
  extensions: ['.java'],
  tokenize: (code: string): Token[] => tokenize(code, patterns),
};
