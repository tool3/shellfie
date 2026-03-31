import type {
  FontConfig,
  Gradient,
  ParsedLine,
  RenderOptions,
  ResolvedBackground,
  ResolvedFooterConfig,
  ResolvedGlow,
  ResolvedHeaderConfig,
  ResolvedBadge,
  ResolvedLineNumbers,
  ResolvedWatermark,
  Template,
  Theme,
} from '../types';
import { parseAnsi } from '../parser';
import { createPatternDef } from '../patterns';
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
  gutterWidth: number;
  contentWidth: number;
  contentHeight: number;
}

const calculateDimensions = (lines: ParsedLine[], options: RenderOptions): Dimensions => {
  const { template, font, padding, watermark, header, footer, lineNumbers } = options;

  const charWidth = font.size * font.charWidth;
  const lineHeight = font.size * font.lineHeight;

  const maxLineWidth = lines.reduce((max, line) => {
    const width = line.spans.reduce((sum, span) => sum + span.text.length, 0);
    return Math.max(max, width);
  }, 0);

  // Compute gutter width for line numbers
  let gutterWidth = 0;
  if (lineNumbers) {
    const lastLineNum = lineNumbers.startFrom + lines.length - 1;
    const digitCount = Math.max(2, String(lastLineNum).length);
    gutterWidth = charWidth * digitCount + charWidth * 2; // digits + gap
  }

  const columns = options.width ?? maxLineWidth;
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
    gutterWidth,
    contentWidth: textWidth + gutterWidth + padding.left + padding.right,
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
  showControls: boolean,
  titleAlignment: 'left' | 'center' | 'right',
  titleStyle: 'text' | 'tab-underline' | 'tab-box',
  badge: ResolvedBadge | null
): string => {
  if (!template.shell.titleBar) return '';

  const { borderRadius, controlsPosition, padding: shellPadding, controlStyle } = template.shell;
  const shellBorder = template.shell.border;
  const shellBorderWidth = shellBorder ? template.shell.borderWidth : 0;
  const controls = showControls;
  const titleBarHeight = header?.height ?? template.shell.titleBarHeight;
  const backgroundColor = header?.backgroundColor ?? theme.background;
  const showHeaderBorder = header?.border ?? false;
  const headerBorderColor = header?.borderColor ?? `${theme.foreground}1a`;
  const borderWidth = header?.borderWidth ?? 1;
  const bgHeight = showHeaderBorder ? titleBarHeight - borderWidth : titleBarHeight;

  const parts: string[] = [];

  // Only draw separate title bar background if it differs from the main background
  // This avoids anti-aliasing artifacts from overlapping shapes with rounded corners
  const needsBackground = backgroundColor !== theme.background;

  if (needsBackground) {
    // When terminal bg is transparent, inset by 1px so overlay gridlines remain visible as borders
    const bgInset = (theme.background === 'transparent' && !shellBorder) ? 1 : 0;
    const bgX = bgInset;
    const bgY = bgInset;
    const bgW = contentWidth - bgInset * 2;
    const bgH = bgHeight - bgInset;
    parts.push(`<rect x="${bgX}" y="${bgY}" width="${bgW}" height="${bgH}" fill="${backgroundColor}" rx="${borderRadius}" ry="${borderRadius}"/>`);

    if (bgH > borderRadius) {
      parts.push(`<rect x="${bgX}" y="${bgH - borderRadius + bgY}" width="${bgW}" height="${borderRadius}" fill="${backgroundColor}"/>`);
    }
  }

  if (showHeaderBorder) {
    parts.push(`<rect x="0" y="${titleBarHeight - borderWidth}" width="${contentWidth}" height="${borderWidth}" fill="${headerBorderColor}" shape-rendering="crispEdges"/>`);
  }

  if (controls) {
    const controlY = bgHeight / 2;
    const controlX = controlsPosition === 'left' ? shellPadding : contentWidth - shellPadding;
    parts.push(renderControls(template, controlX, controlY));
  }

  // Compute badge dimensions early so title can account for badge space
  const badgeFontSize = badge ? font.size - 4 : 0;
  const hasPill = badge ? (badge.backgroundColor || badge.borderColor) : false;
  const badgePadH = hasPill ? 6 : 0;
  const badgeTextWidth = badge ? badge.label.length * badgeFontSize * font.charWidth : 0;
  const badgeTotalWidth = badge ? badgeTextWidth + badgePadH * 2 : 0;
  const badgeGap = badge ? 8 : 0; // gap between title and badge

  if (title) {
    // Compute title position based on alignment
    const controlsWidth = controls ? controlStyle.spacing * 2 + controlStyle.size + shellPadding : 0;
    // Reserve space on the right for badge
    const rightReserved = badgeTotalWidth + badgeGap;
    let textX: number;
    let textAnchor: string;

    switch (titleAlignment) {
      case 'left':
        textX = controlsPosition === 'left' && controls ? controlsWidth + shellPadding : shellPadding;
        textAnchor = 'start';
        break;
      case 'right':
        textX = controlsPosition === 'right' && controls
          ? contentWidth - controlsWidth - shellPadding - rightReserved
          : contentWidth - shellPadding - rightReserved;
        textAnchor = 'end';
        break;
      case 'center':
      default:
        textX = contentWidth / 2;
        textAnchor = 'middle';
        break;
    }

    const textY = bgHeight / 2 + font.size / 3;
    const titleFontSize = font.size - 2;
    parts.push(`<text x="${r(textX)}" y="${r(textY)}" fill="${theme.foreground}" font-family="${font.family}" font-size="${titleFontSize}" text-anchor="${textAnchor}" opacity="0.8">${escapeXml(title)}</text>`);

    // Title style decorations
    if (titleStyle === 'tab-underline') {
      const titleWidth = title.length * titleFontSize * font.charWidth;
      let underlineX: number;
      if (textAnchor === 'start') underlineX = textX;
      else if (textAnchor === 'end') underlineX = textX - titleWidth;
      else underlineX = textX - titleWidth / 2;
      const underlineY = bgHeight - 2;
      parts.push(`<rect x="${r(underlineX)}" y="${r(underlineY)}" width="${r(titleWidth)}" height="2" fill="${theme.blue}" rx="1" ry="1"/>`);
    } else if (titleStyle === 'tab-box') {
      const titleWidth = title.length * titleFontSize * font.charWidth;
      const tabPadH = 8;
      const tabPadV = 4;
      let tabX: number;
      if (textAnchor === 'start') tabX = textX - tabPadH;
      else if (textAnchor === 'end') tabX = textX - titleWidth - tabPadH;
      else tabX = textX - titleWidth / 2 - tabPadH;
      const tabY = (bgHeight - titleFontSize) / 2 - tabPadV;
      const tabW = titleWidth + tabPadH * 2;
      const tabH = titleFontSize + tabPadV * 2;
      const tabRadius = 4;
      // Tab box: rounded top corners, flat bottom (achieved with clip)
      parts.push(`<rect x="${r(tabX)}" y="${r(tabY)}" width="${r(tabW)}" height="${r(tabH)}" fill="${theme.foreground}15" rx="${tabRadius}" ry="${tabRadius}"/>`);
      // Flat bottom edge: cover bottom rounded corners
      parts.push(`<rect x="${r(tabX)}" y="${r(tabY + tabH - tabRadius)}" width="${r(tabW)}" height="${tabRadius}" fill="${theme.foreground}15"/>`);
    }
  }

  // Badge (right-aligned)
  if (badge) {
    const badgePadV = hasPill ? 4 : 0;
    const badgeWidth = badgeTotalWidth;
    const badgeHeight = badgeFontSize + badgePadV * 2;
    const badgeX = controlsPosition === 'right' && controls
      ? contentWidth - shellPadding - controlStyle.spacing * 2 - controlStyle.size - shellPadding - badgeWidth
      : contentWidth - shellPadding - badgeWidth;
    const badgeY = (bgHeight - badgeHeight) / 2;

    if (hasPill) {
      const badgeRadius = badge.borderRadius ?? badgeHeight / 2;
      let badgeRect = `<rect x="${r(badgeX)}" y="${r(badgeY)}" width="${r(badgeWidth)}" height="${r(badgeHeight)}" fill="${badge.backgroundColor ?? 'none'}" rx="${r(badgeRadius)}" ry="${r(badgeRadius)}"`;
      if (badge.borderColor) {
        badgeRect += ` stroke="${badge.borderColor}" stroke-width="${badge.borderWidth}"`;
      }
      badgeRect += '/>';
      parts.push(badgeRect);
    }

    parts.push(`<text x="${r(badgeX + badgeWidth / 2)}" y="${r(badgeY + badgeHeight / 2 + badgeFontSize / 3)}" fill="${badge.color}" font-family="${font.family}" font-size="${badgeFontSize}" text-anchor="middle" opacity="${badge.opacity}">${escapeXml(badge.label)}</text>`);
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

const createGlowDefs = (glow: ResolvedGlow): string => {
  return `<filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${glow.strength}" result="blur"/>
      <feFlood flood-color="${glow.color}" flood-opacity="${glow.opacity}"/>
      <feComposite in2="blur" operator="in"/>
    </filter>`;
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
  const {
    template, title, titleAlignment, titleStyle, theme, font, padding,
    watermark, customGlyphs, header, footer, controls, background,
    lineNumbers, badge, backgroundOpacity, glow, overlays,
  } = options;
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
  if (glow) defs.push(createGlowDefs(glow));
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
    // Add pattern definition if specified
    if (background.pattern) {
      defs.push(createPatternDef(background.pattern, 'bg-pattern'));
    }
  }

  // Add gradient border definition if border color is a gradient
  const { borderColor } = template.shell;
  let borderStroke: string;
  if (isGradient(borderColor)) {
    defs.push(createGradientDef(borderColor, 'border-gradient', terminalWidth, terminalHeight));
    borderStroke = 'url(#border-gradient)';
  } else {
    borderStroke = borderColor;
  }

  if (defs.length > 0) {
    svgParts.push(`  <defs>\n    ${defs.join('\n    ')}\n  </defs>`);
  }

  // Outer background (only if specified)
  if (background) {
    const bgRadius = background.borderRadius;
    svgParts.push(`  <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="${bgFill}" rx="${bgRadius}" ry="${bgRadius}"/>`);
    // Pattern overlay on background
    if (background.pattern) {
      svgParts.push(`  <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="url(#bg-pattern)" rx="${bgRadius}" ry="${bgRadius}"/>`);
    }
  }

  // Decorative overlays (between background and terminal)
  const rawOverlays = typeof overlays === 'function' ? overlays(svgWidth, svgHeight) : overlays;
  const resolvedOverlays = typeof rawOverlays === 'string' ? [rawOverlays] : rawOverlays ?? [];
  for (const overlay of resolvedOverlays) {
    svgParts.push(`  <g class="overlay">${overlay}</g>`);
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

  // Glow layer (colored blur around terminal)
  if (glow) {
    svgParts.push(`${indent}<rect x="0.5" y="0.5" width="${terminalWidth - 1}" height="${terminalHeight - 1}" fill="none" stroke="${glow.color}" stroke-width="${template.shell.borderWidth + 2}" rx="${template.shell.borderRadius}" ry="${template.shell.borderRadius}" filter="url(#glow)"/>`);
  }

  // Terminal Background
  const bgOpacityAttr = backgroundOpacity < 1 ? ` opacity="${backgroundOpacity}"` : '';
  svgParts.push(`${indent}<rect x="0" y="0" width="${terminalWidth}" height="${terminalHeight}" fill="${theme.background}" rx="${template.shell.borderRadius}" ry="${template.shell.borderRadius}"${bgOpacityAttr}/>`);

  // Title bar (rendered before border so border paints on top)
  if (template.shell.titleBar) {
    svgParts.push(
      `${indent}<g class="title-bar">`,
      `${indent}  ${renderTitleBar(template, title, terminalWidth, theme, font, header, controls, titleAlignment, titleStyle, badge)}`,
      `${indent}</g>`
    );
  }

  // Border (rendered after title bar so it sits on top of header bg)
  if (template.shell.border) {
    const bw = template.shell.borderWidth;
    const br = template.shell.borderRadius;
    if (br > 0) {
      // Rounded borders use stroke (no overlap issue with rounded corners)
      const halfBw = bw / 2;
      svgParts.push(`${indent}<rect x="${halfBw}" y="${halfBw}" width="${terminalWidth - bw}" height="${terminalHeight - bw}" fill="none" stroke="${borderStroke}" stroke-width="${bw}" rx="${br}" ry="${br}"/>`);
    } else {
      // Sharp corners: use filled rects for pixel-perfect alignment (no anti-aliasing artifacts)
      const tw = terminalWidth;
      const th = terminalHeight;
      svgParts.push(`${indent}<path d="M 0 0 L ${tw} 0 L ${tw} ${bw} L 0 ${bw} Z M 0 ${th - bw} L ${tw} ${th - bw} L ${tw} ${th} L 0 ${th} Z M 0 ${bw} L ${bw} ${bw} L ${bw} ${th - bw} L 0 ${th - bw} Z M ${tw - bw} ${bw} L ${tw} ${bw} L ${tw} ${th - bw} L ${tw - bw} ${th - bw} Z" fill="${borderStroke}" fill-rule="nonzero" shape-rendering="crispEdges"/>`);
    }
  }

  // Process content
  const contentX = padding.left + dim.gutterWidth;
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

  // Text layer (includes line numbers)
  svgParts.push(`${indent}<g class="text">`);
  lines.forEach((line, lineIndex) => {
    const y = contentY + lineIndex * dim.lineHeight + font.size;

    // Render line number
    if (lineNumbers) {
      const lineNum = lineNumbers.startFrom + lineIndex;
      const gutterX = padding.left + dim.gutterWidth - dim.charWidth; // right edge of gutter minus gap
      svgParts.push(`${indent}  <text x="${r(gutterX)}" y="${r(y)}" font-family="${fontFamily}" font-size="${font.size}" fill="${lineNumbers.color}" text-anchor="end" xml:space="preserve">${lineNum}</text>`);
    }

    if (line.spans.length === 0) return;

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
