/**
 * Text rendering utilities
 */

import type { TextSpan, TextStyle, Theme, FontConfig } from '../types';
import { resolveColor, dimColor } from './colors';
import {
  isCustomGlyph,
  renderCustomGlyph,
  type GlyphContext,
} from './customGlyphs';

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
 * Result of rendering a span
 */
export interface SpanRenderResult {
  /** SVG tspan element for regular text */
  text: string;
  /** Background rectangle if needed */
  background: string | null;
  /** Custom glyph SVG elements (rendered as primitives instead of text) */
  glyphs: string[];
  /** Total width in pixels */
  width: number;
}

/**
 * Render a single text span to SVG
 *
 * Characters that are custom glyphs (box drawing, block elements, etc.) are
 * rendered as SVG primitives for pixel-perfect rendering, while regular text
 * is rendered as tspan elements.
 */
export function renderSpan(
  span: TextSpan,
  x: number,
  y: number,
  font: FontConfig,
  theme: Theme,
  customGlyphs: boolean = true
): SpanRenderResult {
  const charWidth = font.size * font.charWidth;
  const cellHeight = font.size * font.lineHeight;
  const width = span.text.length * charWidth;

  // Background (positioned at top of line)
  const bgY = y - font.size; // Move up by font size to cover the line
  const background = renderSpanBackground(
    x,
    bgY,
    width,
    cellHeight,
    span.style,
    theme
  );

  // Get the foreground color for this span
  const attrs = getStyleAttributes(span.style, theme);
  const color = attrs['fill'];

  // Line widths for box drawing
  const lineWidth = Math.max(1, font.size / 14);
  const heavyLineWidth = lineWidth * 2;

  // Process each character, separating custom glyphs from regular text
  const glyphs: string[] = [];
  let textParts: string[] = [];
  let currentTextStart = -1;
  let currentText = '';
  let charX = x;

  for (let i = 0; i < span.text.length; i++) {
    const char = span.text[i];
    const codePoint = char.codePointAt(0);

    if (customGlyphs && codePoint !== undefined && isCustomGlyph(codePoint)) {
      // Flush any accumulated regular text
      if (currentText.length > 0) {
        const attrStr = Object.entries(attrs)
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ');
        textParts.push(
          `<tspan x="${currentTextStart}" ${attrStr}>${escapeXml(currentText)}</tspan>`
        );
        currentText = '';
        currentTextStart = -1;
      }

      // Render custom glyph
      const ctx: GlyphContext = {
        cellWidth: charWidth,
        cellHeight: cellHeight,
        x: charX,
        y: bgY, // Use top of cell (same as background)
        color,
        lineWidth,
        heavyLineWidth,
      };

      const result = renderCustomGlyph(char, ctx);
      if (result.handled && result.svg) {
        glyphs.push(result.svg);
      }
    } else {
      // Accumulate regular text
      if (currentTextStart === -1) {
        currentTextStart = charX;
      }
      currentText += char;
    }

    charX += charWidth;
  }

  // Flush any remaining regular text
  if (currentText.length > 0) {
    const attrStr = Object.entries(attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');
    textParts.push(
      `<tspan x="${currentTextStart}" ${attrStr}>${escapeXml(currentText)}</tspan>`
    );
  }

  return {
    text: textParts.join(''),
    background,
    glyphs,
    width,
  };
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
