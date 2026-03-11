import type { LanguageTokenizer, Token } from '../types';
import { createCLikePatterns, tokenize } from '../tokenizer';

const KEYWORDS = [
  'abstract', 'as', 'base', 'break', 'case', 'catch', 'checked', 'class',
  'const', 'continue', 'default', 'delegate', 'do', 'else', 'enum', 'event',
  'explicit', 'extern', 'finally', 'fixed', 'for', 'foreach', 'goto', 'if',
  'implicit', 'in', 'interface', 'internal', 'is', 'lock', 'namespace', 'new',
  'operator', 'out', 'override', 'params', 'private', 'protected', 'public',
  'readonly', 'ref', 'return', 'sealed', 'sizeof', 'stackalloc', 'static',
  'struct', 'switch', 'this', 'throw', 'try', 'typeof', 'unchecked', 'unsafe',
  'using', 'virtual', 'volatile', 'while', 'yield',
  // Contextual keywords
  'add', 'alias', 'ascending', 'async', 'await', 'by', 'descending', 'dynamic',
  'equals', 'from', 'get', 'global', 'group', 'init', 'into', 'join', 'let',
  'managed', 'nameof', 'nint', 'not', 'notnull', 'nuint', 'on', 'or', 'orderby',
  'partial', 'record', 'remove', 'required', 'scoped', 'select', 'set',
  'unmanaged', 'value', 'var', 'when', 'where', 'with', 'and', 'file',
];

const TYPES = [
  'bool', 'byte', 'char', 'decimal', 'double', 'float', 'int', 'long',
  'object', 'sbyte', 'short', 'string', 'uint', 'ulong', 'ushort', 'void',
  'dynamic', 'nint', 'nuint',
  // Common .NET types
  'String', 'Int32', 'Int64', 'Double', 'Single', 'Boolean', 'Char', 'Byte',
  'Object', 'Decimal', 'DateTime', 'TimeSpan', 'Guid', 'Type', 'Enum',
  'Array', 'List', 'Dictionary', 'HashSet', 'Queue', 'Stack', 'LinkedList',
  'IEnumerable', 'ICollection', 'IList', 'IDictionary', 'IDisposable',
  'Task', 'Action', 'Func', 'Predicate', 'Comparison', 'EventHandler',
  'Exception', 'ArgumentException', 'NullReferenceException', 'InvalidOperationException',
  'Nullable', 'Span', 'Memory', 'ReadOnlySpan', 'ReadOnlyMemory',
];

const CONSTANTS = [
  'true', 'false', 'null', 'default',
];

const BUILTINS = [
  'Console', 'Math', 'Convert', 'Environment', 'File', 'Directory', 'Path',
  'Stream', 'StreamReader', 'StreamWriter', 'StringBuilder', 'Regex',
  'Thread', 'Task', 'Parallel', 'Interlocked', 'Monitor', 'Mutex',
  'Debug', 'Trace', 'Assert',
  'WriteLine', 'ReadLine', 'Write', 'Read',
  'ToString', 'GetType', 'Equals', 'GetHashCode', 'ReferenceEquals',
  'Parse', 'TryParse', 'Format',
];

const patterns = createCLikePatterns({
  keywords: KEYWORDS,
  types: TYPES,
  constants: CONSTANTS,
  builtins: BUILTINS,
  extraPatterns: [
    // Preprocessor directives
    { type: 'decorator', pattern: /#\s*(?:if|else|elif|endif|define|undef|warning|error|line|region|endregion|pragma|nullable)[^\n]*/ },

    // Attributes
    { type: 'decorator', pattern: /\[[a-zA-Z_][a-zA-Z0-9_]*(?:\([^\)]*\))?\]/ },

    // Verbatim strings
    { type: 'string', pattern: /@"(?:[^"]|"")*"/ },

    // Raw string literals (C# 11)
    { type: 'string', pattern: /"""[\s\S]*?"""/ },

    // Interpolated strings
    { type: 'string', pattern: /\$"(?:[^"\\]|\\.|\{[^}]*\})*"/ },
    { type: 'string', pattern: /\$@"(?:[^"]|""|{{|}}|\{[^}]*\})*"/ },

    // Character literals
    { type: 'string', pattern: /'(?:[^'\\]|\\.)'/ },

    // Lambda and null operators
    { type: 'operator', pattern: /=>/ },
    { type: 'operator', pattern: /\?\?=?/ },
    { type: 'operator', pattern: /\?\./ },
    { type: 'operator', pattern: /\.\./ },
  ],
});

export const csharp: LanguageTokenizer = {
  name: 'csharp',
  aliases: ['cs', 'c#', 'dotnet'],
  extensions: ['.cs', '.csx'],
  tokenize: (code: string): Token[] => tokenize(code, patterns),
};
