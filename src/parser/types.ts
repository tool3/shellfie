import type { TextStyle } from '../types';

export type EscapeSequenceType = 'sgr' | 'cursor' | 'erase' | 'unknown';

export interface EscapeSequence {
  type: EscapeSequenceType;
  params: number[];
  raw: string;
}

export interface ParserState {
  style: TextStyle;
}

export type TokenType = 'text' | 'escape' | 'newline';

export interface Token {
  type: TokenType;
  value: string;
  sequence?: EscapeSequence;
}
