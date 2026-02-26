/**
 * Parser-specific types
 */

import type { TextStyle } from '../types.js';

/** ANSI escape sequence types */
export type EscapeSequenceType =
  | 'sgr'      // Select Graphic Rendition (colors, styles)
  | 'cursor'   // Cursor movement
  | 'erase'    // Erase commands
  | 'unknown'; // Unknown/unsupported sequences

/** Parsed escape sequence */
export interface EscapeSequence {
  type: EscapeSequenceType;
  params: number[];
  raw: string;
}

/** Parser state for tracking current style */
export interface ParserState {
  style: TextStyle;
}

/** Token types during parsing */
export type TokenType = 'text' | 'escape' | 'newline';

export interface Token {
  type: TokenType;
  value: string;
  sequence?: EscapeSequence;
}
