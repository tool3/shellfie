import type { ParsedLine, RGB, TextSpan, TextStyle } from '../types';
import type { ParserState, Token } from './types';

const CSI_REGEX = /\x1b\[([0-9;]*)([A-Za-z])/g;
const OSC_REGEX = /\x1b\].*?(?:\x07|\x1b\\)/g;

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  const cleanedInput = input.replace(OSC_REGEX, '');

  CSI_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = CSI_REGEX.exec(cleanedInput)) !== null) {
    if (match.index > lastIndex) {
      const text = cleanedInput.slice(lastIndex, match.index);
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

    const params = match[1]
      ? match[1].split(';').map((p) => (p === '' ? 0 : parseInt(p, 10)))
      : [0];
    const finalByte = match[2];

    if (finalByte === 'm') {
      tokens.push({
        type: 'escape',
        value: match[0],
        sequence: { type: 'sgr', params, raw: match[0] },
      });
    }

    lastIndex = match.index + match[0].length;
  }

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

function applySGR(params: number[], state: ParserState): void {
  let i = 0;

  while (i < params.length) {
    const code = params[i];

    switch (code) {
      case 0:
        state.style = {};
        break;
      case 1:
        state.style.bold = true;
        break;
      case 2:
        state.style.dim = true;
        break;
      case 3:
        state.style.italic = true;
        break;
      case 4:
        state.style.underline = true;
        break;
      case 7:
        state.style.inverse = true;
        break;
      case 9:
        state.style.strikethrough = true;
        break;
      case 22:
        state.style.bold = false;
        state.style.dim = false;
        break;
      case 23:
        state.style.italic = false;
        break;
      case 24:
        state.style.underline = false;
        break;
      case 27:
        state.style.inverse = false;
        break;
      case 29:
        state.style.strikethrough = false;
        break;
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
      case 38:
        if (params[i + 1] === 5 && params[i + 2] !== undefined) {
          state.style.foreground = `ansi256-${params[i + 2]}`;
          i += 2;
        } else if (
          params[i + 1] === 2 &&
          params[i + 2] !== undefined &&
          params[i + 3] !== undefined &&
          params[i + 4] !== undefined
        ) {
          state.style.foreground = {
            r: params[i + 2],
            g: params[i + 3],
            b: params[i + 4],
          } as RGB;
          i += 4;
        }
        break;
      case 39:
        state.style.foreground = undefined;
        break;
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
      case 48:
        if (params[i + 1] === 5 && params[i + 2] !== undefined) {
          state.style.background = `ansi256-${params[i + 2]}`;
          i += 2;
        } else if (
          params[i + 1] === 2 &&
          params[i + 2] !== undefined &&
          params[i + 3] !== undefined &&
          params[i + 4] !== undefined
        ) {
          state.style.background = {
            r: params[i + 2],
            g: params[i + 3],
            b: params[i + 4],
          } as RGB;
          i += 4;
        }
        break;
      case 49:
        state.style.background = undefined;
        break;
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

  if (currentLine.length > 0 || lines.length === 0) {
    lines.push({ spans: currentLine });
  }

  return lines;
}

export function stripAnsi(input: string): string {
  return input
    .replace(CSI_REGEX, '')
    .replace(OSC_REGEX, '')
    .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
}

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
