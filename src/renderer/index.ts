import type {
  FontConfig,
  Gradient,
  ParsedLine,
  RenderOptions,
  ResolvedBackground,
  ResolvedFooterConfig,
  ResolvedHeaderConfig,
  ResolvedWatermark,
  Template,
  Theme,
} from '../types';
import { parseAnsi } from '../parser';
import { escapeXml, renderSpan } from './text';
import { createGradientDef, isGradient } from '../gradient';

/**
 * Round a coordinate value to avoid floating-point precision issues in SVG rendering.
 */
function r(value: number): number {
  return Math.round(value * 100) / 100;
}

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
  const { template, font, padding, watermark, header, footer } = options;

  const charWidth = font.size * font.charWidth;
  const lineHeight = font.size * font.lineHeight;

  const maxLineWidth = lines.reduce((max, line) => {
    const width = line.spans.reduce((sum, span) => sum + span.text.length, 0);
    return Math.max(max, width);
  }, 0);

  const columns = options.width ?? Math.min(maxLineWidth, 40);
  const textWidth = columns * charWidth;
  const textHeight = lines.length * lineHeight;
  const titleBarHeight = template.shell.titleBar ? (header?.height ?? template.shell.titleBarHeight) : 0;
  const footerHeight = footer?.height ?? 0;
  const wmFontSize = font.size - 4;
  const watermarkHeight = watermark
    ? watermark.style.paddingTop + watermark.style.marginTop + wmFontSize + watermark.style.paddingBottom + watermark.style.marginBottom
    : 0;

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

const renderWindowsButton = (
  centerX: number,
  centerY: number,
  size: number,
  type: 'minimize' | 'maximize' | 'close',
  color: string
): string => {
  const iconSize = type === 'close' ? size * 0.7 : size * 0.5;
  const halfIcon = iconSize / 2;

  switch (type) {
    case 'minimize':
      // Horizontal dash "-"
      return `<line x1="${centerX - halfIcon}" y1="${centerY}" x2="${centerX + halfIcon}" y2="${centerY}" stroke="${color}" stroke-width="1"/>`;
    case 'maximize':
      // Square outline "□"
      return `<rect x="${centerX - halfIcon}" y="${centerY - halfIcon}" width="${iconSize}" height="${iconSize}" fill="none" stroke="${color}" stroke-width="1"/>`;
    case 'close':
      // X mark "×"
      return `<g>
        <line x1="${centerX - halfIcon}" y1="${centerY - halfIcon}" x2="${centerX + halfIcon}" y2="${centerY + halfIcon}" stroke="${color}" stroke-width="1.5"/>
        <line x1="${centerX + halfIcon}" y1="${centerY - halfIcon}" x2="${centerX - halfIcon}" y2="${centerY + halfIcon}" stroke="${color}" stroke-width="1.5"/>
      </g>`;
  }
};

const renderControls = (template: Template, x: number, y: number): string => {
  const { size, spacing, radius, close, minimize, maximize } = template.shell.controlStyle;
  const position = template.shell.controlsPosition;
  const useCircles = radius > 0;

  let buttons: string[];

  if (useCircles) {
    if (position === 'left') {
      // macOS default: close, minimize, maximize from left to right
      buttons = [
        `<circle cx="${x}" cy="${y}" r="${radius}" fill="${close}"/>`,
        `<circle cx="${x + spacing}" cy="${y}" r="${radius}" fill="${minimize}"/>`,
        `<circle cx="${x + spacing * 2}" cy="${y}" r="${radius}" fill="${maximize}"/>`,
      ];
    } else {
      // macOS right: reversed order, aligned to right (maximize, minimize, close from left to right)
      buttons = [
        `<circle cx="${x - spacing * 2}" cy="${y}" r="${radius}" fill="${maximize}"/>`,
        `<circle cx="${x - spacing}" cy="${y}" r="${radius}" fill="${minimize}"/>`,
        `<circle cx="${x}" cy="${y}" r="${radius}" fill="${close}"/>`,
      ];
    }
  } else {
    // Windows style with icon symbols - all icons are white
    const iconColor = '#ffffff';
    if (position === 'right') {
      // Windows default: minimize, maximize, close from left to right (aligned right)
      // spacing is the distance between button centers
      const closeX = x - spacing / 2;
      const maxX = closeX - spacing;
      const minX = maxX - spacing;
      buttons = [
        renderWindowsButton(minX, y, size, 'minimize', iconColor),
        renderWindowsButton(maxX, y, size, 'maximize', iconColor),
        renderWindowsButton(closeX, y, size, 'close', iconColor),
      ];
    } else {
      // Windows left: reversed order, aligned to left (close, maximize, minimize from left to right)
      const closeX = x + spacing / 2;
      const maxX = closeX + spacing;
      const minX = maxX + spacing;
      buttons = [
        renderWindowsButton(closeX, y, size, 'close', iconColor),
        renderWindowsButton(maxX, y, size, 'maximize', iconColor),
        renderWindowsButton(minX, y, size, 'minimize', iconColor),
      ];
    }
  }

  return buttons.join('\n    ');
};

const renderTitleBar = (
  template: Template,
  title: string,
  contentWidth: number,
  theme: Theme,
  font: FontConfig,
  header: ResolvedHeaderConfig | null,
  showControls: boolean
): string => {
  if (!template.shell.titleBar) return '';

  const { borderRadius, controlsPosition, padding: shellPadding } = template.shell;
  const controls = showControls;
  const titleBarHeight = header?.height ?? template.shell.titleBarHeight;
  const backgroundColor = header?.backgroundColor ?? theme.background;
  const showBorder = header?.border ?? template.shell.border;
  const borderColor = header?.borderColor ?? template.shell.borderColor ?? `${theme.foreground}1a`;
  const borderWidth = header?.borderWidth ?? template.shell.borderWidth;
  const bgHeight = showBorder ? titleBarHeight - borderWidth : titleBarHeight;

  const parts: string[] = [];

  // Only draw separate title bar background if it differs from the main background
  // This avoids anti-aliasing artifacts from overlapping shapes with rounded corners
  const needsBackground = backgroundColor !== theme.background || showBorder;

  if (needsBackground) {
    parts.push(`<rect x="0" y="0" width="${contentWidth}" height="${bgHeight}" fill="${backgroundColor}" rx="${borderRadius}" ry="${borderRadius}"/>`);

    if (bgHeight > borderRadius) {
      parts.push(`<rect x="0" y="${bgHeight - borderRadius}" width="${contentWidth}" height="${borderRadius}" fill="${backgroundColor}"/>`);
    }
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
    parts.push(`<text x="${r(contentWidth / 2)}" y="${r(bgHeight / 2 + font.size / 3)}" fill="${theme.foreground}" font-family="${font.family}" font-size="${font.size - 2}" text-anchor="middle" opacity="0.8">${escapeXml(title)}</text>`);
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

const renderTextWatermark = (text: string, x: number, y: number, theme: Theme, font: FontConfig): string => {
  const lines = parseAnsi(text);
  const line = lines.find(l => l.spans.length > 0);
  if (!line) return '';

  const wmFont: FontConfig = { ...font, size: font.size - 4 };
  const charWidth = wmFont.size * wmFont.charWidth;
  const totalChars = line.spans.reduce((sum, span) => sum + span.text.length, 0);
  const startX = x - totalChars * charWidth;

  let currentX = startX;
  const tspans: string[] = [];
  const backgrounds: string[] = [];

  for (const span of line.spans) {
    const result = renderSpan(span, currentX, y, wmFont, theme, false);
    if (result.text) tspans.push(result.text);
    if (result.background) backgrounds.push(result.background);
    currentX += result.width;
  }

  const textElement = `<text y="${y}" font-family="${font.family}" font-size="${wmFont.size}" xml:space="preserve">${tspans.join('')}</text>`;

  // Include backgrounds for inverse text
  if (backgrounds.length > 0) {
    return `<g>${backgrounds.join('')}${textElement}</g>`;
  }

  return textElement;
};

const renderWatermark = (
  watermark: ResolvedWatermark,
  x: number,
  y: number,
  theme: Theme,
  font: FontConfig
): string => {
  const { cssString } = watermark.style;
  const styleAttr = cssString ? ` style="${cssString}"` : '';

  if (watermark.type === 'text') {
    const textContent = renderTextWatermark(watermark.content, x, y, theme, font);
    if (styleAttr && textContent) {
      return textContent.replace('<text ', `<text${styleAttr} `);
    }
    return textContent;
  }

  // Markup type - render raw SVG markup
  // x,y is the bottom-right anchor point
  // Use text-anchor="end" for right-aligned text elements
  const wmFontSize = font.size - 4;
  return `<g transform="translate(${x}, ${y})" font-family="${font.family}" font-size="${wmFontSize}" fill="${theme.foreground}"${styleAttr}>${watermark.content}</g>`;
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

const createShadowDefs = (width: number, height: number, borderRadius: number): string => {
  return `<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur"/>
      <feOffset in="blur" dx="0" dy="4" result="offsetBlur"/>
      <feFlood flood-color="#000000" flood-opacity="0.3" result="color"/>
      <feComposite in="color" in2="offsetBlur" operator="in" result="shadow"/>
    </filter>
    <mask id="shadow-mask">
      <rect x="-50" y="-50" width="${width + 100}" height="${height + 100}" fill="white"/>
      <rect x="0" y="0" width="${width}" height="${height}" rx="${borderRadius}" ry="${borderRadius}" fill="black"/>
    </mask>`;
};

export const renderSvg = (lines: ParsedLine[], options: RenderOptions): RenderResult => {
  const { template, title, theme, font, padding, watermark, customGlyphs, header, footer, controls, background } = options;
  const dim = calculateDimensions(lines, options);
  const fontFamily = font.embedData ? `'EmbeddedFont', ${font.family}` : font.family;

  // Use exact dimensions if provided, otherwise use calculated content dimensions
  // Round to avoid floating-point precision issues in SVG rendering
  const terminalWidth = r(options.width ?? dim.contentWidth);
  const terminalHeight = r(options.height ?? dim.contentHeight);

  // If background is specified, add padding around the terminal
  const bgPadding = background?.padding ?? 0;
  const svgWidth = terminalWidth + bgPadding * 2;
  const svgHeight = terminalHeight + bgPadding * 2;

  const svgParts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">`,
  ];

  // Defs
  const defs: string[] = [];
  if (template.shell.shadow) defs.push(createShadowDefs(terminalWidth, terminalHeight, template.shell.borderRadius));
  if (font.embedData) defs.push(`<style>${generateFontFace(font)}</style>`);

  // Add gradient definition if background is a gradient
  let bgFill = 'none';
  if (background) {
    if (isGradient(background.value)) {
      defs.push(createGradientDef(background.value, 'bg-gradient', svgWidth, svgHeight));
      bgFill = 'url(#bg-gradient)';
    } else {
      bgFill = background.value;
    }
  }

  if (defs.length > 0) {
    svgParts.push(`  <defs>\n    ${defs.join('\n    ')}\n  </defs>`);
  }

  // Outer background (only if specified)
  if (background) {
    const bgRadius = background.borderRadius;
    svgParts.push(`  <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="${bgFill}" rx="${bgRadius}" ry="${bgRadius}"/>`);
  }

  // Terminal group (offset by background padding)
  const terminalOffset = bgPadding > 0 ? `  <g transform="translate(${bgPadding}, ${bgPadding})">` : '';
  const terminalEnd = bgPadding > 0 ? '  </g>' : '';
  const indent = bgPadding > 0 ? '    ' : '  ';

  if (terminalOffset) {
    svgParts.push(terminalOffset);
  }

  // Shadow layer (masked to only show outside the rounded rect)
  if (template.shell.shadow) {
    svgParts.push(`${indent}<g mask="url(#shadow-mask)">
${indent}  <rect x="0" y="0" width="${terminalWidth}" height="${terminalHeight}" fill="${theme.background}" rx="${template.shell.borderRadius}" ry="${template.shell.borderRadius}" filter="url(#shadow)"/>
${indent}</g>`);
  }

  // Terminal Background
  svgParts.push(`${indent}<rect x="0" y="0" width="${terminalWidth}" height="${terminalHeight}" fill="${theme.background}" rx="${template.shell.borderRadius}" ry="${template.shell.borderRadius}"/>`);

  // Border
  if (template.shell.border) {
    svgParts.push(`${indent}<rect x="0.5" y="0.5" width="${terminalWidth - 1}" height="${terminalHeight - 1}" fill="none" stroke="${template.shell.borderColor}" stroke-width="${template.shell.borderWidth}" rx="${template.shell.borderRadius}" ry="${template.shell.borderRadius}"/>`);
  }

  // Title bar
  if (template.shell.titleBar) {
    svgParts.push(
      `${indent}<g class="title-bar">`,
      `${indent}  ${renderTitleBar(template, title, terminalWidth, theme, font, header, controls)}`,
      `${indent}</g>`
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
    svgParts.push(`${indent}<g class="backgrounds">`);
    backgrounds.forEach(bg => svgParts.push(`${indent}  ${bg}`));
    svgParts.push(`${indent}</g>`);
  }

  // Glyphs layer
  if (glyphs.length > 0) {
    svgParts.push(`${indent}<g class="glyphs">`);
    glyphs.forEach(glyph => svgParts.push(`${indent}  ${glyph}`));
    svgParts.push(`${indent}</g>`);
  }

  // Text layer
  svgParts.push(`${indent}<g class="text">`);
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
      svgParts.push(`${indent}  <text y="${r(y)}" font-family="${fontFamily}" font-size="${font.size}" xml:space="preserve">${tspans.join('')}</text>`);
    }
  });
  svgParts.push(`${indent}</g>`);

  // Watermark
  if (watermark) {
    const wmX = terminalWidth - watermark.style.paddingRight - watermark.style.marginRight;
    // Position watermark at bottom of SVG (use exact height if provided, otherwise use content height)
    const wmY = (options.height ?? dim.contentHeight) - watermark.style.paddingBottom - watermark.style.marginBottom;
    svgParts.push(`${indent}${renderWatermark(watermark, wmX, wmY, theme, font)}`);
  }

  // Footer
  if (footer) {
    const footerY = dim.titleBarHeight + padding.top + dim.textHeight + padding.bottom + dim.watermarkHeight;
    svgParts.push(
      `${indent}<g class="footer">`,
      `${indent}  ${renderFooterBar(footer, terminalWidth, footerY, template.shell.borderRadius)}`,
      `${indent}</g>`
    );
  }

  // Close terminal group if we opened one
  if (terminalEnd) {
    svgParts.push(terminalEnd);
  }

  svgParts.push('</svg>');

  return {
    svg: svgParts.join('\n'),
    width: svgWidth,
    height: svgHeight,
  };
};

export { createTheme, darkTheme, dimColor, resolveColor } from './colors';
export { escapeXml, getDefaultFontConfig } from './text';
