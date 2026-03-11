/**
 * Language tokenizers registry
 *
 * To add a new language:
 * 1. Create a new file in this directory (e.g., `ruby.ts`)
 * 2. Export a LanguageTokenizer object
 * 3. Import and add it to the `languages` array below
 */

import type { LanguageTokenizer } from '../types';
import { bash } from './bash';
import { c, cpp } from './c';
import { csharp } from './csharp';
import { go } from './go';
import { html } from './html';
import { java } from './java';
import { javascript } from './javascript';
import { json } from './json';
import { python } from './python';
import { rust } from './rust';
import { typescript } from './typescript';

/**
 * All registered language tokenizers
 * Add new languages here
 */
export const languages: LanguageTokenizer[] = [
  bash,
  javascript,
  typescript,
  python,
  json,
  go,
  rust,
  java,
  c,
  cpp,
  csharp,
  html,
];

// Re-export individual languages for direct import
export { bash } from './bash';
export { c, cpp } from './c';
export { csharp } from './csharp';
export { go } from './go';
export { html } from './html';
export { java } from './java';
export { javascript } from './javascript';
export { json } from './json';
export { python } from './python';
export { rust } from './rust';
export { typescript } from './typescript';
