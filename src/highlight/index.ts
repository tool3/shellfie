/**
 * Syntax Highlighting Module
 *
 * Zero-dependency syntax highlighting that outputs ANSI-colored strings
 * for use with shellfie's SVG renderer.
 */

import { languages } from './languages';
import type { DetectionResult, LanguageTokenizer, Token, TokenType } from './types';
import { ANSI_RESET, TOKEN_TO_ANSI } from './types';

/**
 * Language registry - maps names/aliases to tokenizers
 */
const registry = new Map<string, LanguageTokenizer>();

// Build registry from all languages
for (const lang of languages) {
  registry.set(lang.name.toLowerCase(), lang);
  for (const alias of lang.aliases) {
    registry.set(alias.toLowerCase(), lang);
  }
}

/**
 * Get a language tokenizer by name or alias
 */
export function getLanguage(name: string): LanguageTokenizer | undefined {
  return registry.get(name.toLowerCase());
}

/**
 * Get all registered language names
 */
export function getLanguageNames(): string[] {
  return languages.map(l => l.name);
}

/**
 * Get a language tokenizer by file extension
 */
export function getLanguageByExtension(ext: string): LanguageTokenizer | undefined {
  const normalizedExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  return languages.find(lang => lang.extensions.includes(normalizedExt));
}

/**
 * Detection patterns for auto-detection
 */
const DETECTION_PATTERNS: { language: string; patterns: RegExp[]; weight: number }[] = [
  // Bash/Shell
  {
    language: 'bash',
    patterns: [
      /^#!.*\b(?:ba)?sh\b/m,                    // Bash/sh shebang
      /^#!.*\bzsh\b/m,                          // Zsh shebang
      /^#!.*\bfish\b/m,                         // Fish shebang
      /\$\([^)]+\)/,                            // Command substitution
      /\$\{[^}]+\}/,                            // Variable expansion
      /\b(echo|export|source|alias)\b/,         // Common builtins
      /\b(if|then|else|fi|for|do|done)\b/,      // Shell keywords
      /\|\s*(?:grep|sed|awk|xargs)\b/,          // Pipe to common tools
    ],
    weight: 1,
  },

  // TypeScript (check before JavaScript due to overlap)
  {
    language: 'typescript',
    patterns: [
      /:\s*(?:string|number|boolean|void|any|unknown|never)\b/,  // Type annotations
      /\binterface\s+\w+/,                                        // Interface
      /\btype\s+\w+\s*=/,                                         // Type alias
      /<\w+(?:\s*,\s*\w+)*>/,                                     // Generic types
      /\bas\s+\w+/,                                                // Type assertion
      /\?:/,                                                       // Optional property
    ],
    weight: 2,
  },

  // JavaScript
  {
    language: 'javascript',
    patterns: [
      /^#!.*\bnode\b/m,                         // Node.js shebang
      /^#!.*\bbun\b/m,                          // Bun shebang
      /^#!.*\bdeno\b/m,                         // Deno shebang
      /\b(const|let|var)\s+\w+\s*=/,            // Variable declarations
      /\bfunction\s+\w+\s*\(/,                  // Function declarations
      /=>\s*[{(]/,                              // Arrow functions
      /\bclass\s+\w+/,                          // Class declarations
      /\b(import|export)\s+/,                   // ES modules
      /\b(async|await)\b/,                      // Async/await
      /console\.\w+/,                           // Console usage
    ],
    weight: 1,
  },

  // Python
  {
    language: 'python',
    patterns: [
      /^#!.*python/m,                           // Python shebang
      /\bdef\s+\w+\s*\(/,                       // Function def
      /\bclass\s+\w+[:(]/,                      // Class def
      /\bimport\s+\w+/,                         // Import
      /\bfrom\s+\w+\s+import\b/,                // From import
      /\b(?:if|elif|else|while|for|with|try|except|finally)\b[^{]*:\s*$/m, // Python control flow with colon
      /__\w+__/,                                // Magic methods
      /\bself\./,                               // Self reference
      /\bprint\s*\(/,                           // Print function
      /\b(?:True|False|None)\b/,                // Python literals
    ],
    weight: 1,
  },

  // JSON
  {
    language: 'json',
    patterns: [
      /^\s*\{[\s\S]*\}\s*$/,                    // Object
      /^\s*\[[\s\S]*\]\s*$/,                    // Array
      /"[^"]*"\s*:\s*(?:"[^"]*"|[\d.]+|true|false|null|\{|\[)/, // Key-value
    ],
    weight: 1,
  },

  // Go
  {
    language: 'go',
    patterns: [
      /\bpackage\s+\w+/,                        // Package declaration
      /\bfunc\s+(?:\(\w+\s+\*?\w+\))?\s*\w+/,   // Function/method
      /\bgo\s+\w+/,                             // Goroutine
      /:=\s*/,                                  // Short declaration
      /\bchan\s+/,                              // Channel
      /\bdefer\s+/,                             // Defer
      /\bstruct\s*\{/,                          // Struct
    ],
    weight: 1,
  },

  // Rust
  {
    language: 'rust',
    patterns: [
      /\bfn\s+\w+/,                             // Function
      /\blet\s+(?:mut\s+)?\w+/,                 // Let binding
      /\bimpl\s+(?:<[^>]+>\s*)?\w+/,            // Impl block
      /\bpub\s+(?:fn|struct|enum|mod)\b/,       // Public items
      /\bmatch\s+\w+\s*\{/,                     // Match expression
      /->|=>/,                                  // Arrows
      /&(?:mut\s+)?'?\w+/,                      // References/lifetimes
      /!$/m,                                    // Macro calls
    ],
    weight: 1,
  },

  // Java
  {
    language: 'java',
    patterns: [
      /\bpublic\s+(?:static\s+)?(?:void|class|interface)\b/, // Public decl
      /\bpackage\s+[\w.]+;/,                    // Package
      /\bimport\s+[\w.*]+;/,                    // Import
      /\bSystem\.out\./,                        // System.out
      /@\w+(?:\([^)]*\))?/,                     // Annotations
      /\bextends\s+\w+/,                        // Extends
      /\bimplements\s+\w+/,                     // Implements
    ],
    weight: 1,
  },

  // C/C++
  {
    language: 'cpp',
    patterns: [
      /#include\s*[<"]/,                        // Include
      /#define\s+\w+/,                          // Define
      /\bint\s+main\s*\(/,                      // Main function
      /\bstd::/,                                // STL namespace
      /\btemplate\s*</,                         // Templates
      /\bnamespace\s+\w+/,                      // Namespace
      /\bvirtual\s+/,                           // Virtual
      /->/,                                     // Pointer member access
      /\bnullptr\b/,                            // nullptr
    ],
    weight: 1,
  },

  // C (lower weight than C++ due to overlap)
  {
    language: 'c',
    patterns: [
      /#include\s*[<"]/,                        // Include
      /\bint\s+main\s*\(/,                      // Main function
      /\bprintf\s*\(/,                          // printf
      /\bscanf\s*\(/,                           // scanf
      /\bmalloc\s*\(/,                          // malloc
      /\bfree\s*\(/,                            // free
      /\bNULL\b/,                               // NULL
    ],
    weight: 0.5,
  },

  // C#
  {
    language: 'csharp',
    patterns: [
      /\busing\s+[\w.]+;/,                      // Using directive
      /\bnamespace\s+[\w.]+/,                   // Namespace
      /\bpublic\s+(?:partial\s+)?class\b/,      // Class declaration
      /\bvar\s+\w+\s*=/,                        // Var declaration
      /\basync\s+Task/,                         // Async Task
      /\bawait\s+/,                             // Await
      /\bLinq\b|\.Select\(|\.Where\(/,          // LINQ
      /\bConsole\.Write/,                       // Console
    ],
    weight: 1,
  },

  // HTML/XML
  {
    language: 'html',
    patterns: [
      /<!DOCTYPE\s+html/i,                      // HTML doctype
      /<html[\s>]/i,                            // HTML tag
      /<head[\s>]/i,                            // Head tag
      /<body[\s>]/i,                            // Body tag
      /<div[\s>]/i,                             // Div tag
      /<span[\s>]/i,                            // Span tag
      /<\/\w+>/,                                // Closing tags
      /<\w+[^>]*\/?>/,                          // Self-closing or opening tags
      /\s(?:class|id|href|src)="/,              // Common attributes
    ],
    weight: 1,
  },
];

/**
 * Auto-detect the language of a code snippet
 * Returns the best match or undefined if no confident match
 */
export function detectLanguage(code: string): DetectionResult | undefined {
  const scores = new Map<string, number>();

  for (const { language, patterns, weight } of DETECTION_PATTERNS) {
    let matchCount = 0;
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      const score = (matchCount / patterns.length) * weight;
      const existing = scores.get(language) ?? 0;
      scores.set(language, Math.max(existing, score));
    }
  }

  // Find the best match
  let bestLang: string | undefined;
  let bestScore = 0;

  for (const [lang, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }

  // Require minimum confidence
  if (bestLang && bestScore >= 0.15) {
    return { language: bestLang, confidence: bestScore };
  }

  return undefined;
}

/**
 * Convert tokens to ANSI-colored string
 */
export function tokensToAnsi(tokens: Token[]): string {
  let result = '';

  for (const token of tokens) {
    const ansiCode = TOKEN_TO_ANSI[token.type];
    if (ansiCode) {
      result += ansiCode + token.value + ANSI_RESET;
    } else {
      result += token.value;
    }
  }

  return result;
}

// Matches CSI (e.g. \x1b[31m) and OSC (e.g. \x1b]…\x07) sequences so we can
// passthrough pre-styled regions during highlighting instead of tokenizing them.
const ANSI_PASSTHROUGH_REGEX = /\x1b\[[0-9;]*[A-Za-z]|\x1b\].*?(?:\x07|\x1b\\)/g;

/**
 * Highlight code with syntax highlighting, returning ANSI-colored string.
 *
 * Preserves any ANSI escape sequences already present in the input — useful
 * for hybrid content where part of the string is pre-styled (e.g. gradient
 * art) and the surrounding text should be syntax-highlighted as code.
 *
 * @param code - The source code to highlight
 * @param language - Language name, alias, or 'auto' for auto-detection
 * @returns ANSI-colored string ready for shellfie
 */
export function highlight(code: string, language: string = 'auto'): string {
  let tokenizer: LanguageTokenizer | undefined;

  if (language === 'auto') {
    // Detect against ANSI-stripped code so SGR digits don't bias detection.
    const stripped = code.replace(ANSI_PASSTHROUGH_REGEX, '');
    const detected = detectLanguage(stripped);
    if (detected) {
      tokenizer = getLanguage(detected.language);
    }
  } else {
    tokenizer = getLanguage(language);
  }

  // If no tokenizer found, return code as-is
  if (!tokenizer) {
    return code;
  }

  // Fast path: no pre-existing ANSI — tokenize the whole input.
  if (!code.includes('\x1b')) {
    return tokensToAnsi(tokenizer.tokenize(code));
  }

  // Hybrid path: tokenize plain segments, passthrough ANSI sequences verbatim.
  let result = '';
  let lastIndex = 0;
  ANSI_PASSTHROUGH_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ANSI_PASSTHROUGH_REGEX.exec(code)) !== null) {
    if (match.index > lastIndex) {
      result += tokensToAnsi(tokenizer.tokenize(code.slice(lastIndex, match.index)));
    }
    result += match[0];
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < code.length) {
    result += tokensToAnsi(tokenizer.tokenize(code.slice(lastIndex)));
  }

  return result;
}

// Export types
export type { DetectionResult, LanguageTokenizer, Token, TokenPattern, TokenType } from './types';
export { ANSI_RESET, TOKEN_TO_ANSI } from './types';

// Export tokenizer utilities for custom language implementations
export { COMMON_PATTERNS, createCLikePatterns, tokenize, wordBoundary } from './tokenizer';

// Export languages
export { languages } from './languages';
