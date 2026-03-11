import type { LanguageTokenizer, Token, TokenPattern } from '../types';
import { COMMON_PATTERNS, tokenize, wordBoundary } from '../tokenizer';

const KEYWORDS = [
  'if', 'then', 'else', 'elif', 'fi',
  'case', 'esac', 'in',
  'for', 'while', 'until', 'do', 'done',
  'function', 'return', 'exit',
  'break', 'continue',
  'local', 'export', 'readonly', 'declare', 'typeset',
  'source', 'eval', 'exec',
  'trap', 'set', 'unset', 'shift',
  'true', 'false',
];

const BUILTINS = [
  'echo', 'printf', 'read', 'cd', 'pwd', 'pushd', 'popd',
  'test', 'alias', 'unalias', 'type', 'which', 'whereis',
  'bg', 'fg', 'jobs', 'kill', 'wait',
  'umask', 'ulimit', 'times', 'history',
  'getopts', 'hash', 'help', 'let',
];

const COMMON_COMMANDS = [
  'ls', 'cat', 'grep', 'sed', 'awk', 'find', 'xargs',
  'mkdir', 'rm', 'cp', 'mv', 'touch', 'chmod', 'chown',
  'curl', 'wget', 'ssh', 'scp', 'rsync',
  'git', 'docker', 'npm', 'yarn', 'pnpm', 'node', 'python', 'pip',
  'make', 'cmake', 'cargo', 'go', 'rustc', 'gcc', 'clang',
  'apt', 'yum', 'brew', 'pacman', 'dnf',
  'sudo', 'su', 'man', 'info', 'head', 'tail', 'sort', 'uniq',
  'cut', 'tr', 'wc', 'diff', 'patch', 'tar', 'gzip', 'zip', 'unzip',
  'ps', 'top', 'htop', 'df', 'du', 'free', 'mount', 'umount',
  'systemctl', 'service', 'journalctl',
];

const patterns: TokenPattern[] = [
  // Shebang
  { type: 'comment', pattern: /^#![^\n]*/ },

  // Comments
  { type: 'comment', pattern: COMMON_PATTERNS.hashComment },

  // Here-doc (simplified - captures the whole thing)
  { type: 'string', pattern: /<<-?\s*['"]?(\w+)['"]?[\s\S]*?\n\1\b/ },

  // Strings
  { type: 'string', pattern: /\$'(?:[^'\\]|\\.)*'/ },  // ANSI-C quoting
  { type: 'string', pattern: COMMON_PATTERNS.doubleString },
  { type: 'string', pattern: COMMON_PATTERNS.singleString },

  // Variable expansions
  { type: 'variable', pattern: /\$\{[^}]+\}/ },
  { type: 'variable', pattern: /\$[a-zA-Z_][a-zA-Z0-9_]*/ },
  { type: 'variable', pattern: /\$[0-9#?$!@*-]/ },

  // Command substitution
  { type: 'builtin', pattern: /\$\([^)]+\)/ },

  // Numbers
  { type: 'number', pattern: COMMON_PATTERNS.number },

  // Keywords
  { type: 'keyword', pattern: wordBoundary(KEYWORDS) },

  // Builtins and common commands
  { type: 'builtin', pattern: wordBoundary(BUILTINS) },
  { type: 'function', pattern: wordBoundary(COMMON_COMMANDS) },

  // Operators
  { type: 'operator', pattern: /&&|\|\||[|&<>]=?|[!=]=|[-+*/%]=?|;/ },

  // Redirections
  { type: 'operator', pattern: /[0-9]*>>?|[0-9]*<<?|[0-9]*>&[0-9]*|[0-9]*<&[0-9]*/ },

  // Punctuation
  { type: 'punctuation', pattern: /[{}[\]();]/ },

  // Flags/options
  { type: 'property', pattern: /--?[a-zA-Z][a-zA-Z0-9_-]*/ },

  // Whitespace
  { type: 'text', pattern: COMMON_PATTERNS.whitespace },

  // Identifiers
  { type: 'text', pattern: /[a-zA-Z_][a-zA-Z0-9_]*/ },
];

export const bash: LanguageTokenizer = {
  name: 'bash',
  aliases: ['sh', 'shell', 'zsh', 'fish'],
  extensions: ['.sh', '.bash', '.zsh', '.fish'],
  tokenize: (code: string): Token[] => tokenize(code, patterns),
};
