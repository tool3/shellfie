import { describe, it, expect } from 'vitest';
import {
  darkTheme,
  resolveColor,
  rgbToHex,
  dimColor,
  createTheme,
  get256Color,
} from './colors.js';

describe('resolveColor', () => {
  it('returns foreground default for undefined', () => {
    const result = resolveColor(undefined, darkTheme, true);
    expect(result).toBe(darkTheme.foreground);
  });

  it('returns transparent for undefined background', () => {
    const result = resolveColor(undefined, darkTheme, false);
    expect(result).toBe('transparent');
  });

  it('resolves standard ANSI colors', () => {
    expect(resolveColor('ansi0', darkTheme, true)).toBe(darkTheme.black);
    expect(resolveColor('ansi1', darkTheme, true)).toBe(darkTheme.red);
    expect(resolveColor('ansi2', darkTheme, true)).toBe(darkTheme.green);
    expect(resolveColor('ansi3', darkTheme, true)).toBe(darkTheme.yellow);
    expect(resolveColor('ansi4', darkTheme, true)).toBe(darkTheme.blue);
    expect(resolveColor('ansi5', darkTheme, true)).toBe(darkTheme.magenta);
    expect(resolveColor('ansi6', darkTheme, true)).toBe(darkTheme.cyan);
    expect(resolveColor('ansi7', darkTheme, true)).toBe(darkTheme.white);
  });

  it('resolves bright ANSI colors', () => {
    expect(resolveColor('ansi8', darkTheme, true)).toBe(darkTheme.brightBlack);
    expect(resolveColor('ansi9', darkTheme, true)).toBe(darkTheme.brightRed);
    expect(resolveColor('ansi10', darkTheme, true)).toBe(darkTheme.brightGreen);
    expect(resolveColor('ansi11', darkTheme, true)).toBe(darkTheme.brightYellow);
    expect(resolveColor('ansi12', darkTheme, true)).toBe(darkTheme.brightBlue);
    expect(resolveColor('ansi13', darkTheme, true)).toBe(darkTheme.brightMagenta);
    expect(resolveColor('ansi14', darkTheme, true)).toBe(darkTheme.brightCyan);
    expect(resolveColor('ansi15', darkTheme, true)).toBe(darkTheme.brightWhite);
  });

  it('resolves 256-color palette', () => {
    // Color cube
    expect(resolveColor('ansi256-16', darkTheme, true)).toBe('#000000');
    expect(resolveColor('ansi256-196', darkTheme, true)).toBe('#ff0000');
    expect(resolveColor('ansi256-21', darkTheme, true)).toBe('#0000ff');

    // Grayscale
    expect(resolveColor('ansi256-232', darkTheme, true)).toBe('#080808');
    expect(resolveColor('ansi256-255', darkTheme, true)).toBe('#eeeeee');
  });

  it('resolves RGB colors', () => {
    const result = resolveColor({ r: 255, g: 128, b: 64 }, darkTheme, true);
    expect(result).toBe('#ff8040');
  });

  it('passes through hex colors', () => {
    const result = resolveColor('#aabbcc', darkTheme, true);
    expect(result).toBe('#aabbcc');
  });
});

describe('rgbToHex', () => {
  it('converts RGB to hex', () => {
    expect(rgbToHex({ r: 255, g: 128, b: 64 })).toBe('#ff8040');
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
  });

  it('clamps values to 0-255', () => {
    expect(rgbToHex({ r: 300, g: -10, b: 128 })).toBe('#ff0080');
  });
});

describe('dimColor', () => {
  it('reduces brightness by ~50%', () => {
    expect(dimColor('#ffffff')).toBe('#7f7f7f');
    expect(dimColor('#ff0000')).toBe('#7f0000');
    expect(dimColor('#00ff00')).toBe('#007f00');
  });

  it('handles lowercase hex', () => {
    expect(dimColor('#aabbcc')).toBe('#555d66');
  });

  it('returns original for invalid hex', () => {
    expect(dimColor('invalid')).toBe('invalid');
  });
});

describe('createTheme', () => {
  it('merges with dark theme', () => {
    const theme = createTheme({ name: 'custom', background: '#000' });
    expect(theme.name).toBe('custom');
    expect(theme.background).toBe('#000');
    expect(theme.foreground).toBe(darkTheme.foreground);
    expect(theme.red).toBe(darkTheme.red);
  });
});

describe('get256Color', () => {
  it('returns standard colors for 0-7', () => {
    expect(get256Color(0, darkTheme)).toBe(darkTheme.black);
    expect(get256Color(1, darkTheme)).toBe(darkTheme.red);
  });

  it('returns bright colors for 8-15', () => {
    expect(get256Color(8, darkTheme)).toBe(darkTheme.brightBlack);
    expect(get256Color(9, darkTheme)).toBe(darkTheme.brightRed);
  });

  it('generates color cube colors for 16-231', () => {
    // Pure red
    expect(get256Color(196, darkTheme)).toBe('#ff0000');
    // Pure green
    expect(get256Color(46, darkTheme)).toBe('#00ff00');
    // Pure blue
    expect(get256Color(21, darkTheme)).toBe('#0000ff');
  });

  it('generates grayscale for 232-255', () => {
    expect(get256Color(232, darkTheme)).toBe('#080808');
    expect(get256Color(243, darkTheme)).toBe('#767676');
    expect(get256Color(255, darkTheme)).toBe('#eeeeee');
  });

  it('returns foreground for out of range', () => {
    expect(get256Color(256, darkTheme)).toBe(darkTheme.foreground);
    expect(get256Color(-1, darkTheme)).toBe(darkTheme.foreground);
  });
});
