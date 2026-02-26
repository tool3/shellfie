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

function renderControls(template: Template, x: number, y: number): string {
  if (!template.shell.controls) return '';

  const style = template.shell.controlStyle;
  const { size, spacing, radius } = style;
  const buttons: string[] = [];

  if (template.shell.controlsPosition === 'left') {
    buttons.push(
      `<circle cx="${x}" cy="${y}" r="${radius}" fill="${style.close}"/>`,
      `<circle cx="${x + spacing}" cy="${y}" r="${radius}" fill="${style.minimize}"/>`,
      `<circle cx="${x + spacing * 2}" cy="${y}" r="${radius}" fill="${style.maximize}"/>`
    );
  } else {
    buttons.push(
      `<rect x="${x - size * 3 - spacing * 2}" y="${y - size / 2}" width="${size}" height="${size}" fill="${style.minimize}" rx="1"/>`,
      `<rect x="${x - size * 2 - spacing}" y="${y - size / 2}" width="${size}" height="${size}" fill="${style.maximize}" rx="1"/>`,
      `<rect x="${x - size}" y="${y - size / 2}" width="${size}" height="${size}" fill="${style.close}" rx="1"/>`
    );
  }

  return buttons.join('\n    ');
}

function renderTitleBar(
  template: Template,
  title: string,
  contentWidth: number,
  theme: Theme,
  font: FontConfig,
  header: ResolvedHeaderConfig | null
): string {
  if (!template.shell.titleBar) return '';

  const { borderRadius, controls, controlsPosition } = template.shell;
  const titleBarHeight = header?.height ?? template.shell.titleBarHeight;
  const backgroundColor = header?.backgroundColor ?? theme.background;

  const parts: string[] = [];

  const showBorder = header ? header.border : true;
  const borderColor = header?.borderColor ?? `${theme.foreground}1a`;
  const borderWidth = header?.borderWidth ?? 1;

  const bgHeight = showBorder ? titleBarHeight - borderWidth : titleBarHeight;
  parts.push(
    `<rect x="0" y="0" width="${contentWidth}" height="${bgHeight}" fill="${backgroundColor}" rx="${borderRadius}" ry="${borderRadius}"/>`
  );

  if (bgHeight > borderRadius) {
    parts.push(
      `<rect x="0" y="${bgHeight - borderRadius}" width="${contentWidth}" height="${borderRadius}" fill="${backgroundColor}"/>`
    );
  }

  if (showBorder) {
    const borderY = titleBarHeight - borderWidth / 2;
    parts.push(
      `<line x1="0" y1="${borderY}" x2="${contentWidth}" y2="${borderY}" stroke="${borderColor}" stroke-width="${borderWidth}"/>`
    );
  }

  if (controls) {
    const controlY = bgHeight / 2;
    const controlX = controlsPosition === 'left'
      ? template.shell.padding
      : contentWidth - template.shell.padding;
    parts.push(renderControls(template, controlX, controlY));
  }

  if (title) {
    const titleX = contentWidth / 2;
    const titleY = bgHeight / 2 + font.size / 3;
    parts.push(
      `<text x="${titleX}" y="${titleY}" fill="${theme.foreground}" font-family="${font.family}" font-size="${font.size - 2}" text-anchor="middle" opacity="0.8">${escapeXml(title)}</text>`
    );
  }

  return parts.join('\n    ');
}

function renderFooterBar(
  footer: ResolvedFooterConfig,
  contentWidth: number,
  y: number,
  borderRadius: number
): string {
  const parts: string[] = [];

  if (footer.border) {
    const borderY = y + footer.borderWidth / 2;
    parts.push(
      `<line x1="0" y1="${borderY}" x2="${contentWidth}" y2="${borderY}" stroke="${footer.borderColor}" stroke-width="${footer.borderWidth}"/>`
    );
  }

  const bgY = footer.border ? y + footer.borderWidth : y;
  const bgHeight = footer.border ? footer.height - footer.borderWidth : footer.height;

  parts.push(
    `<rect x="0" y="${bgY}" width="${contentWidth}" height="${bgHeight}" fill="${footer.backgroundColor}" rx="${borderRadius}" ry="${borderRadius}"/>`
  );

  parts.push(
    `<rect x="0" y="${bgY}" width="${contentWidth}" height="${borderRadius}" fill="${footer.backgroundColor}"/>`
  );

  return parts.join('\n    ');
}

function renderWatermark(
  watermark: string,
  x: number,
  y: number,
  theme: Theme,
  font: FontConfig
): string {
  const lines = parseAnsi(watermark);
  const line = lines.find(l => l.spans.length > 0);
  if (!line) return '';

  const wmFont: FontConfig = { ...font, size: font.size - 4 };
  const charWidth = wmFont.size * wmFont.charWidth;

  let totalChars = 0;
  for (const span of line.spans) {
    totalChars += span.text.length;
  }
  const totalWidth = totalChars * charWidth;
  const startX = x - totalWidth;

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

function generateFontFace(font: FontConfig): string {
  if (!font.embedData || !font.embedFormat) return '';

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

function renderShadowFilter(): string {
  return `<filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
    </filter>`;
}

export function renderSvg(lines: ParsedLine[], options: RenderOptions): RenderResult {
  const { template, title, theme, font, padding, watermark, watermarkPadding, customGlyphs, header, footer } = options;

  const charWidth = font.size * font.charWidth;
  const lineHeight = font.size * font.lineHeight;

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

  const columns = options.width ?? Math.max(maxLineWidth, 40);
  const textWidth = columns * charWidth;
  const textHeight = lines.length * lineHeight;

  const titleBarHeight = template.shell.titleBar
    ? (header?.height ?? template.shell.titleBarHeight)
    : 0;
  const footerHeight = footer ? footer.height : 0;
  const wmFontSize = font.size - 4;
  const watermarkHeight = watermark ? wmFontSize + watermarkPadding.bottom : 0;

  const contentWidth = textWidth + padding.left + padding.right;
  const contentHeight = textHeight + padding.top + padding.bottom + titleBarHeight + footerHeight + watermarkHeight;

  const svgParts: string[] = [];

  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${contentWidth} ${contentHeight}" width="${contentWidth}" height="${contentHeight}">`
  );

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

  if (template.shell.border) {
    svgParts.push(
      `  <rect x="0.5" y="0.5" width="${contentWidth - 1}" height="${contentHeight - 1}" fill="none" stroke="${template.shell.borderColor}" stroke-width="${template.shell.borderWidth}" rx="${template.shell.borderRadius}" ry="${template.shell.borderRadius}"/>`
    );
  }

  if (template.shell.titleBar) {
    svgParts.push(`  <g class="title-bar">`);
    svgParts.push(`    ${renderTitleBar(template, title, contentWidth, theme, font, header)}`);
    svgParts.push(`  </g>`);
  }

  const contentX = padding.left;
  const contentY = titleBarHeight + padding.top;

  const backgrounds: string[] = [];
  const glyphs: string[] = [];
  const fontFamily = font.embedData ? "'EmbeddedFont', " + font.family : font.family;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const y = contentY + lineIndex * lineHeight + font.size;
    let x = contentX;

    for (const span of line.spans) {
      const result = renderSpan(span, x, y, font, theme, customGlyphs);
      if (result.background) {
        backgrounds.push(result.background);
      }
      for (const glyph of result.glyphs) {
        glyphs.push(glyph);
      }
      x += result.width;
    }
  }

  if (backgrounds.length > 0) {
    svgParts.push(`  <g class="backgrounds">`);
    for (const bg of backgrounds) {
      svgParts.push(`    ${bg}`);
    }
    svgParts.push(`  </g>`);
  }

  if (glyphs.length > 0) {
    svgParts.push(`  <g class="glyphs">`);
    for (const glyph of glyphs) {
      svgParts.push(`    ${glyph}`);
    }
    svgParts.push(`  </g>`);
  }

  svgParts.push(`  <g class="text">`);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const y = contentY + lineIndex * lineHeight + font.size;

    if (line.spans.length === 0) continue;

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

    if (hasText && tspans.some(t => t.length > 0)) {
      svgParts.push(
        `    <text y="${y}" font-family="${fontFamily}" font-size="${font.size}" xml:space="preserve">${tspans.join('')}</text>`
      );
    }
  }
  svgParts.push(`  </g>`);

  if (watermark) {
    const wmX = contentWidth - watermarkPadding.right;
    const contentAreaBottom = titleBarHeight + padding.top + textHeight + padding.bottom;
    const wmY = contentAreaBottom - watermarkPadding.bottom + wmFontSize;
    svgParts.push(`  ${renderWatermark(watermark, wmX, wmY, theme, font)}`);
  }

  if (footer) {
    const footerY = titleBarHeight + padding.top + textHeight + padding.bottom + watermarkHeight;
    svgParts.push(`  <g class="footer">`);
    svgParts.push(`    ${renderFooterBar(footer, contentWidth, footerY, template.shell.borderRadius)}`);
    svgParts.push(`  </g>`);
  }

  svgParts.push('</svg>');

  return {
    svg: svgParts.join('\n'),
    width: contentWidth,
    height: contentHeight,
  };
}

export { createTheme, darkTheme, dimColor, resolveColor } from './colors';
export { escapeXml, getDefaultFontConfig } from './text';
