/**
 * Color utilities and theme definitions
 */

import type { Theme, RGB } from '../types';

/**
 * Default dark theme (inspired by VS Code Dark+)
 */
export const darkTheme: Theme = {
  name: 'dark',
  background: '#1e1e1e',
  foreground: '#d4d4d4',
  cursor: '#ffffff',
  selection: '#264f78',
  // Standard colors
  black: '#000000',
  red: '#cd3131',
  green: '#0dbc79',
  yellow: '#e5e510',
  blue: '#2472c8',
  magenta: '#bc3fbc',
  cyan: '#11a8cd',
  white: '#e5e5e5',
  // Bright colors
  brightBlack: '#666666',
  brightRed: '#f14c4c',
  brightGreen: '#23d18b',
  brightYellow: '#f5f543',
  brightBlue: '#3b8eea',
  brightMagenta: '#d670d6',
  brightCyan: '#29b8db',
  brightWhite: '#ffffff',
};

/**
 * ANSI 256-color palette
 * Colors 0-15 come from the theme
 * Colors 16-231 are a 6x6x6 color cube
 * Colors 232-255 are grayscale
 */
function get256Color(index: number, theme: Theme): string {
  // Standard colors (0-7)
  if (index >= 0 && index <= 7) {
    const colors = [
      theme.black,
      theme.red,
      theme.green,
      theme.yellow,
      theme.blue,
      theme.magenta,
      theme.cyan,
      theme.white,
    ];
    return colors[index];
  }

  // Bright colors (8-15)
  if (index >= 8 && index <= 15) {
    const colors = [
      theme.brightBlack,
      theme.brightRed,
      theme.brightGreen,
      theme.brightYellow,
      theme.brightBlue,
      theme.brightMagenta,
      theme.brightCyan,
      theme.brightWhite,
    ];
    return colors[index - 8];
  }

  // 6x6x6 color cube (16-231)
  if (index >= 16 && index <= 231) {
    const i = index - 16;
    const r = Math.floor(i / 36);
    const g = Math.floor((i % 36) / 6);
    const b = i % 6;

    const toHex = (v: number) => {
      const value = v === 0 ? 0 : 55 + v * 40;
      return value.toString(16).padStart(2, '0');
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Grayscale (232-255)
  if (index >= 232 && index <= 255) {
    const gray = 8 + (index - 232) * 10;
    const hex = gray.toString(16).padStart(2, '0');
    return `#${hex}${hex}${hex}`;
  }

  // Fallback
  return theme.foreground;
}

/**
 * Convert RGB to hex color string
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Resolve a color value (ANSI name, 256-color index, or RGB) to hex
 */
export function resolveColor(
  color: string | RGB | undefined,
  theme: Theme,
  isForeground: boolean
): string {
  if (color === undefined) {
    return isForeground ? theme.foreground : 'transparent';
  }

  // RGB color
  if (typeof color === 'object') {
    return rgbToHex(color);
  }

  // ANSI standard color (ansi0-ansi7)
  const ansiMatch = color.match(/^ansi(\d+)$/);
  if (ansiMatch) {
    const index = parseInt(ansiMatch[1], 10);
    return get256Color(index, theme);
  }

  // 256-color (ansi256-N)
  const ansi256Match = color.match(/^ansi256-(\d+)$/);
  if (ansi256Match) {
    const index = parseInt(ansi256Match[1], 10);
    return get256Color(index, theme);
  }

  // Already a hex color or named color
  return color;
}

/**
 * Apply dim effect to a color (reduce brightness by ~50%)
 */
export function dimColor(hex: string): string {
  // Parse hex color
  const match = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return hex;

  const r = Math.floor(parseInt(match[1], 16) * 0.5);
  const g = Math.floor(parseInt(match[2], 16) * 0.5);
  const b = Math.floor(parseInt(match[3], 16) * 0.5);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Create a custom theme by merging with dark theme defaults
 */
export function createTheme(overrides: Partial<Theme>): Theme {
  return { ...darkTheme, ...overrides };
}

export { get256Color };
