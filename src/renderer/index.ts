/**
 * SVG Renderer
 *
 * Converts parsed terminal output into SVG strings
 */

import type {
  FontConfig,
  ParsedLine,
  RenderOptions,
  ResolvedFooterConfig,
  ResolvedHeaderConfig,
  Template,
  Theme,
} from '../types';
import { parseAnsi } from '../parser';
import { escapeXml, renderSpan } from './text';

export interface RenderResult {
  svg: string;
  width: number;
  height: number;
}

/**
 * Render window controls (close, minimize, maximize buttons)
 */
function renderControls(
  template: Template,
  x: number,
  y: number
): string {
  if (!template.shell.controls) {
    return '';
  }

  const style = template.shell.controlStyle;
  const { size, spacing, radius } = style;

  const buttons: string[] = [];

  if (template.shell.controlsPosition === 'left') {
    // macOS style - left aligned
    buttons.push(
      `<circle cx="${x}" cy="${y}" r="${radius}" fill="${style.close}"/>`,
      `<circle cx="${x + spacing}" cy="${y}" r="${radius}" fill="${style.minimize}"/>`,
      `<circle cx="${x + spacing * 2}" cy="${y}" r="${radius}" fill="${style.maximize}"/>`
    );
  } else {
    // Windows style - right aligned (rendered in reverse order)
    buttons.push(
      `<rect x="${x - size * 3 - spacing * 2}" y="${y - size / 2}" width="${size}" height="${size}" fill="${style.minimize}" rx="1"/>`,
      `<rect x="${x - size * 2 - spacing}" y="${y - size / 2}" width="${size}" height="${size}" fill="${style.maximize}" rx="1"/>`,
      `<rect x="${x - size}" y="${y - size / 2}" width="${size}" height="${size}" fill="${style.close}" rx="1"/>`
    );
  }

  return buttons.join('\n    ');
}

/**
 * Render title bar
 */
function renderTitleBar(
  template: Template,
  title: string,
  contentWidth: number,
  theme: Theme,
  font: FontConfig,
  header: ResolvedHeaderConfig | null
): string {
  if (!template.shell.titleBar) {
    return '';
  }

  const { borderRadius, controls, controlsPosition } = template.shell;

  // Use header height if specified, otherwise use template's titleBarHeight
  const titleBarHeight = header?.height ?? template.shell.titleBarHeight;

  // Use header background color if provided, otherwise use theme background
  const backgroundColor = header?.backgroundColor ?? theme.background;

  const parts: string[] = [];

  // Determine border settings
  const showBorder = header ? header.border : true;
  const borderColor = header?.borderColor ?? `${theme.foreground}1a`; // 10% opacity default
  const borderWidth = header?.borderWidth ?? 1;

  // Title bar background (leave room for border at the bottom)
  const bgHeight = showBorder ? titleBarHeight - borderWidth : titleBarHeight;
  parts.push(
    `<rect x="0" y="0" width="${contentWidth}" height="${bgHeight}" fill="${backgroundColor}" rx="${borderRadius}" ry="${borderRadius}"/>`
  );

  // Cover bottom corners of title bar (they should be square where content meets)
  if (bgHeight > borderRadius) {
    parts.push(
      `<rect x="0" y="${bgHeight - borderRadius}" width="${contentWidth}" height="${borderRadius}" fill="${backgroundColor}"/>`
    );
  }

  // Separator line at the bottom of title bar area
  if (showBorder) {
    const borderY = titleBarHeight - borderWidth / 2;
    parts.push(
      `<line x1="0" y1="${borderY}" x2="${contentWidth}" y2="${borderY}" stroke="${borderColor}" stroke-width="${borderWidth}"/>`
    );
  }

  // Controls
  if (controls) {
    const controlY = bgHeight / 2;
    const controlX =
      controlsPosition === 'left'
        ? template.shell.padding
        : contentWidth - template.shell.padding;

    parts.push(renderControls(template, controlX, controlY));
  }

  // Title text (centered in background area)
  if (title) {
    const titleX = contentWidth / 2;
    const titleY = bgHeight / 2 + font.size / 3;
    parts.push(
      `<text x="${titleX}" y="${titleY}" fill="${theme.foreground}" font-family="${font.family}" font-size="${font.size - 2}" text-anchor="middle" opacity="0.8">${escapeXml(title)}</text>`
    );
  }

  return parts.join('\n    ');
}

/**
 * Render footer bar (structural chrome element at the bottom)
 */
function renderFooterBar(
  footer: ResolvedFooterConfig,
  contentWidth: number,
  y: number,
  borderRadius: number
): string {
  const parts: string[] = [];

  // Border line at the top of footer area
  if (footer.border) {
    const borderY = y + footer.borderWidth / 2;
    parts.push(
      `<line x1="0" y1="${borderY}" x2="${contentWidth}" y2="${borderY}" stroke="${footer.borderColor}" stroke-width="${footer.borderWidth}"/>`
    );
  }

  // Footer background starts after the border
  const bgY = footer.border ? y + footer.borderWidth : y;
  const bgHeight = footer.border ? footer.height - footer.borderWidth : footer.height;

  // Footer background
  parts.push(
    `<rect x="0" y="${bgY}" width="${contentWidth}" height="${bgHeight}" fill="${footer.backgroundColor}" rx="${borderRadius}" ry="${borderRadius}"/>`
  );

  // Cover top corners of footer (they should be square where content meets)
  parts.push(
    `<rect x="0" y="${bgY}" width="${contentWidth}" height="${borderRadius}" fill="${footer.backgroundColor}"/>`
  );

  return parts.join('\n    ');
}

/**
 * Render watermark with ANSI styling support
 */
function renderWatermark(
  watermark: string,
  x: number,
  y: number,
  theme: Theme,
  font: FontConfig
): string {
  // Parse the watermark for ANSI codes
  const lines = parseAnsi(watermark);

  // Find first non-empty line
  const line = lines.find(l => l.spans.length > 0);
  if (!line) {
    return '';
  }

  // Use smaller font for watermark
  const wmFont: FontConfig = {
    ...font,
    size: font.size - 4,
  };
  const charWidth = wmFont.size * wmFont.charWidth;

  // Calculate total width of watermark text
  let totalChars = 0;
  for (const span of line.spans) {
    totalChars += span.text.length;
  }
  const totalWidth = totalChars * charWidth;

  // Start position (right-aligned from x)
  const startX = x - totalWidth;

  // Render spans
  const tspans: string[] = [];
  let currentX = startX;

  for (const span of line.spans) {
    const result = renderSpan(span, currentX, y, wmFont, theme, false);
    if (result.text) {
      tspans.push(result.text);
    }
    currentX += result.width;
  }

  return `<text y="${y}" font-family="${font.family}" font-size="${wmFont.size}" xml:space="preserve">${tspans.join('')}</text>`;
}

/**
 * Generate font-face CSS for embedded fonts
 */
function generateFontFace(font: FontConfig): string {
  if (!font.embedData || !font.embedFormat) {
    return '';
  }

  const mimeTypes: Record<string, string> = {
    woff2: 'font/woff2',
    woff: 'font/woff',
    ttf: 'font/ttf',
  };

  return `
    @font-face {
      font-family: 'EmbeddedFont';
      src: url(data:${mimeTypes[font.embedFormat]};base64,${font.embedData}) format('${font.embedFormat}');
    }`;
}

/**
 * Render drop shadow filter
 */
function renderShadowFilter(): string {
  return `<filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
    </filter>`;
}

/**
 * Main render function
 */
export function renderSvg(
  lines: ParsedLine[],
  options: RenderOptions
): RenderResult {
  const { template, title, theme, font, padding, watermark, watermarkPadding, customGlyphs, header, footer } =
    options;

  const charWidth = font.size * font.charWidth;
  const lineHeight = font.size * font.lineHeight;

  // Calculate content dimensions
  let maxLineWidth = 0;
  for (const line of lines) {
    let lineWidth = 0;
    for (const span of line.spans) {
      lineWidth += span.text.length;
    }
    if (lineWidth > maxLineWidth) {
      maxLineWidth = lineWidth;
    }
  }

  // Use specified width or auto-detect
  const columns = options.width ?? Math.max(maxLineWidth, 40);
  const textWidth = columns * charWidth;
  const textHeight = lines.length * lineHeight;

  // Calculate total dimensions with chrome
  // Use header height if specified, otherwise use template's titleBarHeight
  const titleBarHeight = template.shell.titleBar
    ? (header?.height ?? template.shell.titleBarHeight)
    : 0;

  // Footer height
  const footerHeight = footer ? footer.height : 0;

  // Watermark height accounts for its own padding
  const wmFontSize = font.size - 4;
  const watermarkHeight = watermark ? wmFontSize + watermarkPadding.bottom : 0;

  const contentWidth = textWidth + padding.left + padding.right;
  const contentHeight =
    textHeight + padding.top + padding.bottom + titleBarHeight + footerHeight + watermarkHeight;

  // Start building SVG
  const svgParts: string[] = [];

  // SVG header
  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${contentWidth} ${contentHeight}" width="${contentWidth}" height="${contentHeight}">`
  );

  // Defs (filters, fonts)
  const defs: string[] = [];
  if (template.shell.shadow) {
    defs.push(renderShadowFilter());
  }
  if (font.embedData) {
    defs.push(`<style>${generateFontFace(font)}</style>`);
  }
  if (defs.length > 0) {
    svgParts.push(`  <defs>\n    ${defs.join('\n    ')}\n  </defs>`);
  }

  // Background with optional shadow and border
  const bgAttrs: string[] = [
    `x="0"`,
    `y="0"`,
    `width="${contentWidth}"`,
    `height="${contentHeight}"`,
    `fill="${theme.background}"`,
    `rx="${template.shell.borderRadius}"`,
    `ry="${template.shell.borderRadius}"`,
  ];

  if (template.shell.shadow) {
    bgAttrs.push(`filter="url(#shadow)"`);
  }

  svgParts.push(`  <rect ${bgAttrs.join(' ')}/>`);

  // Border
  if (template.shell.border) {
    svgParts.push(
      `  <rect x="0.5" y="0.5" width="${contentWidth - 1}" height="${contentHeight - 1}" fill="none" stroke="${template.shell.borderColor}" stroke-width="${template.shell.borderWidth}" rx="${template.shell.borderRadius}" ry="${template.shell.borderRadius}"/>`
    );
  }

  // Title bar (with optional header styling)
  if (template.shell.titleBar) {
    svgParts.push(`  <g class="title-bar">`);
    svgParts.push(`    ${renderTitleBar(template, title, contentWidth, theme, font, header)}`);
    svgParts.push(`  </g>`);
  }

  // Content area
  const contentX = padding.left;
  const contentY = titleBarHeight + padding.top;

  // Collect all elements: backgrounds, custom glyphs, and text
  const backgrounds: string[] = [];
  const glyphs: string[] = [];

  // Font family for text
  const fontFamily = font.embedData ? "'EmbeddedFont', " + font.family : font.family;

  // First pass: collect backgrounds and glyphs
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const y = contentY + lineIndex * lineHeight + font.size;
    let x = contentX;

    for (const span of line.spans) {
      const result = renderSpan(span, x, y, font, theme, customGlyphs);

      if (result.background) {
        backgrounds.push(result.background);
      }

      // Collect custom glyphs
      for (const glyph of result.glyphs) {
        glyphs.push(glyph);
      }

      x += result.width;
    }
  }

  // Render backgrounds
  if (backgrounds.length > 0) {
    svgParts.push(`  <g class="backgrounds">`);
    for (const bg of backgrounds) {
      svgParts.push(`    ${bg}`);
    }
    svgParts.push(`  </g>`);
  }

  // Render custom glyphs (between backgrounds and text)
  if (glyphs.length > 0) {
    svgParts.push(`  <g class="glyphs">`);
    for (const glyph of glyphs) {
      svgParts.push(`    ${glyph}`);
    }
    svgParts.push(`  </g>`);
  }

  // Render text
  svgParts.push(`  <g class="text">`);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const y = contentY + lineIndex * lineHeight + font.size;

    if (line.spans.length === 0) {
      continue;
    }

    // Collect tspans for this line
    const tspans: string[] = [];
    let x = contentX;
    let hasText = false;

    for (const span of line.spans) {
      const result = renderSpan(span, x, y, font, theme, customGlyphs);
      if (result.text) {
        tspans.push(result.text);
        hasText = true;
      }
      x += result.width;
    }

    // Only add text element if there's actual text content
    if (hasText && tspans.some(t => t.length > 0)) {
      svgParts.push(
        `    <text y="${y}" font-family="${fontFamily}" font-size="${font.size}" xml:space="preserve">${tspans.join('')}</text>`
      );
    }
  }
  svgParts.push(`  </g>`);

  // Watermark (positioned above footer, at bottom of content area)
  if (watermark) {
    const wmX = contentWidth - watermarkPadding.right;
    // Position watermark at bottom of content area, before footer
    const contentAreaBottom = titleBarHeight + padding.top + textHeight + padding.bottom;
    const wmY = contentAreaBottom - watermarkPadding.bottom + wmFontSize;
    svgParts.push(`  ${renderWatermark(watermark, wmX, wmY, theme, font)}`);
  }

  // Footer (after watermark so it doesn't overlap)
  if (footer) {
    const footerY = titleBarHeight + padding.top + textHeight + padding.bottom + watermarkHeight;
    svgParts.push(`  <g class="footer">`);
    svgParts.push(`    ${renderFooterBar(footer, contentWidth, footerY, template.shell.borderRadius)}`);
    svgParts.push(`  </g>`);
  }

  // Close SVG
  svgParts.push('</svg>');

  return {
    svg: svgParts.join('\n'),
    width: contentWidth,
    height: contentHeight,
  };
}

export { createTheme, darkTheme, dimColor, resolveColor } from './colors';
export { escapeXml, getDefaultFontConfig } from './text';

