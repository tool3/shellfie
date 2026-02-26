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

interface Dimensions {
  charWidth: number;
  lineHeight: number;
  textWidth: number;
  textHeight: number;
  titleBarHeight: number;
  footerHeight: number;
  watermarkHeight: number;
  contentWidth: number;
  contentHeight: number;
}

const calculateDimensions = (lines: ParsedLine[], options: RenderOptions): Dimensions => {
  const { template, font, padding, watermark, watermarkPadding, header, footer } = options;

  const charWidth = font.size * font.charWidth;
  const lineHeight = font.size * font.lineHeight;

  const maxLineWidth = lines.reduce((max, line) => {
    const width = line.spans.reduce((sum, span) => sum + span.text.length, 0);
    return Math.max(max, width);
  }, 0);

  const columns = options.width ?? Math.max(maxLineWidth, 40);
  const textWidth = columns * charWidth;
  const textHeight = lines.length * lineHeight;
  const titleBarHeight = template.shell.titleBar ? (header?.height ?? template.shell.titleBarHeight) : 0;
  const footerHeight = footer?.height ?? 0;
  const wmFontSize = font.size - 4;
  const watermarkHeight = watermark ? wmFontSize + watermarkPadding.bottom : 0;

  return {
    charWidth,
    lineHeight,
    textWidth,
    textHeight,
    titleBarHeight,
    footerHeight,
    watermarkHeight,
    contentWidth: textWidth + padding.left + padding.right,
    contentHeight: textHeight + padding.top + padding.bottom + titleBarHeight + footerHeight + watermarkHeight,
  };
};

const renderControls = (template: Template, x: number, y: number): string => {
  if (!template.shell.controls) return '';

  const { size, spacing, radius, close, minimize, maximize } = template.shell.controlStyle;

  const buttons = template.shell.controlsPosition === 'left'
    ? [
        `<circle cx="${x}" cy="${y}" r="${radius}" fill="${close}"/>`,
        `<circle cx="${x + spacing}" cy="${y}" r="${radius}" fill="${minimize}"/>`,
        `<circle cx="${x + spacing * 2}" cy="${y}" r="${radius}" fill="${maximize}"/>`,
      ]
    : [
        `<rect x="${x - size * 3 - spacing * 2}" y="${y - size / 2}" width="${size}" height="${size}" fill="${minimize}" rx="1"/>`,
        `<rect x="${x - size * 2 - spacing}" y="${y - size / 2}" width="${size}" height="${size}" fill="${maximize}" rx="1"/>`,
        `<rect x="${x - size}" y="${y - size / 2}" width="${size}" height="${size}" fill="${close}" rx="1"/>`,
      ];

  return buttons.join('\n    ');
};

const renderTitleBar = (
  template: Template,
  title: string,
  contentWidth: number,
  theme: Theme,
  font: FontConfig,
  header: ResolvedHeaderConfig | null
): string => {
  if (!template.shell.titleBar) return '';

  const { borderRadius, controls, controlsPosition, padding: shellPadding } = template.shell;
  const titleBarHeight = header?.height ?? template.shell.titleBarHeight;
  const backgroundColor = header?.backgroundColor ?? theme.background;
  const showBorder = header?.border ?? true;
  const borderColor = header?.borderColor ?? `${theme.foreground}1a`;
  const borderWidth = header?.borderWidth ?? 1;
  const bgHeight = showBorder ? titleBarHeight - borderWidth : titleBarHeight;

  const parts: string[] = [
    `<rect x="0" y="0" width="${contentWidth}" height="${bgHeight}" fill="${backgroundColor}" rx="${borderRadius}" ry="${borderRadius}"/>`,
  ];

  if (bgHeight > borderRadius) {
    parts.push(`<rect x="0" y="${bgHeight - borderRadius}" width="${contentWidth}" height="${borderRadius}" fill="${backgroundColor}"/>`);
  }

  if (showBorder) {
    parts.push(`<line x1="0" y1="${titleBarHeight - borderWidth / 2}" x2="${contentWidth}" y2="${titleBarHeight - borderWidth / 2}" stroke="${borderColor}" stroke-width="${borderWidth}"/>`);
  }

  if (controls) {
    const controlY = bgHeight / 2;
    const controlX = controlsPosition === 'left' ? shellPadding : contentWidth - shellPadding;
    parts.push(renderControls(template, controlX, controlY));
  }

  if (title) {
    parts.push(`<text x="${contentWidth / 2}" y="${bgHeight / 2 + font.size / 3}" fill="${theme.foreground}" font-family="${font.family}" font-size="${font.size - 2}" text-anchor="middle" opacity="0.8">${escapeXml(title)}</text>`);
  }

  return parts.join('\n    ');
};

const renderFooterBar = (
  footer: ResolvedFooterConfig,
  contentWidth: number,
  y: number,
  borderRadius: number
): string => {
  const bgY = footer.border ? y + footer.borderWidth : y;
  const bgHeight = footer.border ? footer.height - footer.borderWidth : footer.height;

  const parts: string[] = [];

  if (footer.border) {
    parts.push(`<line x1="0" y1="${y + footer.borderWidth / 2}" x2="${contentWidth}" y2="${y + footer.borderWidth / 2}" stroke="${footer.borderColor}" stroke-width="${footer.borderWidth}"/>`);
  }

  parts.push(
    `<rect x="0" y="${bgY}" width="${contentWidth}" height="${bgHeight}" fill="${footer.backgroundColor}" rx="${borderRadius}" ry="${borderRadius}"/>`,
    `<rect x="0" y="${bgY}" width="${contentWidth}" height="${borderRadius}" fill="${footer.backgroundColor}"/>`
  );

  return parts.join('\n    ');
};

const renderWatermark = (watermark: string, x: number, y: number, theme: Theme, font: FontConfig): string => {
  const lines = parseAnsi(watermark);
  const line = lines.find(l => l.spans.length > 0);
  if (!line) return '';

  const wmFont: FontConfig = { ...font, size: font.size - 4 };
  const charWidth = wmFont.size * wmFont.charWidth;
  const totalChars = line.spans.reduce((sum, span) => sum + span.text.length, 0);
  const startX = x - totalChars * charWidth;

  let currentX = startX;
  const tspans = line.spans.reduce<string[]>((acc, span) => {
    const result = renderSpan(span, currentX, y, wmFont, theme, false);
    currentX += result.width;
    return result.text ? [...acc, result.text] : acc;
  }, []);

  return `<text y="${y}" font-family="${font.family}" font-size="${wmFont.size}" xml:space="preserve">${tspans.join('')}</text>`;
};

const generateFontFace = (font: FontConfig): string => {
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
};

const SHADOW_FILTER = `<filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
    </filter>`;

export const renderSvg = (lines: ParsedLine[], options: RenderOptions): RenderResult => {
  const { template, title, theme, font, padding, watermark, watermarkPadding, customGlyphs, header, footer } = options;
  const dim = calculateDimensions(lines, options);
  const fontFamily = font.embedData ? `'EmbeddedFont', ${font.family}` : font.family;

  const svgParts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim.contentWidth} ${dim.contentHeight}" width="${dim.contentWidth}" height="${dim.contentHeight}">`,
  ];

  // Defs
  const defs: string[] = [];
  if (template.shell.shadow) defs.push(SHADOW_FILTER);
  if (font.embedData) defs.push(`<style>${generateFontFace(font)}</style>`);
  if (defs.length > 0) {
    svgParts.push(`  <defs>\n    ${defs.join('\n    ')}\n  </defs>`);
  }

  // Background
  const bgAttrs = [
    `x="0" y="0"`,
    `width="${dim.contentWidth}" height="${dim.contentHeight}"`,
    `fill="${theme.background}"`,
    `rx="${template.shell.borderRadius}" ry="${template.shell.borderRadius}"`,
    template.shell.shadow ? `filter="url(#shadow)"` : '',
  ].filter(Boolean);
  svgParts.push(`  <rect ${bgAttrs.join(' ')}/>`);

  // Border
  if (template.shell.border) {
    svgParts.push(`  <rect x="0.5" y="0.5" width="${dim.contentWidth - 1}" height="${dim.contentHeight - 1}" fill="none" stroke="${template.shell.borderColor}" stroke-width="${template.shell.borderWidth}" rx="${template.shell.borderRadius}" ry="${template.shell.borderRadius}"/>`);
  }

  // Title bar
  if (template.shell.titleBar) {
    svgParts.push(
      `  <g class="title-bar">`,
      `    ${renderTitleBar(template, title, dim.contentWidth, theme, font, header)}`,
      `  </g>`
    );
  }

  // Process content
  const contentX = padding.left;
  const contentY = dim.titleBarHeight + padding.top;
  const backgrounds: string[] = [];
  const glyphs: string[] = [];

  lines.forEach((line, lineIndex) => {
    const y = contentY + lineIndex * dim.lineHeight + font.size;
    let x = contentX;

    line.spans.forEach(span => {
      const result = renderSpan(span, x, y, font, theme, customGlyphs);
      if (result.background) backgrounds.push(result.background);
      glyphs.push(...result.glyphs);
      x += result.width;
    });
  });

  // Backgrounds layer
  if (backgrounds.length > 0) {
    svgParts.push(`  <g class="backgrounds">`);
    backgrounds.forEach(bg => svgParts.push(`    ${bg}`));
    svgParts.push(`  </g>`);
  }

  // Glyphs layer
  if (glyphs.length > 0) {
    svgParts.push(`  <g class="glyphs">`);
    glyphs.forEach(glyph => svgParts.push(`    ${glyph}`));
    svgParts.push(`  </g>`);
  }

  // Text layer
  svgParts.push(`  <g class="text">`);
  lines.forEach((line, lineIndex) => {
    if (line.spans.length === 0) return;

    const y = contentY + lineIndex * dim.lineHeight + font.size;
    let x = contentX;
    const tspans: string[] = [];

    line.spans.forEach(span => {
      const result = renderSpan(span, x, y, font, theme, customGlyphs);
      if (result.text) tspans.push(result.text);
      x += result.width;
    });

    if (tspans.some(t => t.length > 0)) {
      svgParts.push(`    <text y="${y}" font-family="${fontFamily}" font-size="${font.size}" xml:space="preserve">${tspans.join('')}</text>`);
    }
  });
  svgParts.push(`  </g>`);

  // Watermark
  if (watermark) {
    const wmX = dim.contentWidth - watermarkPadding.right;
    const wmY = dim.titleBarHeight + padding.top + dim.textHeight + padding.bottom - watermarkPadding.bottom + (font.size - 4);
    svgParts.push(`  ${renderWatermark(watermark, wmX, wmY, theme, font)}`);
  }

  // Footer
  if (footer) {
    const footerY = dim.titleBarHeight + padding.top + dim.textHeight + padding.bottom + dim.watermarkHeight;
    svgParts.push(
      `  <g class="footer">`,
      `    ${renderFooterBar(footer, dim.contentWidth, footerY, template.shell.borderRadius)}`,
      `  </g>`
    );
  }

  svgParts.push('</svg>');

  return {
    svg: svgParts.join('\n'),
    width: dim.contentWidth,
    height: dim.contentHeight,
  };
};

export { createTheme, darkTheme, dimColor, resolveColor } from './colors';
export { escapeXml, getDefaultFontConfig } from './text';
