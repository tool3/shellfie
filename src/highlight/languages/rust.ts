import type { LanguageTokenizer, Token } from '../types';
import { createCLikePatterns, tokenize } from '../tokenizer';

const KEYWORDS = [
  'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn',
  'else', 'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in',
  'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return',
  'self', 'Self', 'static', 'struct', 'super', 'trait', 'true', 'type',
  'unsafe', 'use', 'where', 'while', 'abstract', 'become', 'box', 'do',
  'final', 'macro', 'override', 'priv', 'typeof', 'unsized', 'virtual',
  'yield', 'try',
];

const TYPES = [
  'bool', 'char', 'str',
  'i8', 'i16', 'i32', 'i64', 'i128', 'isize',
  'u8', 'u16', 'u32', 'u64', 'u128', 'usize',
  'f32', 'f64',
  'String', 'Vec', 'Option', 'Result', 'Box', 'Rc', 'Arc', 'Cell', 'RefCell',
  'HashMap', 'HashSet', 'BTreeMap', 'BTreeSet', 'VecDeque', 'LinkedList',
  'Cow', 'Pin', 'Mutex', 'RwLock',
];

const CONSTANTS = [
  'true', 'false', 'None', 'Some', 'Ok', 'Err',
];

const BUILTINS = [
  'println', 'print', 'eprintln', 'eprint', 'format', 'panic', 'assert',
  'assert_eq', 'assert_ne', 'debug_assert', 'debug_assert_eq', 'debug_assert_ne',
  'todo', 'unimplemented', 'unreachable', 'cfg', 'env', 'file', 'line',
  'column', 'module_path', 'stringify', 'include', 'include_str', 'include_bytes',
  'vec', 'format_args', 'write', 'writeln',
];

const patterns = createCLikePatterns({
  keywords: KEYWORDS,
  types: TYPES,
  constants: CONSTANTS,
  builtins: BUILTINS,
  extraPatterns: [
    // Attributes/Macros
    { type: 'decorator', pattern: /#!\[[\s\S]*?\]/ },
    { type: 'decorator', pattern: /#\[[\s\S]*?\]/ },

    // Macro invocations (name!)
    { type: 'builtin', pattern: /[a-zA-Z_][a-zA-Z0-9_]*!/ },

    // Lifetime annotations
    { type: 'variable', pattern: /'[a-zA-Z_][a-zA-Z0-9_]*/ },

    // Raw strings
    { type: 'string', pattern: /r#*"[\s\S]*?"#*/ },

    // Byte strings
    { type: 'string', pattern: /b"(?:[^"\\]|\\.)*"/ },

    // Character literals
    { type: 'string', pattern: /'(?:[^'\\]|\\.)'/ },

    // Byte character literals
    { type: 'string', pattern: /b'(?:[^'\\]|\\.)'/ },

    // Range operators
    { type: 'operator', pattern: /\.{2,3}=?/ },

    // Fat arrow
    { type: 'operator', pattern: /=>/ },

    // Turbofish
    { type: 'operator', pattern: /::</ },
  ],
});

export const rust: LanguageTokenizer = {
  name: 'rust',
  aliases: ['rs'],
  extensions: ['.rs'],
  tokenize: (code: string): Token[] => tokenize(code, patterns),
};
