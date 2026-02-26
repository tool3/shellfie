import type { ParsedLine, RGB, TextSpan, TextStyle } from '../types';
import type { ParserState, Token } from './types';

const CSI_REGEX = /\x1b\[([0-9;]*)([A-Za-z])/g;
const OSC_REGEX = /\x1b\].*?(?:\x07|\x1b\\)/g;

const splitTextIntoTokens = (text: string): Token[] => {
  const tokens: Token[] = [];
  const parts = text.split('\n');

  parts.forEach((part, i) => {
    if (part.length > 0) {
      tokens.push({ type: 'text', value: part });
    }
    if (i < parts.length - 1) {
      tokens.push({ type: 'newline', value: '\n' });
    }
  });

  return tokens;
};

const tokenize = (input: string): Token[] => {
  const tokens: Token[] = [];
  const cleanedInput = input.replace(OSC_REGEX, '');
  let lastIndex = 0;

  CSI_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = CSI_REGEX.exec(cleanedInput)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(...splitTextIntoTokens(cleanedInput.slice(lastIndex, match.index)));
    }

    const params = match[1]
      ? match[1].split(';').map((p) => (p === '' ? 0 : parseInt(p, 10)))
      : [0];

    if (match[2] === 'm') {
      tokens.push({
        type: 'escape',
        value: match[0],
        sequence: { type: 'sgr', params, raw: match[0] },
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < cleanedInput.length) {
    tokens.push(...splitTextIntoTokens(cleanedInput.slice(lastIndex)));
  }

  return tokens;
};

const isColorCode = (code: number, start: number, end: number): boolean =>
  code >= start && code <= end;

const applySGR = (params: number[], state: ParserState): void => {
  let i = 0;

  while (i < params.length) {
    const code = params[i];

    // Reset
    if (code === 0) {
      state.style = {};
    }
    // Text attributes on
    else if (code === 1) state.style.bold = true;
    else if (code === 2) state.style.dim = true;
    else if (code === 3) state.style.italic = true;
    else if (code === 4) state.style.underline = true;
    else if (code === 7) state.style.inverse = true;
    else if (code === 9) state.style.strikethrough = true;
    // Text attributes off
    else if (code === 22) { state.style.bold = false; state.style.dim = false; }
    else if (code === 23) state.style.italic = false;
    else if (code === 24) state.style.underline = false;
    else if (code === 27) state.style.inverse = false;
    else if (code === 29) state.style.strikethrough = false;
    // Standard foreground colors (30-37)
    else if (isColorCode(code, 30, 37)) {
      state.style.foreground = `ansi${code - 30}`;
    }
    // Extended foreground color (38)
    else if (code === 38) {
      i += handleExtendedColor(params, i, (color) => { state.style.foreground = color; });
    }
    // Default foreground (39)
    else if (code === 39) state.style.foreground = undefined;
    // Standard background colors (40-47)
    else if (isColorCode(code, 40, 47)) {
      state.style.background = `ansi${code - 40}`;
    }
    // Extended background color (48)
    else if (code === 48) {
      i += handleExtendedColor(params, i, (color) => { state.style.background = color; });
    }
    // Default background (49)
    else if (code === 49) state.style.background = undefined;
    // Bright foreground colors (90-97)
    else if (isColorCode(code, 90, 97)) {
      state.style.foreground = `ansi${code - 90 + 8}`;
    }
    // Bright background colors (100-107)
    else if (isColorCode(code, 100, 107)) {
      state.style.background = `ansi${code - 100 + 8}`;
    }

    i++;
  }
};

const handleExtendedColor = (
  params: number[],
  i: number,
  setColor: (color: string | RGB) => void
): number => {
  // 256-color mode: 38;5;n or 48;5;n
  if (params[i + 1] === 5 && params[i + 2] !== undefined) {
    setColor(`ansi256-${params[i + 2]}`);
    return 2;
  }
  // True color mode: 38;2;r;g;b or 48;2;r;g;b
  if (
    params[i + 1] === 2 &&
    params[i + 2] !== undefined &&
    params[i + 3] !== undefined &&
    params[i + 4] !== undefined
  ) {
    setColor({ r: params[i + 2], g: params[i + 3], b: params[i + 4] });
    return 4;
  }
  return 0;
};

const cloneStyle = (style: TextStyle): TextStyle => {
  const clone: TextStyle = {};

  if (style.foreground !== undefined) {
    clone.foreground = typeof style.foreground === 'object'
      ? { ...style.foreground }
      : style.foreground;
  }
  if (style.background !== undefined) {
    clone.background = typeof style.background === 'object'
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
};

export const parseAnsi = (input: string): ParsedLine[] => {
  const tokens = tokenize(input);
  const state: ParserState = { style: {} };
  const lines: ParsedLine[] = [];
  let currentLine: TextSpan[] = [];

  for (const token of tokens) {
    if (token.type === 'text') {
      currentLine.push({ text: token.value, style: cloneStyle(state.style) });
    } else if (token.type === 'escape' && token.sequence?.type === 'sgr') {
      applySGR(token.sequence.params, state);
    } else if (token.type === 'newline') {
      lines.push({ spans: currentLine });
      currentLine = [];
    }
  }

  if (currentLine.length > 0 || lines.length === 0) {
    lines.push({ spans: currentLine });
  }

  return lines;
};

export const stripAnsi = (input: string): string =>
  input
    .replace(CSI_REGEX, '')
    .replace(OSC_REGEX, '')
    .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');

export const getMaxWidth = (lines: ParsedLine[]): number =>
  lines.reduce((max, line) => {
    const lineWidth = line.spans.reduce((sum, span) => sum + span.text.length, 0);
    return Math.max(max, lineWidth);
  }, 0);

export type { EscapeSequence, ParserState, Token } from './types';
