/**
 * ANSI escape code parser
 *
 * Converts raw terminal output with ANSI escape sequences into
 * structured data (ParsedLine[]) for rendering.
 */

import type { ParsedLine, RGB, TextSpan, TextStyle } from '../types';
import type { ParserState, Token } from './types';

// ANSI escape sequence patterns
const ESC = '\x1b';
const CSI = `${ESC}[`;

// Regex to match CSI sequences: ESC [ <params> <final byte>
const CSI_REGEX = /\x1b\[([0-9;]*)([A-Za-z])/g;

// Regex to match OSC sequences (Operating System Command): ESC ] ... BEL/ST
const OSC_REGEX = /\x1b\].*?(?:\x07|\x1b\\)/g;

/**
 * Tokenize input string into text, escape sequences, and newlines
 */
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;

  // Remove OSC sequences (window titles, etc.) as we don't render them
  const cleanedInput = input.replace(OSC_REGEX, '');

  // Reset regex state
  CSI_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;

  while ((match = CSI_REGEX.exec(cleanedInput)) !== null) {
    // Add any text before this sequence
    if (match.index > lastIndex) {
      const text = cleanedInput.slice(lastIndex, match.index);
      // Split text by newlines
      const parts = text.split('\n');
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].length > 0) {
          tokens.push({ type: 'text', value: parts[i] });
        }
        if (i < parts.length - 1) {
          tokens.push({ type: 'newline', value: '\n' });
        }
      }
    }

    // Parse the escape sequence
    const params = match[1]
      ? match[1].split(';').map((p) => (p === '' ? 0 : parseInt(p, 10)))
      : [0];
    const finalByte = match[2];

    // We only care about SGR sequences (m = Select Graphic Rendition)
    if (finalByte === 'm') {
      tokens.push({
        type: 'escape',
        value: match[0],
        sequence: {
          type: 'sgr',
          params,
          raw: match[0],
        },
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < cleanedInput.length) {
    const text = cleanedInput.slice(lastIndex);
    const parts = text.split('\n');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].length > 0) {
        tokens.push({ type: 'text', value: parts[i] });
      }
      if (i < parts.length - 1) {
        tokens.push({ type: 'newline', value: '\n' });
      }
    }
  }

  return tokens;
}

/**
 * Apply SGR (Select Graphic Rendition) parameters to current style
 */
function applySGR(params: number[], state: ParserState): void {
  let i = 0;

  while (i < params.length) {
    const code = params[i];

    switch (code) {
      // Reset
      case 0:
        state.style = {};
        break;

      // Bold
      case 1:
        state.style.bold = true;
        break;

      // Dim
      case 2:
        state.style.dim = true;
        break;

      // Italic
      case 3:
        state.style.italic = true;
        break;

      // Underline
      case 4:
        state.style.underline = true;
        break;

      // Inverse/reverse video
      case 7:
        state.style.inverse = true;
        break;

      // Strikethrough
      case 9:
        state.style.strikethrough = true;
        break;

      // Normal intensity (not bold, not dim)
      case 22:
        state.style.bold = false;
        state.style.dim = false;
        break;

      // Not italic
      case 23:
        state.style.italic = false;
        break;

      // Not underlined
      case 24:
        state.style.underline = false;
        break;

      // Not inverse
      case 27:
        state.style.inverse = false;
        break;

      // Not strikethrough
      case 29:
        state.style.strikethrough = false;
        break;

      // Standard foreground colors (30-37)
      case 30:
      case 31:
      case 32:
      case 33:
      case 34:
      case 35:
      case 36:
      case 37:
        state.style.foreground = `ansi${code - 30}`;
        break;

      // Extended foreground color
      case 38:
        if (params[i + 1] === 5 && params[i + 2] !== undefined) {
          // 256-color mode: 38;5;n
          state.style.foreground = `ansi256-${params[i + 2]}`;
          i += 2;
        } else if (
          params[i + 1] === 2 &&
          params[i + 2] !== undefined &&
          params[i + 3] !== undefined &&
          params[i + 4] !== undefined
        ) {
          // 24-bit color mode: 38;2;r;g;b
          state.style.foreground = {
            r: params[i + 2],
            g: params[i + 3],
            b: params[i + 4],
          } as RGB;
          i += 4;
        }
        break;

      // Default foreground
      case 39:
        state.style.foreground = undefined;
        break;

      // Standard background colors (40-47)
      case 40:
      case 41:
      case 42:
      case 43:
      case 44:
      case 45:
      case 46:
      case 47:
        state.style.background = `ansi${code - 40}`;
        break;

      // Extended background color
      case 48:
        if (params[i + 1] === 5 && params[i + 2] !== undefined) {
          // 256-color mode: 48;5;n
          state.style.background = `ansi256-${params[i + 2]}`;
          i += 2;
        } else if (
          params[i + 1] === 2 &&
          params[i + 2] !== undefined &&
          params[i + 3] !== undefined &&
          params[i + 4] !== undefined
        ) {
          // 24-bit color mode: 48;2;r;g;b
          state.style.background = {
            r: params[i + 2],
            g: params[i + 3],
            b: params[i + 4],
          } as RGB;
          i += 4;
        }
        break;

      // Default background
      case 49:
        state.style.background = undefined;
        break;

      // Bright foreground colors (90-97)
      case 90:
      case 91:
      case 92:
      case 93:
      case 94:
      case 95:
      case 96:
      case 97:
        state.style.foreground = `ansi${code - 90 + 8}`;
        break;

      // Bright background colors (100-107)
      case 100:
      case 101:
      case 102:
      case 103:
      case 104:
      case 105:
      case 106:
      case 107:
        state.style.background = `ansi${code - 100 + 8}`;
        break;
    }

    i++;
  }
}

/**
 * Clone a style object
 */
function cloneStyle(style: TextStyle): TextStyle {
  const clone: TextStyle = {};

  if (style.foreground !== undefined) {
    clone.foreground =
      typeof style.foreground === 'object'
        ? { ...style.foreground }
        : style.foreground;
  }
  if (style.background !== undefined) {
    clone.background =
      typeof style.background === 'object'
        ? { ...style.background }
        : style.background;
  }
  if (style.bold) clone.bold = true;
  if (style.italic) clone.italic = true;
  if (style.underline) clone.underline = true;
  if (style.strikethrough) clone.strikethrough = true;
  if (style.dim) clone.dim = true;
  if (style.inverse) clone.inverse = true;

  return clone;
}

/**
 * Check if a style has any non-default attributes
 */
function hasStyleAttributes(style: TextStyle): boolean {
  return (
    style.foreground !== undefined ||
    style.background !== undefined ||
    style.bold === true ||
    style.italic === true ||
    style.underline === true ||
    style.strikethrough === true ||
    style.dim === true ||
    style.inverse === true
  );
}

/**
 * Parse ANSI-encoded terminal output into structured lines
 */
export function parseAnsi(input: string): ParsedLine[] {
  const tokens = tokenize(input);
  const lines: ParsedLine[] = [];
  let currentLine: TextSpan[] = [];
  const state: ParserState = { style: {} };

  for (const token of tokens) {
    switch (token.type) {
      case 'text':
        currentLine.push({
          text: token.value,
          style: cloneStyle(state.style),
        });
        break;

      case 'escape':
        if (token.sequence?.type === 'sgr') {
          applySGR(token.sequence.params, state);
        }
        break;

      case 'newline':
        lines.push({ spans: currentLine });
        currentLine = [];
        break;
    }
  }

  // Don't forget the last line
  if (currentLine.length > 0 || lines.length === 0) {
    lines.push({ spans: currentLine });
  }

  return lines;
}

/**
 * Strip all ANSI escape codes from input
 */
export function stripAnsi(input: string): string {
  return input
    .replace(CSI_REGEX, '')
    .replace(OSC_REGEX, '')
    .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
}

/**
 * Get the maximum line width (in characters) from parsed lines
 */
export function getMaxWidth(lines: ParsedLine[]): number {
  let maxWidth = 0;

  for (const line of lines) {
    let lineWidth = 0;
    for (const span of line.spans) {
      lineWidth += span.text.length;
    }
    if (lineWidth > maxWidth) {
      maxWidth = lineWidth;
    }
  }

  return maxWidth;
}

export type { EscapeSequence, ParserState, Token } from './types';

