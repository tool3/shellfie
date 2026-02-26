/**
 * Text rendering utilities
 */

import type { TextSpan, TextStyle, Theme, FontConfig } from '../types.js';
import { resolveColor, dimColor } from './colors.js';

/**
 * Escape special XML/HTML characters
 */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate SVG text element attributes for a style
 */
export function getStyleAttributes(
  style: TextStyle,
  theme: Theme
): Record<string, string> {
  const attrs: Record<string, string> = {};

  // Handle inverse (swap foreground/background)
  let fg = style.foreground;
  let bg = style.background;

  if (style.inverse) {
    [fg, bg] = [bg ?? theme.background, fg ?? theme.foreground];
  }

  // Foreground color
  let fgColor = resolveColor(fg, theme, true);

  // Apply dim effect
  if (style.dim) {
    fgColor = dimColor(fgColor);
  }

  attrs['fill'] = fgColor;

  // Font weight
  if (style.bold) {
    attrs['font-weight'] = 'bold';
  }

  // Font style
  if (style.italic) {
    attrs['font-style'] = 'italic';
  }

  // Text decoration
  const decorations: string[] = [];
  if (style.underline) {
    decorations.push('underline');
  }
  if (style.strikethrough) {
    decorations.push('line-through');
  }
  if (decorations.length > 0) {
    attrs['text-decoration'] = decorations.join(' ');
  }

  return attrs;
}

/**
 * Render a background rectangle for a span with background color
 */
export function renderSpanBackground(
  x: number,
  y: number,
  width: number,
  height: number,
  style: TextStyle,
  theme: Theme
): string | null {
  let bg = style.background;

  // Handle inverse
  if (style.inverse) {
    bg = style.foreground ?? theme.foreground;
  }

  if (bg === undefined) {
    return null;
  }

  const bgColor = resolveColor(bg, theme, false);

  if (bgColor === 'transparent') {
    return null;
  }

  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${bgColor}"/>`;
}

/**
 * Render a single text span to SVG
 */
export function renderSpan(
  span: TextSpan,
  x: number,
  y: number,
  font: FontConfig,
  theme: Theme
): { text: string; background: string | null; width: number } {
  const charWidth = font.size * font.charWidth;
  const width = span.text.length * charWidth;
  const lineHeight = font.size * font.lineHeight;

  // Background (positioned at top of line)
  const bgY = y - font.size; // Move up by font size to cover the line
  const background = renderSpanBackground(
    x,
    bgY,
    width,
    lineHeight,
    span.style,
    theme
  );

  // Text element
  const attrs = getStyleAttributes(span.style, theme);
  const attrStr = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');

  const text = `<tspan x="${x}" ${attrStr}>${escapeXml(span.text)}</tspan>`;

  return { text, background, width };
}

/**
 * Calculate font metrics for common monospace fonts
 */
export function getDefaultFontConfig(
  fontSize: number = 14,
  lineHeight: number = 1.4,
  fontFamily?: string
): FontConfig {
  return {
    family:
      fontFamily ??
      "'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'Courier New', monospace",
    size: fontSize,
    lineHeight,
    // Standard monospace character width ratio (varies by font, 0.6 is a good average)
    charWidth: 0.6,
  };
}
