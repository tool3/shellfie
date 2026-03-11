import type { LanguageTokenizer, Token } from '../types';
import { createCLikePatterns, tokenize } from '../tokenizer';

// C keywords
const C_KEYWORDS = [
  'auto', 'break', 'case', 'const', 'continue', 'default', 'do', 'else',
  'enum', 'extern', 'for', 'goto', 'if', 'inline', 'register', 'restrict',
  'return', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union',
  'volatile', 'while', '_Alignas', '_Alignof', '_Atomic', '_Bool',
  '_Complex', '_Generic', '_Imaginary', '_Noreturn', '_Static_assert',
  '_Thread_local',
];

// C++ additional keywords
const CPP_KEYWORDS = [
  ...C_KEYWORDS,
  'alignas', 'alignof', 'and', 'and_eq', 'asm', 'bitand', 'bitor',
  'catch', 'class', 'compl', 'concept', 'consteval', 'constexpr',
  'constinit', 'co_await', 'co_return', 'co_yield', 'decltype', 'delete',
  'dynamic_cast', 'explicit', 'export', 'false', 'friend', 'mutable',
  'namespace', 'new', 'noexcept', 'not', 'not_eq', 'nullptr', 'operator',
  'or', 'or_eq', 'private', 'protected', 'public', 'reinterpret_cast',
  'requires', 'static_assert', 'static_cast', 'template', 'this', 'throw',
  'true', 'try', 'typeid', 'typename', 'using', 'virtual', 'xor', 'xor_eq',
  'override', 'final',
];

const TYPES = [
  'void', 'char', 'short', 'int', 'long', 'float', 'double', 'signed',
  'unsigned', 'bool', 'wchar_t', 'char8_t', 'char16_t', 'char32_t',
  'int8_t', 'int16_t', 'int32_t', 'int64_t',
  'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t',
  'size_t', 'ssize_t', 'ptrdiff_t', 'intptr_t', 'uintptr_t',
  'FILE', 'time_t', 'clock_t',
  // C++ STL types
  'string', 'wstring', 'vector', 'list', 'map', 'set', 'unordered_map',
  'unordered_set', 'array', 'deque', 'queue', 'stack', 'pair', 'tuple',
  'optional', 'variant', 'any', 'shared_ptr', 'unique_ptr', 'weak_ptr',
  'span', 'string_view', 'function', 'thread', 'mutex', 'atomic',
];

const CONSTANTS = [
  'true', 'false', 'NULL', 'nullptr', 'EOF', 'stdin', 'stdout', 'stderr',
];

const BUILTINS = [
  'printf', 'scanf', 'fprintf', 'fscanf', 'sprintf', 'sscanf',
  'malloc', 'calloc', 'realloc', 'free',
  'memcpy', 'memmove', 'memset', 'memcmp',
  'strlen', 'strcpy', 'strncpy', 'strcat', 'strncat', 'strcmp', 'strncmp',
  'fopen', 'fclose', 'fread', 'fwrite', 'fgets', 'fputs',
  'exit', 'abort', 'assert', 'sizeof', 'alignof',
  // C++ functions
  'cout', 'cin', 'cerr', 'endl', 'std',
  'make_shared', 'make_unique', 'make_pair', 'make_tuple',
  'move', 'forward', 'swap', 'begin', 'end', 'size',
];

const cPatterns = createCLikePatterns({
  keywords: C_KEYWORDS,
  types: TYPES,
  constants: CONSTANTS,
  builtins: BUILTINS,
  extraPatterns: [
    // Preprocessor directives
    { type: 'decorator', pattern: /#\s*(?:include|define|undef|ifdef|ifndef|if|else|elif|endif|error|pragma|line|warning)[^\n]*/ },

    // Include headers
    { type: 'string', pattern: /<[a-zA-Z0-9_./]+>/ },

    // Character literals
    { type: 'string', pattern: /L?'(?:[^'\\]|\\.)*'/ },
  ],
});

const cppPatterns = createCLikePatterns({
  keywords: CPP_KEYWORDS,
  types: TYPES,
  constants: CONSTANTS,
  builtins: BUILTINS,
  extraPatterns: [
    // Preprocessor directives
    { type: 'decorator', pattern: /#\s*(?:include|define|undef|ifdef|ifndef|if|else|elif|endif|error|pragma|line|warning)[^\n]*/ },

    // Include headers
    { type: 'string', pattern: /<[a-zA-Z0-9_./]+>/ },

    // Raw string literals (C++11)
    { type: 'string', pattern: /R"([^(]*)\([\s\S]*?\)\1"/ },

    // Character literals
    { type: 'string', pattern: /[LuU]?'(?:[^'\\]|\\.)*'/ },

    // Scope resolution
    { type: 'operator', pattern: /::/ },

    // Lambda arrow
    { type: 'operator', pattern: /->/ },
  ],
});

export const c: LanguageTokenizer = {
  name: 'c',
  aliases: ['h'],
  extensions: ['.c', '.h'],
  tokenize: (code: string): Token[] => tokenize(code, cPatterns),
};

export const cpp: LanguageTokenizer = {
  name: 'cpp',
  aliases: ['c++', 'cxx', 'hpp', 'hxx', 'cc'],
  extensions: ['.cpp', '.hpp', '.cxx', '.hxx', '.cc', '.hh', '.C', '.H'],
  tokenize: (code: string): Token[] => tokenize(code, cppPatterns),
};
