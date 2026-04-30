// Custom Glyph Rendering for Box Drawing and Block Element Characters
// Supported Unicode ranges:
// - Low Line / Overline (U+005F, U+203E) — drawn as cell-edge bars so they tile
// - Box Drawing (U+2500-U+257F)
// - Block Elements (U+2580-U+259F)
// - Braille Patterns (U+2800-U+28FF)
// - Symbols for Legacy Computing (U+1FB00-U+1FBFF)

/**
 * Round a coordinate value to 2 decimal places to eliminate floating-point precision artifacts
 * (e.g., 19.599999999999998 → 19.6) while preserving enough precision to avoid gaps between blocks.
 */
function r(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Parse a color string (hex, rgb, rgba) and return [r, g, b] components (0-255).
 */
function parseColor(color: string): [number, number, number] {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }
    if (hex.length >= 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
  }

  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1], 10),
      parseInt(rgbMatch[2], 10),
      parseInt(rgbMatch[3], 10),
    ];
  }

  // Fallback to black
  return [0, 0, 0];
}

/**
 * Blend foreground color with background color at given opacity.
 * Returns a solid hex color that looks like the foreground at the given opacity over the background.
 */
function blendColors(fg: string, bg: string, opacity: number): string {
  const [fgR, fgG, fgB] = parseColor(fg);
  const [bgR, bgG, bgB] = parseColor(bg);

  // Blend: result = fg * opacity + bg * (1 - opacity)
  const r = Math.round(fgR * opacity + bgR * (1 - opacity));
  const g = Math.round(fgG * opacity + bgG * (1 - opacity));
  const b = Math.round(fgB * opacity + bgB * (1 - opacity));

  // Return as hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function isCustomGlyph(codePoint: number): boolean {
  return (
    codePoint === 0x005f ||
    codePoint === 0x203e ||
    (codePoint >= 0x2500 && codePoint <= 0x257f) ||
    (codePoint >= 0x2580 && codePoint <= 0x259f) ||
    codePoint === 0x25a0 ||
    (codePoint >= 0x2800 && codePoint <= 0x28ff) ||
    (codePoint >= 0x1fb00 && codePoint <= 0x1fbff)
  );
}

export function containsCustomGlyphs(text: string): boolean {
  for (const char of text) {
    const codePoint = char.codePointAt(0);
    if (codePoint !== undefined && isCustomGlyph(codePoint)) {
      return true;
    }
  }
  return false;
}

export interface GlyphContext {
  cellWidth: number;
  cellHeight: number;
  x: number;
  y: number;
  color: string;
  backgroundColor: string;
  lineWidth: number;
  heavyLineWidth: number;
}

export interface GlyphResult {
  svg: string;
  handled: boolean;
}

export function renderCustomGlyph(
  char: string,
  ctx: GlyphContext
): GlyphResult {
  const codePoint = char.codePointAt(0);
  if (codePoint === undefined) {
    return { svg: '', handled: false };
  }

  // Low line (U+005F) and overline (U+203E): match U+2581 / U+2594 (1/8 blocks) so
  // sequences of underscores or overlines tile flush at the cell edge.
  if (codePoint === 0x005f || codePoint === 0x203e) {
    const { cellWidth, cellHeight, x, y, color } = ctx;
    const w = r(cellWidth);
    const h8 = r(cellHeight / 8);
    const rx = r(x);
    const ry = codePoint === 0x203e ? r(y) : r(y + cellHeight * 7 / 8);
    return {
      svg: `<rect x="${rx}" y="${ry}" width="${w}" height="${h8}" fill="${color}" shape-rendering="crispEdges"/>`,
      handled: true,
    };
  }

  if (codePoint >= 0x2500 && codePoint <= 0x257f) {
    return renderBoxDrawing(codePoint, ctx);
  }

  if (codePoint >= 0x2580 && codePoint <= 0x259f) {
    return renderBlockElement(codePoint, ctx);
  }

  // Black Square (U+25A0) - render as cell-width square, vertically centered
  if (codePoint === 0x25a0) {
    const { cellWidth, cellHeight, x, y, color } = ctx;
    const size = r(cellWidth);
    const squareY = r(y + (cellHeight - cellWidth) / 2);
    return {
      svg: `<rect x="${r(x)}" y="${squareY}" width="${size}" height="${size}" fill="${color}" shape-rendering="crispEdges"/>`,
      handled: true,
    };
  }

  if (codePoint >= 0x2800 && codePoint <= 0x28ff) {
    return renderBraille(codePoint, ctx);
  }

  if (codePoint >= 0x1fb00 && codePoint <= 0x1fbff) {
    return renderLegacyComputing(codePoint, ctx);
  }

  return { svg: '', handled: false };
}

// Box Drawing Characters (U+2500-U+257F)

interface BoxSegments {
  up: number;
  down: number;
  left: number;
  right: number;
}

// Segment values: 0=none, 1=light, 2=heavy, 3=double
function getBoxSegments(codePoint: number): BoxSegments | null {
  const boxMap: Record<number, [number, number, number, number]> = {
    0x2500: [0, 0, 1, 1], // ─
    0x2501: [0, 0, 2, 2], // ━
    0x2502: [1, 1, 0, 0], // │
    0x2503: [2, 2, 0, 0], // ┃
    0x2504: [0, 0, 1, 1], // ┄
    0x2505: [0, 0, 2, 2], // ┅
    0x2506: [1, 1, 0, 0], // ┆
    0x2507: [2, 2, 0, 0], // ┇
    0x2508: [0, 0, 1, 1], // ┈
    0x2509: [0, 0, 2, 2], // ┉
    0x250a: [1, 1, 0, 0], // ┊
    0x250b: [2, 2, 0, 0], // ┋
    0x250c: [0, 1, 0, 1], // ┌
    0x250d: [0, 1, 0, 2], // ┍
    0x250e: [0, 2, 0, 1], // ┎
    0x250f: [0, 2, 0, 2], // ┏
    0x2510: [0, 1, 1, 0], // ┐
    0x2511: [0, 1, 2, 0], // ┑
    0x2512: [0, 2, 1, 0], // ┒
    0x2513: [0, 2, 2, 0], // ┓
    0x2514: [1, 0, 0, 1], // └
    0x2515: [1, 0, 0, 2], // ┕
    0x2516: [2, 0, 0, 1], // ┖
    0x2517: [2, 0, 0, 2], // ┗
    0x2518: [1, 0, 1, 0], // ┘
    0x2519: [1, 0, 2, 0], // ┙
    0x251a: [2, 0, 1, 0], // ┚
    0x251b: [2, 0, 2, 0], // ┛
    0x251c: [1, 1, 0, 1], // ├
    0x251d: [1, 1, 0, 2], // ┝
    0x251e: [2, 1, 0, 1], // ┞
    0x251f: [1, 2, 0, 1], // ┟
    0x2520: [2, 2, 0, 1], // ┠
    0x2521: [2, 1, 0, 2], // ┡
    0x2522: [1, 2, 0, 2], // ┢
    0x2523: [2, 2, 0, 2], // ┣
    0x2524: [1, 1, 1, 0], // ┤
    0x2525: [1, 1, 2, 0], // ┥
    0x2526: [2, 1, 1, 0], // ┦
    0x2527: [1, 2, 1, 0], // ┧
    0x2528: [2, 2, 1, 0], // ┨
    0x2529: [2, 1, 2, 0], // ┩
    0x252a: [1, 2, 2, 0], // ┪
    0x252b: [2, 2, 2, 0], // ┫
    0x252c: [0, 1, 1, 1], // ┬
    0x252d: [0, 1, 2, 1], // ┭
    0x252e: [0, 1, 1, 2], // ┮
    0x252f: [0, 1, 2, 2], // ┯
    0x2530: [0, 2, 1, 1], // ┰
    0x2531: [0, 2, 2, 1], // ┱
    0x2532: [0, 2, 1, 2], // ┲
    0x2533: [0, 2, 2, 2], // ┳
    0x2534: [1, 0, 1, 1], // ┴
    0x2535: [1, 0, 2, 1], // ┵
    0x2536: [1, 0, 1, 2], // ┶
    0x2537: [1, 0, 2, 2], // ┷
    0x2538: [2, 0, 1, 1], // ┸
    0x2539: [2, 0, 2, 1], // ┹
    0x253a: [2, 0, 1, 2], // ┺
    0x253b: [2, 0, 2, 2], // ┻
    0x253c: [1, 1, 1, 1], // ┼
    0x253d: [1, 1, 2, 1], // ┽
    0x253e: [1, 1, 1, 2], // ┾
    0x253f: [1, 1, 2, 2], // ┿
    0x2540: [2, 1, 1, 1], // ╀
    0x2541: [1, 2, 1, 1], // ╁
    0x2542: [2, 2, 1, 1], // ╂
    0x2543: [2, 1, 2, 1], // ╃
    0x2544: [2, 1, 1, 2], // ╄
    0x2545: [1, 2, 2, 1], // ╅
    0x2546: [1, 2, 1, 2], // ╆
    0x2547: [2, 1, 2, 2], // ╇
    0x2548: [1, 2, 2, 2], // ╈
    0x2549: [2, 2, 2, 1], // ╉
    0x254a: [2, 2, 1, 2], // ╊
    0x254b: [2, 2, 2, 2], // ╋
    0x254c: [0, 0, 1, 1], // ╌
    0x254d: [0, 0, 2, 2], // ╍
    0x254e: [1, 1, 0, 0], // ╎
    0x254f: [2, 2, 0, 0], // ╏
    0x2550: [0, 0, 3, 3], // ═
    0x2551: [3, 3, 0, 0], // ║
    0x2552: [0, 1, 0, 3], // ╒
    0x2553: [0, 3, 0, 1], // ╓
    0x2554: [0, 3, 0, 3], // ╔
    0x2555: [0, 1, 3, 0], // ╕
    0x2556: [0, 3, 1, 0], // ╖
    0x2557: [0, 3, 3, 0], // ╗
    0x2558: [1, 0, 0, 3], // ╘
    0x2559: [3, 0, 0, 1], // ╙
    0x255a: [3, 0, 0, 3], // ╚
    0x255b: [1, 0, 3, 0], // ╛
    0x255c: [3, 0, 1, 0], // ╜
    0x255d: [3, 0, 3, 0], // ╝
    0x255e: [1, 1, 0, 3], // ╞
    0x255f: [3, 3, 0, 1], // ╟
    0x2560: [3, 3, 0, 3], // ╠
    0x2561: [1, 1, 3, 0], // ╡
    0x2562: [3, 3, 1, 0], // ╢
    0x2563: [3, 3, 3, 0], // ╣
    0x2564: [0, 1, 3, 3], // ╤
    0x2565: [0, 3, 1, 1], // ╥
    0x2566: [0, 3, 3, 3], // ╦
    0x2567: [1, 0, 3, 3], // ╧
    0x2568: [3, 0, 1, 1], // ╨
    0x2569: [3, 0, 3, 3], // ╩
    0x256a: [1, 1, 3, 3], // ╪
    0x256b: [3, 3, 1, 1], // ╫
    0x256c: [3, 3, 3, 3], // ╬
    0x256d: [0, 1, 0, 1], // ╭
    0x256e: [0, 1, 1, 0], // ╮
    0x256f: [1, 0, 1, 0], // ╯
    0x2570: [1, 0, 0, 1], // ╰
    0x2574: [0, 0, 1, 0], // ╴
    0x2575: [1, 0, 0, 0], // ╵
    0x2576: [0, 0, 0, 1], // ╶
    0x2577: [0, 1, 0, 0], // ╷
    0x2578: [0, 0, 2, 0], // ╸
    0x2579: [2, 0, 0, 0], // ╹
    0x257a: [0, 0, 0, 2], // ╺
    0x257b: [0, 2, 0, 0], // ╻
    0x257c: [0, 0, 1, 2], // ╼
    0x257d: [1, 2, 0, 0], // ╽
    0x257e: [0, 0, 2, 1], // ╾
    0x257f: [2, 1, 0, 0], // ╿
  };

  const segments = boxMap[codePoint];
  if (!segments) return null;

  return {
    up: segments[0],
    down: segments[1],
    left: segments[2],
    right: segments[3],
  };
}

function renderBoxDrawing(codePoint: number, ctx: GlyphContext): GlyphResult {
  if (codePoint >= 0x2571 && codePoint <= 0x2573) {
    return renderDiagonalLine(codePoint, ctx);
  }

  const segments = getBoxSegments(codePoint);
  if (!segments) {
    return { svg: '', handled: false };
  }

  const { cellWidth, cellHeight, x, y, color, lineWidth, heavyLineWidth } = ctx;
  // Pre-compute rounded values
  const rx = r(x);
  const ry = r(y);
  const rBottom = r(y + cellHeight);
  const rRight = r(x + cellWidth);
  const centerX = r(x + cellWidth / 2);
  const centerY = r(y + cellHeight / 2);

  const getWidth = (type: number): number => {
    if (type === 0) return 0;
    if (type === 1) return lineWidth;
    if (type === 2) return heavyLineWidth;
    return lineWidth;
  };

  const doubleOffset = r(lineWidth * 1.5);

  const hasDoubleUp = segments.up === 3;
  const hasDoubleDown = segments.down === 3;
  const hasDoubleLeft = segments.left === 3;
  const hasDoubleRight = segments.right === 3;

  if ((hasDoubleUp || hasDoubleDown) && (hasDoubleLeft || hasDoubleRight)) {
    return renderDoubleLineCorner(segments, ctx, doubleOffset);
  }

  const paths: string[] = [];

  if (segments.up > 0) {
    if (segments.up === 3) {
      paths.push(
        `<line x1="${r(centerX - doubleOffset)}" y1="${ry}" x2="${r(centerX - doubleOffset)}" y2="${centerY}" stroke="${color}" stroke-width="${lineWidth}"/>`,
        `<line x1="${r(centerX + doubleOffset)}" y1="${ry}" x2="${r(centerX + doubleOffset)}" y2="${centerY}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    } else {
      const w = getWidth(segments.up);
      // If there are double horizontal lines, stop the single vertical at the inner edge
      const endY = (hasDoubleLeft || hasDoubleRight) ? r(centerY - doubleOffset) : centerY;
      paths.push(
        `<line x1="${centerX}" y1="${ry}" x2="${centerX}" y2="${endY}" stroke="${color}" stroke-width="${w}"/>`
      );
    }
  }

  if (segments.down > 0) {
    if (segments.down === 3) {
      paths.push(
        `<line x1="${r(centerX - doubleOffset)}" y1="${centerY}" x2="${r(centerX - doubleOffset)}" y2="${rBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`,
        `<line x1="${r(centerX + doubleOffset)}" y1="${centerY}" x2="${r(centerX + doubleOffset)}" y2="${rBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    } else {
      const w = getWidth(segments.down);
      // If there are double horizontal lines, start the single vertical from the inner edge
      const startY = (hasDoubleLeft || hasDoubleRight) ? r(centerY + doubleOffset) : centerY;
      paths.push(
        `<line x1="${centerX}" y1="${startY}" x2="${centerX}" y2="${rBottom}" stroke="${color}" stroke-width="${w}"/>`
      );
    }
  }

  if (segments.left > 0) {
    if (segments.left === 3) {
      paths.push(
        `<line x1="${rx}" y1="${r(centerY - doubleOffset)}" x2="${centerX}" y2="${r(centerY - doubleOffset)}" stroke="${color}" stroke-width="${lineWidth}"/>`,
        `<line x1="${rx}" y1="${r(centerY + doubleOffset)}" x2="${centerX}" y2="${r(centerY + doubleOffset)}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    } else {
      const w = getWidth(segments.left);
      // If there are double vertical lines, stop the single horizontal at the inner edge
      const endX = (hasDoubleUp || hasDoubleDown) ? r(centerX - doubleOffset) : centerX;
      paths.push(
        `<line x1="${rx}" y1="${centerY}" x2="${endX}" y2="${centerY}" stroke="${color}" stroke-width="${w}"/>`
      );
    }
  }

  if (segments.right > 0) {
    if (segments.right === 3) {
      paths.push(
        `<line x1="${centerX}" y1="${r(centerY - doubleOffset)}" x2="${rRight}" y2="${r(centerY - doubleOffset)}" stroke="${color}" stroke-width="${lineWidth}"/>`,
        `<line x1="${centerX}" y1="${r(centerY + doubleOffset)}" x2="${rRight}" y2="${r(centerY + doubleOffset)}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    } else {
      const w = getWidth(segments.right);
      // If there are double vertical lines, start the single horizontal from the inner edge
      const startX = (hasDoubleUp || hasDoubleDown) ? r(centerX + doubleOffset) : centerX;
      paths.push(
        `<line x1="${startX}" y1="${centerY}" x2="${rRight}" y2="${centerY}" stroke="${color}" stroke-width="${w}"/>`
      );
    }
  }

  // Wrap in group with crispEdges for pixel-perfect rendering
  return { svg: `<g shape-rendering="crispEdges">${paths.join('')}</g>`, handled: true };
}

function renderDoubleLineCorner(
  segments: BoxSegments,
  ctx: GlyphContext,
  doubleOffset: number
): GlyphResult {
  const { cellWidth, cellHeight, x, y, color, lineWidth } = ctx;
  // Pre-compute rounded values
  const rx = r(x);
  const ry = r(y);
  const rBottom = r(y + cellHeight);
  const rRight = r(x + cellWidth);
  const centerX = r(x + cellWidth / 2);
  const centerY = r(y + cellHeight / 2);

  const paths: string[] = [];

  const hasUp = segments.up === 3;
  const hasDown = segments.down === 3;
  const hasLeft = segments.left === 3;
  const hasRight = segments.right === 3;

  const outerLeft = r(centerX - doubleOffset);
  const outerRight = r(centerX + doubleOffset);
  const outerTop = r(centerY - doubleOffset);
  const outerBottom = r(centerY + doubleOffset);

  if (hasUp && hasRight && !hasDown && !hasLeft) {
    paths.push(
      `<path d="M ${outerLeft} ${ry} L ${outerLeft} ${outerBottom} L ${rRight} ${outerBottom}" fill="none" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    paths.push(
      `<path d="M ${outerRight} ${ry} L ${outerRight} ${outerTop} L ${rRight} ${outerTop}" fill="none" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  else if (hasDown && hasRight && !hasUp && !hasLeft) {
    paths.push(
      `<path d="M ${outerLeft} ${rBottom} L ${outerLeft} ${outerTop} L ${rRight} ${outerTop}" fill="none" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    paths.push(
      `<path d="M ${outerRight} ${rBottom} L ${outerRight} ${outerBottom} L ${rRight} ${outerBottom}" fill="none" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  else if (hasDown && hasLeft && !hasUp && !hasRight) {
    paths.push(
      `<path d="M ${outerRight} ${rBottom} L ${outerRight} ${outerTop} L ${rx} ${outerTop}" fill="none" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    paths.push(
      `<path d="M ${outerLeft} ${rBottom} L ${outerLeft} ${outerBottom} L ${rx} ${outerBottom}" fill="none" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  else if (hasUp && hasLeft && !hasDown && !hasRight) {
    paths.push(
      `<path d="M ${outerRight} ${ry} L ${outerRight} ${outerBottom} L ${rx} ${outerBottom}" fill="none" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    paths.push(
      `<path d="M ${outerLeft} ${ry} L ${outerLeft} ${outerTop} L ${rx} ${outerTop}" fill="none" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  else if (hasUp && hasDown && hasRight && !hasLeft) {
    paths.push(
      `<line x1="${outerLeft}" y1="${ry}" x2="${outerLeft}" y2="${rBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    paths.push(
      `<line x1="${outerRight}" y1="${ry}" x2="${outerRight}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${outerBottom}" x2="${outerRight}" y2="${rBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    paths.push(
      `<line x1="${outerRight}" y1="${outerTop}" x2="${rRight}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${outerBottom}" x2="${rRight}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  else if (hasUp && hasDown && hasLeft && !hasRight) {
    paths.push(
      `<line x1="${outerRight}" y1="${ry}" x2="${outerRight}" y2="${rBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    paths.push(
      `<line x1="${outerLeft}" y1="${ry}" x2="${outerLeft}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerLeft}" y1="${outerBottom}" x2="${outerLeft}" y2="${rBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    paths.push(
      `<line x1="${rx}" y1="${outerTop}" x2="${outerLeft}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${rx}" y1="${outerBottom}" x2="${outerLeft}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  else if (hasDown && hasLeft && hasRight && !hasUp) {
    paths.push(
      `<line x1="${rx}" y1="${outerTop}" x2="${rRight}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    paths.push(
      `<line x1="${rx}" y1="${outerBottom}" x2="${outerLeft}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${outerBottom}" x2="${rRight}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    paths.push(
      `<line x1="${outerLeft}" y1="${outerBottom}" x2="${outerLeft}" y2="${rBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${outerBottom}" x2="${outerRight}" y2="${rBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  else if (hasUp && hasLeft && hasRight && !hasDown) {
    paths.push(
      `<line x1="${rx}" y1="${outerBottom}" x2="${rRight}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    paths.push(
      `<line x1="${rx}" y1="${outerTop}" x2="${outerLeft}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${outerTop}" x2="${rRight}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    paths.push(
      `<line x1="${outerLeft}" y1="${ry}" x2="${outerLeft}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${ry}" x2="${outerRight}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  else if (hasUp && hasDown && hasLeft && hasRight) {
    paths.push(
      `<line x1="${outerLeft}" y1="${ry}" x2="${outerLeft}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerLeft}" y1="${outerBottom}" x2="${outerLeft}" y2="${rBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${ry}" x2="${outerRight}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${outerBottom}" x2="${outerRight}" y2="${rBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    paths.push(
      `<line x1="${rx}" y1="${outerTop}" x2="${outerLeft}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${outerTop}" x2="${rRight}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${rx}" y1="${outerBottom}" x2="${outerLeft}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${outerBottom}" x2="${rRight}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  else {
    if (hasUp) {
      paths.push(
        `<line x1="${outerLeft}" y1="${ry}" x2="${outerLeft}" y2="${centerY}" stroke="${color}" stroke-width="${lineWidth}"/>`,
        `<line x1="${outerRight}" y1="${ry}" x2="${outerRight}" y2="${centerY}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    }
    if (hasDown) {
      paths.push(
        `<line x1="${outerLeft}" y1="${centerY}" x2="${outerLeft}" y2="${rBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`,
        `<line x1="${outerRight}" y1="${centerY}" x2="${outerRight}" y2="${rBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    }
    if (hasLeft) {
      paths.push(
        `<line x1="${rx}" y1="${outerTop}" x2="${centerX}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
        `<line x1="${rx}" y1="${outerBottom}" x2="${centerX}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    }
    if (hasRight) {
      paths.push(
        `<line x1="${centerX}" y1="${outerTop}" x2="${rRight}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
        `<line x1="${centerX}" y1="${outerBottom}" x2="${rRight}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    }
  }

  // Wrap in group with crispEdges for pixel-perfect rendering
  return { svg: `<g shape-rendering="crispEdges">${paths.join('')}</g>`, handled: true };
}

function renderDiagonalLine(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color, lineWidth } = ctx;
  const rx = r(x);
  const ry = r(y);
  const rBottom = r(y + cellHeight);
  const rRight = r(x + cellWidth);
  const paths: string[] = [];

  if (codePoint === 0x2571 || codePoint === 0x2573) {
    paths.push(
      `<line x1="${rx}" y1="${rBottom}" x2="${rRight}" y2="${ry}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }

  if (codePoint === 0x2572 || codePoint === 0x2573) {
    paths.push(
      `<line x1="${rx}" y1="${ry}" x2="${rRight}" y2="${rBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }

  return { svg: paths.join(''), handled: true };
}

// Block Elements (U+2580-U+259F)

function renderBlockElement(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color, backgroundColor } = ctx;
  const crisp = ' shape-rendering="crispEdges"';

  // Pre-compute rounded values for common fractions
  const w = r(cellWidth);
  const h = r(cellHeight);
  const w2 = r(cellWidth / 2);
  const w4 = r(cellWidth / 4);
  const w8 = r(cellWidth / 8);
  const w38 = r(cellWidth * 3 / 8);
  const w58 = r(cellWidth * 5 / 8);
  const w34 = r(cellWidth * 3 / 4);
  const w78 = r(cellWidth * 7 / 8);
  const h2 = r(cellHeight / 2);
  const h4 = r(cellHeight / 4);
  const h8 = r(cellHeight / 8);
  const h38 = r(cellHeight * 3 / 8);
  const h58 = r(cellHeight * 5 / 8);
  const h34 = r(cellHeight * 3 / 4);
  const h78 = r(cellHeight * 7 / 8);
  const rx = r(x);
  const ry = r(y);

  let svg = '';

  switch (codePoint) {
    case 0x2580: // Upper half block
      svg = `<rect x="${rx}" y="${ry}" width="${w}" height="${h2}" fill="${color}"${crisp}/>`;
      break;
    case 0x2581: // Lower 1/8
      svg = `<rect x="${rx}" y="${r(y + h78)}" width="${w}" height="${h8}" fill="${color}"${crisp}/>`;
      break;
    case 0x2582: // Lower 1/4
      svg = `<rect x="${rx}" y="${r(y + h34)}" width="${w}" height="${h4}" fill="${color}"${crisp}/>`;
      break;
    case 0x2583: // Lower 3/8
      svg = `<rect x="${rx}" y="${r(y + h58)}" width="${w}" height="${h38}" fill="${color}"${crisp}/>`;
      break;
    case 0x2584: // Lower half
      svg = `<rect x="${rx}" y="${r(y + h2)}" width="${w}" height="${h2}" fill="${color}"${crisp}/>`;
      break;
    case 0x2585: // Lower 5/8
      svg = `<rect x="${rx}" y="${r(y + h38)}" width="${w}" height="${h58}" fill="${color}"${crisp}/>`;
      break;
    case 0x2586: // Lower 3/4
      svg = `<rect x="${rx}" y="${r(y + h4)}" width="${w}" height="${h34}" fill="${color}"${crisp}/>`;
      break;
    case 0x2587: // Lower 7/8
      svg = `<rect x="${rx}" y="${r(y + h8)}" width="${w}" height="${h78}" fill="${color}"${crisp}/>`;
      break;
    case 0x2588: // Full block
      svg = `<rect x="${rx}" y="${ry}" width="${w}" height="${h}" fill="${color}"${crisp}/>`;
      break;
    case 0x2589: // Left 7/8
      svg = `<rect x="${rx}" y="${ry}" width="${w78}" height="${h}" fill="${color}"${crisp}/>`;
      break;
    case 0x258a: // Left 3/4
      svg = `<rect x="${rx}" y="${ry}" width="${w34}" height="${h}" fill="${color}"${crisp}/>`;
      break;
    case 0x258b: // Left 5/8
      svg = `<rect x="${rx}" y="${ry}" width="${w58}" height="${h}" fill="${color}"${crisp}/>`;
      break;
    case 0x258c: // Left half
      svg = `<rect x="${rx}" y="${ry}" width="${w2}" height="${h}" fill="${color}"${crisp}/>`;
      break;
    case 0x258d: // Left 3/8
      svg = `<rect x="${rx}" y="${ry}" width="${w38}" height="${h}" fill="${color}"${crisp}/>`;
      break;
    case 0x258e: // Left 1/4
      svg = `<rect x="${rx}" y="${ry}" width="${w4}" height="${h}" fill="${color}"${crisp}/>`;
      break;
    case 0x258f: // Left 1/8
      svg = `<rect x="${rx}" y="${ry}" width="${w8}" height="${h}" fill="${color}"${crisp}/>`;
      break;
    case 0x2590: // Right half block
      svg = `<rect x="${r(x + w2)}" y="${ry}" width="${w2}" height="${h}" fill="${color}"${crisp}/>`;
      break;
    case 0x2591: // Light shade (25%) - pre-blend to avoid subpixel seams on high-DPI
      svg = `<rect x="${rx}" y="${ry}" width="${w}" height="${h}" fill="${blendColors(color, backgroundColor, 0.25)}"${crisp}/>`;
      break;
    case 0x2592: // Medium shade (50%) - pre-blend to avoid subpixel seams on high-DPI
      svg = `<rect x="${rx}" y="${ry}" width="${w}" height="${h}" fill="${blendColors(color, backgroundColor, 0.5)}"${crisp}/>`;
      break;
    case 0x2593: // Dark shade (75%) - pre-blend to avoid subpixel seams on high-DPI
      svg = `<rect x="${rx}" y="${ry}" width="${w}" height="${h}" fill="${blendColors(color, backgroundColor, 0.75)}"${crisp}/>`;
      break;
    case 0x2594: // Upper 1/8 block
      svg = `<rect x="${rx}" y="${ry}" width="${w}" height="${h8}" fill="${color}"${crisp}/>`;
      break;
    case 0x2595: // Right 1/8 block
      svg = `<rect x="${r(x + w78)}" y="${ry}" width="${w8}" height="${h}" fill="${color}"${crisp}/>`;
      break;
    case 0x2596: // Lower left
      svg = `<rect x="${rx}" y="${r(y + h2)}" width="${w2}" height="${h2}" fill="${color}"${crisp}/>`;
      break;
    case 0x2597: // Lower right
      svg = `<rect x="${r(x + w2)}" y="${r(y + h2)}" width="${w2}" height="${h2}" fill="${color}"${crisp}/>`;
      break;
    case 0x2598: // Upper left
      svg = `<rect x="${rx}" y="${ry}" width="${w2}" height="${h2}" fill="${color}"${crisp}/>`;
      break;
    case 0x2599: // Upper left, lower left, lower right
      svg = [
        `<rect x="${rx}" y="${ry}" width="${w2}" height="${h2}" fill="${color}"${crisp}/>`,
        `<rect x="${rx}" y="${r(y + h2)}" width="${w}" height="${h2}" fill="${color}"${crisp}/>`,
      ].join('');
      break;
    case 0x259a: // Upper left, lower right
      svg = [
        `<rect x="${rx}" y="${ry}" width="${w2}" height="${h2}" fill="${color}"${crisp}/>`,
        `<rect x="${r(x + w2)}" y="${r(y + h2)}" width="${w2}" height="${h2}" fill="${color}"${crisp}/>`,
      ].join('');
      break;
    case 0x259b: // Upper left, upper right, lower left
      svg = [
        `<rect x="${rx}" y="${ry}" width="${w}" height="${h2}" fill="${color}"${crisp}/>`,
        `<rect x="${rx}" y="${r(y + h2)}" width="${w2}" height="${h2}" fill="${color}"${crisp}/>`,
      ].join('');
      break;
    case 0x259c: // Upper left, upper right, lower right
      svg = [
        `<rect x="${rx}" y="${ry}" width="${w}" height="${h2}" fill="${color}"${crisp}/>`,
        `<rect x="${r(x + w2)}" y="${r(y + h2)}" width="${w2}" height="${h2}" fill="${color}"${crisp}/>`,
      ].join('');
      break;
    case 0x259d: // Upper right
      svg = `<rect x="${r(x + w2)}" y="${ry}" width="${w2}" height="${h2}" fill="${color}"${crisp}/>`;
      break;
    case 0x259e: // Upper right, lower left
      svg = [
        `<rect x="${r(x + w2)}" y="${ry}" width="${w2}" height="${h2}" fill="${color}"${crisp}/>`,
        `<rect x="${rx}" y="${r(y + h2)}" width="${w2}" height="${h2}" fill="${color}"${crisp}/>`,
      ].join('');
      break;
    case 0x259f: // Upper right, lower left, lower right
      svg = [
        `<rect x="${r(x + w2)}" y="${ry}" width="${w2}" height="${h2}" fill="${color}"${crisp}/>`,
        `<rect x="${rx}" y="${r(y + h2)}" width="${w}" height="${h2}" fill="${color}"${crisp}/>`,
      ].join('');
      break;
    default:
      return { svg: '', handled: false };
  }

  return { svg, handled: true };
}

// Braille Patterns (U+2800-U+28FF)
// 8-dot pattern in 2x4 grid: bits encode which dots are filled

function renderBraille(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color } = ctx;

  const pattern = codePoint - 0x2800;

  const dotRadius = Math.min(cellWidth, cellHeight) * 0.1;
  const leftX = x + cellWidth * 0.3;
  const rightX = x + cellWidth * 0.7;
  const rows = [
    y + cellHeight * 0.15,
    y + cellHeight * 0.35,
    y + cellHeight * 0.55,
    y + cellHeight * 0.85,
  ];

  const dots: string[] = [];

  const dotPositions = [
    [leftX, rows[0]],
    [leftX, rows[1]],
    [leftX, rows[2]],
    [rightX, rows[0]],
    [rightX, rows[1]],
    [rightX, rows[2]],
    [leftX, rows[3]],
    [rightX, rows[3]],
  ];

  for (let i = 0; i < 8; i++) {
    if (pattern & (1 << i)) {
      const [dx, dy] = dotPositions[i];
      dots.push(`<circle cx="${dx}" cy="${dy}" r="${dotRadius}" fill="${color}"/>`);
    }
  }

  return { svg: dots.join(''), handled: true };
}

// Symbols for Legacy Computing (U+1FB00-U+1FBFF)

function renderLegacyComputing(codePoint: number, ctx: GlyphContext): GlyphResult {
  if (codePoint >= 0x1fb00 && codePoint <= 0x1fb3b) {
    return renderSextant(codePoint, ctx);
  }

  if (codePoint >= 0x1fb3c && codePoint <= 0x1fb6f) {
    return renderSmoothMosaic(codePoint, ctx);
  }

  if (codePoint >= 0x1fb70 && codePoint <= 0x1fb8b) {
    return renderLegacyBlockElement(codePoint, ctx);
  }

  if (codePoint >= 0x1fb8c && codePoint <= 0x1fb94) {
    return renderLegacyShade(codePoint, ctx);
  }

  if (codePoint >= 0x1fb95 && codePoint <= 0x1fb99) {
    return renderFillPattern(codePoint, ctx);
  }

  if (codePoint >= 0x1fb9a && codePoint <= 0x1fb9f) {
    return renderTriangularShade(codePoint, ctx);
  }

  if (codePoint >= 0x1fba0 && codePoint <= 0x1fbaf) {
    return renderCellDiagonal(codePoint, ctx);
  }

  return { svg: '', handled: false };
}

// Sextant characters (2x3 grid)
function renderSextant(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color } = ctx;

  const sw = cellWidth / 2;
  const sh = cellHeight / 3;

  const offset = codePoint - 0x1fb00;

  const sextantPatterns: Record<number, number[]> = {};

  let patternIndex = 0;
  for (let bits = 1; bits < 64; bits++) {
    if (bits === 63) continue;
    sextantPatterns[patternIndex] = [];
    if (bits & 1) sextantPatterns[patternIndex].push(0);
    if (bits & 2) sextantPatterns[patternIndex].push(1);
    if (bits & 4) sextantPatterns[patternIndex].push(2);
    if (bits & 8) sextantPatterns[patternIndex].push(3);
    if (bits & 16) sextantPatterns[patternIndex].push(4);
    if (bits & 32) sextantPatterns[patternIndex].push(5);
    patternIndex++;
  }

  const filled = sextantPatterns[offset] || [];
  const rects: string[] = [];

  const positions = [
    [0, 0], [1, 0],
    [0, 1], [1, 1],
    [0, 2], [1, 2],
  ];

  for (const idx of filled) {
    const [col, row] = positions[idx];
    rects.push(
      `<rect x="${x + col * sw}" y="${y + row * sh}" width="${sw}" height="${sh}" fill="${color}"/>`
    );
  }

  return { svg: rects.join(''), handled: true };
}

function renderSmoothMosaic(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color } = ctx;

  if (codePoint === 0x1fb3c) {
    return {
      svg: `<polygon points="${x},${y} ${x + cellWidth},${y} ${x},${y + cellHeight}" fill="${color}"/>`,
      handled: true,
    };
  }

  if (codePoint === 0x1fb3d) {
    return {
      svg: `<polygon points="${x},${y} ${x + cellWidth},${y} ${x + cellWidth},${y + cellHeight}" fill="${color}"/>`,
      handled: true,
    };
  }

  if (codePoint === 0x1fb3e) {
    return {
      svg: `<polygon points="${x},${y} ${x},${y + cellHeight} ${x + cellWidth},${y + cellHeight}" fill="${color}"/>`,
      handled: true,
    };
  }

  if (codePoint === 0x1fb3f) {
    return {
      svg: `<polygon points="${x + cellWidth},${y} ${x},${y + cellHeight} ${x + cellWidth},${y + cellHeight}" fill="${color}"/>`,
      handled: true,
    };
  }

  return {
    svg: `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${color}" fill-opacity="0.5"/>`,
    handled: true,
  };
}

function renderLegacyBlockElement(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color } = ctx;

  const offset = codePoint - 0x1fb70;

  if (offset >= 0 && offset <= 5) {
    const startY = y + (offset + 1) * (cellHeight / 8);
    return {
      svg: `<rect x="${x}" y="${startY}" width="${cellWidth}" height="${cellHeight / 8}" fill="${color}"/>`,
      handled: true,
    };
  }

  if (offset >= 6 && offset <= 11) {
    const pos = offset - 6;
    const startX = x + (pos + 1) * (cellWidth / 8);
    return {
      svg: `<rect x="${startX}" y="${y}" width="${cellWidth / 8}" height="${cellHeight}" fill="${color}"/>`,
      handled: true,
    };
  }

  return {
    svg: `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${color}" fill-opacity="0.5"/>`,
    handled: true,
  };
}

function renderLegacyShade(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color } = ctx;

  const offset = codePoint - 0x1fb8c;
  const shadeOpacity = 0.5;

  switch (offset) {
    case 0:
      return {
        svg: `<rect x="${x}" y="${y}" width="${cellWidth / 2}" height="${cellHeight}" fill="${color}" fill-opacity="${shadeOpacity}"/>`,
        handled: true,
      };
    case 1:
      return {
        svg: `<rect x="${x + cellWidth / 2}" y="${y}" width="${cellWidth / 2}" height="${cellHeight}" fill="${color}" fill-opacity="${shadeOpacity}"/>`,
        handled: true,
      };
    case 2:
      return {
        svg: `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight / 2}" fill="${color}" fill-opacity="${shadeOpacity}"/>`,
        handled: true,
      };
    case 3:
      return {
        svg: `<rect x="${x}" y="${y + cellHeight / 2}" width="${cellWidth}" height="${cellHeight / 2}" fill="${color}" fill-opacity="${shadeOpacity}"/>`,
        handled: true,
      };
    default:
      return {
        svg: `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${color}" fill-opacity="${shadeOpacity}"/>`,
        handled: true,
      };
  }
}

function renderFillPattern(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color } = ctx;

  if (codePoint === 0x1fb95 || codePoint === 0x1fb96) {
    const isInverse = codePoint === 0x1fb96;
    const size = Math.min(cellWidth, cellHeight) / 4;
    const rects: string[] = [];

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const fill = ((row + col) % 2 === 0) !== isInverse;
        if (fill) {
          rects.push(
            `<rect x="${x + col * size}" y="${y + row * size}" width="${size}" height="${size}" fill="${color}"/>`
          );
        }
      }
    }
    return { svg: rects.join(''), handled: true };
  }

  return {
    svg: `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${color}" fill-opacity="0.5"/>`,
    handled: true,
  };
}

function renderTriangularShade(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color } = ctx;

  const shadeOpacity = 0.5;

  switch (codePoint) {
    case 0x1fb9a:
      return {
        svg: `<polygon points="${x},${y} ${x + cellWidth},${y} ${x},${y + cellHeight}" fill="${color}" fill-opacity="${shadeOpacity}"/>`,
        handled: true,
      };
    case 0x1fb9b:
      return {
        svg: `<polygon points="${x},${y} ${x + cellWidth},${y} ${x + cellWidth},${y + cellHeight}" fill="${color}" fill-opacity="${shadeOpacity}"/>`,
        handled: true,
      };
    case 0x1fb9c:
      return {
        svg: `<polygon points="${x + cellWidth},${y} ${x},${y + cellHeight} ${x + cellWidth},${y + cellHeight}" fill="${color}" fill-opacity="${shadeOpacity}"/>`,
        handled: true,
      };
    case 0x1fb9d:
      return {
        svg: `<polygon points="${x},${y} ${x},${y + cellHeight} ${x + cellWidth},${y + cellHeight}" fill="${color}" fill-opacity="${shadeOpacity}"/>`,
        handled: true,
      };
    default:
      return {
        svg: `<polygon points="${x},${y} ${x + cellWidth},${y} ${x + cellWidth / 2},${y + cellHeight}" fill="${color}" fill-opacity="${shadeOpacity}"/>`,
        handled: true,
      };
  }
}

function renderCellDiagonal(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color, lineWidth } = ctx;

  const paths: string[] = [];
  const offset = codePoint - 0x1fba0;

  if (offset === 0 || offset === 2 || offset === 4 || offset === 6 ||
      offset === 8 || offset === 10 || offset === 12 || offset === 14) {
    paths.push(
      `<line x1="${x + cellWidth}" y1="${y}" x2="${x}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }

  if (offset === 1 || offset === 2 || offset === 5 || offset === 6 ||
      offset === 9 || offset === 10 || offset === 13 || offset === 14) {
    paths.push(
      `<line x1="${x}" y1="${y}" x2="${x + cellWidth}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }

  if (offset >= 4 && offset <= 7) {
    const midX = x + cellWidth / 2;
    const midY = y + cellHeight / 2;
    if (offset === 4 || offset === 6) {
      paths.push(
        `<line x1="${midX}" y1="${y}" x2="${x}" y2="${midY}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    }
    if (offset === 5 || offset === 6) {
      paths.push(
        `<line x1="${x}" y1="${midY}" x2="${midX}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    }
  }

  if (paths.length === 0) {
    paths.push(
      `<line x1="${x}" y1="${y}" x2="${x + cellWidth}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${x + cellWidth}" y1="${y}" x2="${x}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }

  return { svg: paths.join(''), handled: true };
}
