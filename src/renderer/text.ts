import type { TextSpan, TextStyle, Theme, FontConfig } from '../types';
import { resolveColor, dimColor } from './colors';
import { isCustomGlyph, renderCustomGlyph, type GlyphContext } from './customGlyphs';

/**
 * Round a coordinate value to avoid floating-point precision issues in SVG rendering.
 */
function r(value: number): number {
  return Math.round(value * 100) / 100;
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getStyleAttributes(
  style: TextStyle,
  theme: Theme
): Record<string, string> {
  const attrs: Record<string, string> = {};

  let fg = style.foreground;
  let bg = style.background;

  if (style.inverse) {
    [fg, bg] = [bg ?? theme.background, fg ?? theme.foreground];
  }

  let fgColor = resolveColor(fg, theme, true);
  if (style.dim) {
    fgColor = dimColor(fgColor);
  }
  attrs['fill'] = fgColor;

  if (style.bold) {
    attrs['font-weight'] = 'bold';
  }

  if (style.italic) {
    attrs['font-style'] = 'italic';
  }

  const decorations: string[] = [];
  if (style.underline) decorations.push('underline');
  if (style.strikethrough) decorations.push('line-through');
  if (decorations.length > 0) {
    attrs['text-decoration'] = decorations.join(' ');
  }

  return attrs;
}

export function renderSpanBackground(
  x: number,
  y: number,
  width: number,
  height: number,
  style: TextStyle,
  theme: Theme
): string | null {
  let bg = style.background;

  if (style.inverse) {
    bg = style.foreground ?? theme.foreground;
  }

  if (bg === undefined) return null;

  const bgColor = resolveColor(bg, theme, false);
  if (bgColor === 'transparent') return null;

  return `<rect x="${r(x)}" y="${r(y)}" width="${r(width)}" height="${r(height)}" fill="${bgColor}"/>`;
}

export interface SpanRenderResult {
  text: string;
  background: string | null;
  glyphs: string[];
  width: number;
}

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

  const bgY = y - font.size;
  const background = renderSpanBackground(x, bgY, width, cellHeight, span.style, theme);

  const attrs = getStyleAttributes(span.style, theme);
  const color = attrs['fill'];

  const lineWidth = Math.max(1, font.size / 14);
  const heavyLineWidth = lineWidth * 2;

  const glyphs: string[] = [];
  let textParts: string[] = [];
  let currentTextStart = -1;
  let currentText = '';
  let charX = x;

  for (let i = 0; i < span.text.length; i++) {
    const char = span.text[i];
    const codePoint = char.codePointAt(0);

    if (customGlyphs && codePoint !== undefined && isCustomGlyph(codePoint)) {
      if (currentText.length > 0) {
        const attrStr = Object.entries(attrs)
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ');
        textParts.push(
          `<tspan x="${r(currentTextStart)}" ${attrStr}>${escapeXml(currentText)}</tspan>`
        );
        currentText = '';
        currentTextStart = -1;
      }

      const ctx: GlyphContext = {
        cellWidth: charWidth,
        cellHeight: cellHeight,
        x: charX,
        y: bgY,
        color,
        lineWidth,
        heavyLineWidth,
      };

      const result = renderCustomGlyph(char, ctx);
      if (result.handled && result.svg) {
        glyphs.push(result.svg);
      }
    } else {
      if (currentTextStart === -1) {
        currentTextStart = charX;
      }
      currentText += char;
    }

    charX += charWidth;
  }

  if (currentText.length > 0) {
    const attrStr = Object.entries(attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');
    textParts.push(
      `<tspan x="${r(currentTextStart)}" ${attrStr}>${escapeXml(currentText)}</tspan>`
    );
  }

  return {
    text: textParts.join(''),
    background,
    glyphs,
    width,
  };
}

export function getDefaultFontConfig(
  fontSize: number = 14,
  lineHeight: number = 1.4,
  fontFamily?: string
): FontConfig {
  return {
    family: fontFamily ?? "'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'Courier New', monospace",
    size: fontSize,
    lineHeight,
    charWidth: 0.6,
  };
}
