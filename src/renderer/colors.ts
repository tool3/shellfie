import { ansi256ToRgb, fromRgb, rgb as rgbColor, tryParseRgb } from 'grfti';
import type { Theme, RGB } from '../types';

export const darkTheme: Theme = {
  name: 'dark',
  background: '#1e1e1e',
  foreground: '#d4d4d4',
  cursor: '#ffffff',
  selection: '#264f78',
  black: '#000000',
  red: '#cd3131',
  green: '#0dbc79',
  yellow: '#e5e510',
  blue: '#2472c8',
  magenta: '#bc3fbc',
  cyan: '#11a8cd',
  white: '#e5e5e5',
  brightBlack: '#666666',
  brightRed: '#f14c4c',
  brightGreen: '#23d18b',
  brightYellow: '#f5f543',
  brightBlue: '#3b8eea',
  brightMagenta: '#d670d6',
  brightCyan: '#29b8db',
  brightWhite: '#ffffff',
};

const THEME_SLOTS = [
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
  'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
  'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite',
] as const satisfies readonly (keyof Theme)[];

function get256Color(index: number, theme: Theme): string {
  const slot = THEME_SLOTS[index];
  if (slot !== undefined) return theme[slot];
  if (index >= 16 && index <= 255) return fromRgb(ansi256ToRgb(index)).hex;
  return theme.foreground;
}

export function rgbToHex(rgb: RGB): string {
  return rgbColor(rgb.r, rgb.g, rgb.b).hex;
}

export function resolveColor(
  color: string | RGB | undefined,
  theme: Theme,
  isForeground: boolean
): string {
  if (color === undefined) {
    return isForeground ? theme.foreground : 'transparent';
  }

  if (typeof color === 'object') {
    return rgbToHex(color);
  }

  const ansiMatch = color.match(/^ansi(\d+)$/);
  if (ansiMatch) {
    return get256Color(parseInt(ansiMatch[1], 10), theme);
  }

  const ansi256Match = color.match(/^ansi256-(\d+)$/);
  if (ansi256Match) {
    return get256Color(parseInt(ansi256Match[1], 10), theme);
  }

  return color;
}

const SIX_DIGIT_HEX = /^#[0-9a-f]{6}$/i;

export function dimColor(hex: string): string {
  if (!SIX_DIGIT_HEX.test(hex)) return hex;
  const parsed = tryParseRgb(hex);
  if (parsed === undefined) return hex;

  return rgbColor(
    Math.floor(parsed.r * 0.5),
    Math.floor(parsed.g * 0.5),
    Math.floor(parsed.b * 0.5)
  ).hex;
}

export function createTheme(overrides: Partial<Theme>): Theme {
  return { ...darkTheme, ...overrides };
}

export { get256Color };
