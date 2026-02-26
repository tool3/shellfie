import { describe, it, expect } from 'vitest';
import { parseAnsi, stripAnsi, getMaxWidth } from './index.js';

describe('parseAnsi', () => {
  it('parses plain text', () => {
    const result = parseAnsi('Hello World');
    expect(result).toHaveLength(1);
    expect(result[0].spans).toHaveLength(1);
    expect(result[0].spans[0].text).toBe('Hello World');
    expect(result[0].spans[0].style).toEqual({});
  });

  it('handles multiple lines', () => {
    const result = parseAnsi('Line 1\nLine 2\nLine 3');
    expect(result).toHaveLength(3);
    expect(result[0].spans[0].text).toBe('Line 1');
    expect(result[1].spans[0].text).toBe('Line 2');
    expect(result[2].spans[0].text).toBe('Line 3');
  });

  it('handles empty input', () => {
    const result = parseAnsi('');
    expect(result).toHaveLength(1);
    expect(result[0].spans).toHaveLength(0);
  });

  it('parses standard foreground colors (30-37)', () => {
    const result = parseAnsi('\x1b[31mRed\x1b[0m');
    expect(result[0].spans).toHaveLength(1);
    expect(result[0].spans[0].text).toBe('Red');
    expect(result[0].spans[0].style.foreground).toBe('ansi1');
  });

  it('parses bright foreground colors (90-97)', () => {
    const result = parseAnsi('\x1b[91mBright Red\x1b[0m');
    expect(result[0].spans[0].style.foreground).toBe('ansi9');
  });

  it('parses standard background colors (40-47)', () => {
    const result = parseAnsi('\x1b[44mBlue BG\x1b[0m');
    expect(result[0].spans[0].style.background).toBe('ansi4');
  });

  it('parses bright background colors (100-107)', () => {
    const result = parseAnsi('\x1b[104mBright Blue BG\x1b[0m');
    expect(result[0].spans[0].style.background).toBe('ansi12');
  });

  it('parses 256-color foreground', () => {
    const result = parseAnsi('\x1b[38;5;196mColor 196\x1b[0m');
    expect(result[0].spans[0].style.foreground).toBe('ansi256-196');
  });

  it('parses 256-color background', () => {
    const result = parseAnsi('\x1b[48;5;21mColor 21 BG\x1b[0m');
    expect(result[0].spans[0].style.background).toBe('ansi256-21');
  });

  it('parses 24-bit RGB foreground', () => {
    const result = parseAnsi('\x1b[38;2;255;128;64mRGB\x1b[0m');
    expect(result[0].spans[0].style.foreground).toEqual({ r: 255, g: 128, b: 64 });
  });

  it('parses 24-bit RGB background', () => {
    const result = parseAnsi('\x1b[48;2;0;128;255mRGB BG\x1b[0m');
    expect(result[0].spans[0].style.background).toEqual({ r: 0, g: 128, b: 255 });
  });

  it('parses bold', () => {
    const result = parseAnsi('\x1b[1mBold\x1b[0m');
    expect(result[0].spans[0].style.bold).toBe(true);
  });

  it('parses italic', () => {
    const result = parseAnsi('\x1b[3mItalic\x1b[0m');
    expect(result[0].spans[0].style.italic).toBe(true);
  });

  it('parses underline', () => {
    const result = parseAnsi('\x1b[4mUnderline\x1b[0m');
    expect(result[0].spans[0].style.underline).toBe(true);
  });

  it('parses strikethrough', () => {
    const result = parseAnsi('\x1b[9mStrikethrough\x1b[0m');
    expect(result[0].spans[0].style.strikethrough).toBe(true);
  });

  it('parses dim', () => {
    const result = parseAnsi('\x1b[2mDim\x1b[0m');
    expect(result[0].spans[0].style.dim).toBe(true);
  });

  it('parses inverse', () => {
    const result = parseAnsi('\x1b[7mInverse\x1b[0m');
    expect(result[0].spans[0].style.inverse).toBe(true);
  });

  it('resets all styles', () => {
    const result = parseAnsi('\x1b[1;3;4mStyled\x1b[0mNormal');
    expect(result[0].spans).toHaveLength(2);
    expect(result[0].spans[0].style.bold).toBe(true);
    expect(result[0].spans[0].style.italic).toBe(true);
    expect(result[0].spans[0].style.underline).toBe(true);
    expect(result[0].spans[1].style).toEqual({});
  });

  it('handles multiple spans with different colors', () => {
    const result = parseAnsi('\x1b[31mRed\x1b[32mGreen\x1b[34mBlue\x1b[0m');
    expect(result[0].spans).toHaveLength(3);
    expect(result[0].spans[0].style.foreground).toBe('ansi1');
    expect(result[0].spans[1].style.foreground).toBe('ansi2');
    expect(result[0].spans[2].style.foreground).toBe('ansi4');
  });

  it('handles combined SGR parameters', () => {
    const result = parseAnsi('\x1b[1;31mBold Red\x1b[0m');
    expect(result[0].spans[0].style.bold).toBe(true);
    expect(result[0].spans[0].style.foreground).toBe('ansi1');
  });

  it('removes OSC sequences (window titles)', () => {
    const result = parseAnsi('\x1b]0;Window Title\x07Hello');
    expect(result[0].spans[0].text).toBe('Hello');
  });
});

describe('stripAnsi', () => {
  it('removes all ANSI codes', () => {
    const result = stripAnsi('\x1b[1;31mBold Red\x1b[0m Normal');
    expect(result).toBe('Bold Red Normal');
  });

  it('handles text without ANSI codes', () => {
    const result = stripAnsi('Plain text');
    expect(result).toBe('Plain text');
  });

  it('removes OSC sequences', () => {
    const result = stripAnsi('\x1b]0;Title\x07Hello');
    expect(result).toBe('Hello');
  });
});

describe('getMaxWidth', () => {
  it('returns 0 for empty lines', () => {
    const result = getMaxWidth([{ spans: [] }]);
    expect(result).toBe(0);
  });

  it('returns correct width for single line', () => {
    const result = getMaxWidth([
      { spans: [{ text: 'Hello', style: {} }] },
    ]);
    expect(result).toBe(5);
  });

  it('returns max width across multiple lines', () => {
    const result = getMaxWidth([
      { spans: [{ text: 'Short', style: {} }] },
      { spans: [{ text: 'This is longer', style: {} }] },
      { spans: [{ text: 'Medium', style: {} }] },
    ]);
    expect(result).toBe(14);
  });

  it('sums width across multiple spans', () => {
    const result = getMaxWidth([
      {
        spans: [
          { text: 'Hello', style: {} },
          { text: ' ', style: {} },
          { text: 'World', style: {} },
        ],
      },
    ]);
    expect(result).toBe(11);
  });
});
