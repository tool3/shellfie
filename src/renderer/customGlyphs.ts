/**
 * Custom Glyph Rendering for Box Drawing and Block Element Characters
 *
 * This module provides pixel-perfect rendering of terminal graphics characters
 * by drawing them as SVG primitives instead of relying on font glyphs.
 *
 * Inspired by xterm.js custom glyph rendering approach.
 *
 * Supported Unicode ranges:
 * - Box Drawing (U+2500-U+257F) - 128 characters
 * - Block Elements (U+2580-U+259F) - 32 characters
 * - Shade Characters (part of Block Elements)
 * - Symbols for Legacy Computing (U+1FB00-U+1FBFF) - ~250 characters
 * - Braille Patterns (U+2800-U+28FF) - 256 characters
 */

/**
 * Check if a character code point should be rendered as a custom glyph
 *
 * Note: Shade characters (░ ▒ ▓) are rendered as semi-transparent rectangles
 * following the approach used by VTE-based terminals (GNOME Terminal, etc.)
 * for a cleaner, more uniform appearance.
 */
export function isCustomGlyph(codePoint: number): boolean {
  return (
    // Box Drawing (U+2500-U+257F)
    (codePoint >= 0x2500 && codePoint <= 0x257f) ||
    // Block Elements (U+2580-U+259F) - includes shade characters
    (codePoint >= 0x2580 && codePoint <= 0x259f) ||
    // Braille Patterns (U+2800-U+28FF)
    (codePoint >= 0x2800 && codePoint <= 0x28ff) ||
    // Symbols for Legacy Computing (U+1FB00-U+1FBFF)
    (codePoint >= 0x1fb00 && codePoint <= 0x1fbff)
  );
}

/**
 * Check if a string contains any custom glyph characters
 */
export function containsCustomGlyphs(text: string): boolean {
  for (const char of text) {
    const codePoint = char.codePointAt(0);
    if (codePoint !== undefined && isCustomGlyph(codePoint)) {
      return true;
    }
  }
  return false;
}

/**
 * Glyph rendering context containing cell dimensions
 */
export interface GlyphContext {
  /** Cell width in pixels */
  cellWidth: number;
  /** Cell height in pixels */
  cellHeight: number;
  /** X position of the cell */
  x: number;
  /** Y position of the cell (top of cell) */
  y: number;
  /** Fill color for the glyph */
  color: string;
  /** Line thickness for box drawing (typically 1-2px) */
  lineWidth: number;
  /** Heavy line thickness */
  heavyLineWidth: number;
}

/**
 * Result of rendering a custom glyph
 */
export interface GlyphResult {
  /** SVG element(s) for the glyph */
  svg: string;
  /** Whether this glyph was handled */
  handled: boolean;
}

/**
 * Render a custom glyph as SVG
 */
export function renderCustomGlyph(
  char: string,
  ctx: GlyphContext
): GlyphResult {
  const codePoint = char.codePointAt(0);
  if (codePoint === undefined) {
    return { svg: '', handled: false };
  }

  // Box Drawing (U+2500-U+257F)
  if (codePoint >= 0x2500 && codePoint <= 0x257f) {
    return renderBoxDrawing(codePoint, ctx);
  }

  // Block Elements (U+2580-U+259F)
  if (codePoint >= 0x2580 && codePoint <= 0x259f) {
    return renderBlockElement(codePoint, ctx);
  }

  // Braille Patterns (U+2800-U+28FF)
  if (codePoint >= 0x2800 && codePoint <= 0x28ff) {
    return renderBraille(codePoint, ctx);
  }

  // Symbols for Legacy Computing (U+1FB00-U+1FBFF)
  if (codePoint >= 0x1fb00 && codePoint <= 0x1fbff) {
    return renderLegacyComputing(codePoint, ctx);
  }

  return { svg: '', handled: false };
}

// ============================================================================
// Box Drawing Characters (U+2500-U+257F)
// ============================================================================

/**
 * Box drawing character segments
 * Each character is defined by which segments it draws:
 * - up, down, left, right (from center)
 * - Each segment can be: 0 (none), 1 (light), 2 (heavy), 3 (double)
 */
interface BoxSegments {
  up: number;
  down: number;
  left: number;
  right: number;
}

/**
 * Get box drawing segments for a code point
 */
function getBoxSegments(codePoint: number): BoxSegments | null {
  // Map of box drawing characters to their segment definitions
  // Format: [up, down, left, right] where 0=none, 1=light, 2=heavy, 3=double
  const boxMap: Record<number, [number, number, number, number]> = {
    // Light horizontal and vertical
    0x2500: [0, 0, 1, 1], // ─ light horizontal
    0x2501: [0, 0, 2, 2], // ━ heavy horizontal
    0x2502: [1, 1, 0, 0], // │ light vertical
    0x2503: [2, 2, 0, 0], // ┃ heavy vertical

    // Light dashed lines
    0x2504: [0, 0, 1, 1], // ┄ light triple dash horizontal
    0x2505: [0, 0, 2, 2], // ┅ heavy triple dash horizontal
    0x2506: [1, 1, 0, 0], // ┆ light triple dash vertical
    0x2507: [2, 2, 0, 0], // ┇ heavy triple dash vertical
    0x2508: [0, 0, 1, 1], // ┈ light quadruple dash horizontal
    0x2509: [0, 0, 2, 2], // ┉ heavy quadruple dash horizontal
    0x250a: [1, 1, 0, 0], // ┊ light quadruple dash vertical
    0x250b: [2, 2, 0, 0], // ┋ heavy quadruple dash vertical

    // Light and heavy corners (down and right)
    0x250c: [0, 1, 0, 1], // ┌ light down and right
    0x250d: [0, 1, 0, 2], // ┍ down light and right heavy
    0x250e: [0, 2, 0, 1], // ┎ down heavy and right light
    0x250f: [0, 2, 0, 2], // ┏ heavy down and right

    // Down and left corners
    0x2510: [0, 1, 1, 0], // ┐ light down and left
    0x2511: [0, 1, 2, 0], // ┑ down light and left heavy
    0x2512: [0, 2, 1, 0], // ┒ down heavy and left light
    0x2513: [0, 2, 2, 0], // ┓ heavy down and left

    // Up and right corners
    0x2514: [1, 0, 0, 1], // └ light up and right
    0x2515: [1, 0, 0, 2], // ┕ up light and right heavy
    0x2516: [2, 0, 0, 1], // ┖ up heavy and right light
    0x2517: [2, 0, 0, 2], // ┗ heavy up and right

    // Up and left corners
    0x2518: [1, 0, 1, 0], // ┘ light up and left
    0x2519: [1, 0, 2, 0], // ┙ up light and left heavy
    0x251a: [2, 0, 1, 0], // ┚ up heavy and left light
    0x251b: [2, 0, 2, 0], // ┛ heavy up and left

    // Vertical and right (T-junctions)
    0x251c: [1, 1, 0, 1], // ├ light vertical and right
    0x251d: [1, 1, 0, 2], // ┝ vertical light and right heavy
    0x251e: [2, 1, 0, 1], // ┞ up heavy and right down light
    0x251f: [1, 2, 0, 1], // ┟ down heavy and right up light
    0x2520: [2, 2, 0, 1], // ┠ vertical heavy and right light
    0x2521: [2, 1, 0, 2], // ┡ down light and right up heavy
    0x2522: [1, 2, 0, 2], // ┢ up light and right down heavy
    0x2523: [2, 2, 0, 2], // ┣ heavy vertical and right

    // Vertical and left
    0x2524: [1, 1, 1, 0], // ┤ light vertical and left
    0x2525: [1, 1, 2, 0], // ┥ vertical light and left heavy
    0x2526: [2, 1, 1, 0], // ┦ up heavy and left down light
    0x2527: [1, 2, 1, 0], // ┧ down heavy and left up light
    0x2528: [2, 2, 1, 0], // ┨ vertical heavy and left light
    0x2529: [2, 1, 2, 0], // ┩ down light and left up heavy
    0x252a: [1, 2, 2, 0], // ┪ up light and left down heavy
    0x252b: [2, 2, 2, 0], // ┫ heavy vertical and left

    // Down and horizontal
    0x252c: [0, 1, 1, 1], // ┬ light down and horizontal
    0x252d: [0, 1, 2, 1], // ┭ left heavy and right down light
    0x252e: [0, 1, 1, 2], // ┮ right heavy and left down light
    0x252f: [0, 1, 2, 2], // ┯ down light and horizontal heavy
    0x2530: [0, 2, 1, 1], // ┰ down heavy and horizontal light
    0x2531: [0, 2, 2, 1], // ┱ right light and left down heavy
    0x2532: [0, 2, 1, 2], // ┲ left light and right down heavy
    0x2533: [0, 2, 2, 2], // ┳ heavy down and horizontal

    // Up and horizontal
    0x2534: [1, 0, 1, 1], // ┴ light up and horizontal
    0x2535: [1, 0, 2, 1], // ┵ left heavy and right up light
    0x2536: [1, 0, 1, 2], // ┶ right heavy and left up light
    0x2537: [1, 0, 2, 2], // ┷ up light and horizontal heavy
    0x2538: [2, 0, 1, 1], // ┸ up heavy and horizontal light
    0x2539: [2, 0, 2, 1], // ┹ right light and left up heavy
    0x253a: [2, 0, 1, 2], // ┺ left light and right up heavy
    0x253b: [2, 0, 2, 2], // ┻ heavy up and horizontal

    // Vertical and horizontal (cross)
    0x253c: [1, 1, 1, 1], // ┼ light vertical and horizontal
    0x253d: [1, 1, 2, 1], // ┽ left heavy and right vertical light
    0x253e: [1, 1, 1, 2], // ┾ right heavy and left vertical light
    0x253f: [1, 1, 2, 2], // ┿ vertical light and horizontal heavy
    0x2540: [2, 1, 1, 1], // ╀ up heavy and down horizontal light
    0x2541: [1, 2, 1, 1], // ╁ down heavy and up horizontal light
    0x2542: [2, 2, 1, 1], // ╂ vertical heavy and horizontal light
    0x2543: [2, 1, 2, 1], // ╃ left up heavy and right down light
    0x2544: [2, 1, 1, 2], // ╄ right up heavy and left down light
    0x2545: [1, 2, 2, 1], // ╅ left down heavy and right up light
    0x2546: [1, 2, 1, 2], // ╆ right down heavy and left up light
    0x2547: [2, 1, 2, 2], // ╇ down light and up horizontal heavy
    0x2548: [1, 2, 2, 2], // ╈ up light and down horizontal heavy
    0x2549: [2, 2, 2, 1], // ╉ right light and left vertical heavy
    0x254a: [2, 2, 1, 2], // ╊ left light and right vertical heavy
    0x254b: [2, 2, 2, 2], // ╋ heavy vertical and horizontal

    // Double dash lines
    0x254c: [0, 0, 1, 1], // ╌ light double dash horizontal
    0x254d: [0, 0, 2, 2], // ╍ heavy double dash horizontal
    0x254e: [1, 1, 0, 0], // ╎ light double dash vertical
    0x254f: [2, 2, 0, 0], // ╏ heavy double dash vertical

    // Double lines
    0x2550: [0, 0, 3, 3], // ═ double horizontal
    0x2551: [3, 3, 0, 0], // ║ double vertical

    // Double line corners and junctions
    0x2552: [0, 1, 0, 3], // ╒ down single and right double
    0x2553: [0, 3, 0, 1], // ╓ down double and right single
    0x2554: [0, 3, 0, 3], // ╔ double down and right
    0x2555: [0, 1, 3, 0], // ╕ down single and left double
    0x2556: [0, 3, 1, 0], // ╖ down double and left single
    0x2557: [0, 3, 3, 0], // ╗ double down and left
    0x2558: [1, 0, 0, 3], // ╘ up single and right double
    0x2559: [3, 0, 0, 1], // ╙ up double and right single
    0x255a: [3, 0, 0, 3], // ╚ double up and right
    0x255b: [1, 0, 3, 0], // ╛ up single and left double
    0x255c: [3, 0, 1, 0], // ╜ up double and left single
    0x255d: [3, 0, 3, 0], // ╝ double up and left
    0x255e: [1, 1, 0, 3], // ╞ vertical single and right double
    0x255f: [3, 3, 0, 1], // ╟ vertical double and right single
    0x2560: [3, 3, 0, 3], // ╠ double vertical and right
    0x2561: [1, 1, 3, 0], // ╡ vertical single and left double
    0x2562: [3, 3, 1, 0], // ╢ vertical double and left single
    0x2563: [3, 3, 3, 0], // ╣ double vertical and left
    0x2564: [0, 1, 3, 3], // ╤ down single and horizontal double
    0x2565: [0, 3, 1, 1], // ╥ down double and horizontal single
    0x2566: [0, 3, 3, 3], // ╦ double down and horizontal
    0x2567: [1, 0, 3, 3], // ╧ up single and horizontal double
    0x2568: [3, 0, 1, 1], // ╨ up double and horizontal single
    0x2569: [3, 0, 3, 3], // ╩ double up and horizontal
    0x256a: [1, 1, 3, 3], // ╪ vertical single and horizontal double
    0x256b: [3, 3, 1, 1], // ╫ vertical double and horizontal single
    0x256c: [3, 3, 3, 3], // ╬ double vertical and horizontal

    // Arc corners (rendered as simple corners for now)
    0x256d: [0, 1, 0, 1], // ╭ light arc down and right
    0x256e: [0, 1, 1, 0], // ╮ light arc down and left
    0x256f: [1, 0, 1, 0], // ╯ light arc up and left
    0x2570: [1, 0, 0, 1], // ╰ light arc up and right

    // Half lines
    0x2574: [0, 0, 1, 0], // ╴ light left
    0x2575: [1, 0, 0, 0], // ╵ light up
    0x2576: [0, 0, 0, 1], // ╶ light right
    0x2577: [0, 1, 0, 0], // ╷ light down
    0x2578: [0, 0, 2, 0], // ╸ heavy left
    0x2579: [2, 0, 0, 0], // ╹ heavy up
    0x257a: [0, 0, 0, 2], // ╺ heavy right
    0x257b: [0, 2, 0, 0], // ╻ heavy down
    0x257c: [0, 0, 1, 2], // ╼ light left and heavy right
    0x257d: [1, 2, 0, 0], // ╽ light up and heavy down
    0x257e: [0, 0, 2, 1], // ╾ heavy left and light right
    0x257f: [2, 1, 0, 0], // ╿ heavy up and light down
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

/**
 * Render a box drawing character
 */
function renderBoxDrawing(codePoint: number, ctx: GlyphContext): GlyphResult {
  // Handle diagonal lines specially
  if (codePoint >= 0x2571 && codePoint <= 0x2573) {
    return renderDiagonalLine(codePoint, ctx);
  }

  const segments = getBoxSegments(codePoint);
  if (!segments) {
    return { svg: '', handled: false };
  }

  const { cellWidth, cellHeight, x, y, color, lineWidth, heavyLineWidth } = ctx;
  const centerX = x + cellWidth / 2;
  const centerY = y + cellHeight / 2;

  // Helper to get line width for a segment type
  const getWidth = (type: number): number => {
    if (type === 0) return 0;
    if (type === 1) return lineWidth;
    if (type === 2) return heavyLineWidth;
    return lineWidth; // double lines use light width for each line
  };

  // Offset for double lines
  const doubleOffset = lineWidth * 1.5;

  // Check if this is a double-line character that needs special corner handling
  const hasDoubleUp = segments.up === 3;
  const hasDoubleDown = segments.down === 3;
  const hasDoubleLeft = segments.left === 3;
  const hasDoubleRight = segments.right === 3;

  // For double-line corners and junctions, we need to draw paths instead of simple lines
  // to get proper corner connections
  if ((hasDoubleUp || hasDoubleDown) && (hasDoubleLeft || hasDoubleRight)) {
    return renderDoubleLineCorner(segments, ctx, doubleOffset);
  }

  // For mixed single/double or all-single lines, use simple line segments
  const paths: string[] = [];

  // Draw vertical segments
  if (segments.up > 0) {
    if (segments.up === 3) {
      // Double line up
      paths.push(
        `<line x1="${centerX - doubleOffset}" y1="${y}" x2="${centerX - doubleOffset}" y2="${centerY}" stroke="${color}" stroke-width="${lineWidth}"/>`,
        `<line x1="${centerX + doubleOffset}" y1="${y}" x2="${centerX + doubleOffset}" y2="${centerY}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    } else {
      const w = getWidth(segments.up);
      paths.push(
        `<line x1="${centerX}" y1="${y}" x2="${centerX}" y2="${centerY}" stroke="${color}" stroke-width="${w}"/>`
      );
    }
  }

  if (segments.down > 0) {
    if (segments.down === 3) {
      // Double line down
      paths.push(
        `<line x1="${centerX - doubleOffset}" y1="${centerY}" x2="${centerX - doubleOffset}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`,
        `<line x1="${centerX + doubleOffset}" y1="${centerY}" x2="${centerX + doubleOffset}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    } else {
      const w = getWidth(segments.down);
      paths.push(
        `<line x1="${centerX}" y1="${centerY}" x2="${centerX}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${w}"/>`
      );
    }
  }

  // Draw horizontal segments
  if (segments.left > 0) {
    if (segments.left === 3) {
      // Double line left
      paths.push(
        `<line x1="${x}" y1="${centerY - doubleOffset}" x2="${centerX}" y2="${centerY - doubleOffset}" stroke="${color}" stroke-width="${lineWidth}"/>`,
        `<line x1="${x}" y1="${centerY + doubleOffset}" x2="${centerX}" y2="${centerY + doubleOffset}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    } else {
      const w = getWidth(segments.left);
      paths.push(
        `<line x1="${x}" y1="${centerY}" x2="${centerX}" y2="${centerY}" stroke="${color}" stroke-width="${w}"/>`
      );
    }
  }

  if (segments.right > 0) {
    if (segments.right === 3) {
      // Double line right
      paths.push(
        `<line x1="${centerX}" y1="${centerY - doubleOffset}" x2="${x + cellWidth}" y2="${centerY - doubleOffset}" stroke="${color}" stroke-width="${lineWidth}"/>`,
        `<line x1="${centerX}" y1="${centerY + doubleOffset}" x2="${x + cellWidth}" y2="${centerY + doubleOffset}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    } else {
      const w = getWidth(segments.right);
      paths.push(
        `<line x1="${centerX}" y1="${centerY}" x2="${x + cellWidth}" y2="${centerY}" stroke="${color}" stroke-width="${w}"/>`
      );
    }
  }

  return { svg: paths.join(''), handled: true };
}

/**
 * Render double-line corners and junctions with proper corner connections
 * Double lines need L-shaped paths where outer connects to outer and inner to inner
 */
function renderDoubleLineCorner(
  segments: BoxSegments,
  ctx: GlyphContext,
  doubleOffset: number
): GlyphResult {
  const { cellWidth, cellHeight, x, y, color, lineWidth } = ctx;
  const centerX = x + cellWidth / 2;
  const centerY = y + cellHeight / 2;

  const paths: string[] = [];

  const hasUp = segments.up === 3;
  const hasDown = segments.down === 3;
  const hasLeft = segments.left === 3;
  const hasRight = segments.right === 3;

  // Calculate the corners of the double-line box
  const outerLeft = centerX - doubleOffset;
  const outerRight = centerX + doubleOffset;
  const outerTop = centerY - doubleOffset;
  const outerBottom = centerY + doubleOffset;

  // ╚ - double up and right
  if (hasUp && hasRight && !hasDown && !hasLeft) {
    // Outer L (left vertical to bottom horizontal)
    paths.push(
      `<path d="M ${outerLeft} ${y} L ${outerLeft} ${outerBottom} L ${x + cellWidth} ${outerBottom}" fill="none" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    // Inner L (right vertical to top horizontal)
    paths.push(
      `<path d="M ${outerRight} ${y} L ${outerRight} ${outerTop} L ${x + cellWidth} ${outerTop}" fill="none" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  // ╔ - double down and right
  else if (hasDown && hasRight && !hasUp && !hasLeft) {
    // Outer L
    paths.push(
      `<path d="M ${outerLeft} ${y + cellHeight} L ${outerLeft} ${outerTop} L ${x + cellWidth} ${outerTop}" fill="none" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    // Inner L
    paths.push(
      `<path d="M ${outerRight} ${y + cellHeight} L ${outerRight} ${outerBottom} L ${x + cellWidth} ${outerBottom}" fill="none" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  // ╗ - double down and left
  else if (hasDown && hasLeft && !hasUp && !hasRight) {
    // Outer L
    paths.push(
      `<path d="M ${outerRight} ${y + cellHeight} L ${outerRight} ${outerTop} L ${x} ${outerTop}" fill="none" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    // Inner L
    paths.push(
      `<path d="M ${outerLeft} ${y + cellHeight} L ${outerLeft} ${outerBottom} L ${x} ${outerBottom}" fill="none" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  // ╝ - double up and left
  else if (hasUp && hasLeft && !hasDown && !hasRight) {
    // Outer L
    paths.push(
      `<path d="M ${outerRight} ${y} L ${outerRight} ${outerBottom} L ${x} ${outerBottom}" fill="none" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    // Inner L
    paths.push(
      `<path d="M ${outerLeft} ${y} L ${outerLeft} ${outerTop} L ${x} ${outerTop}" fill="none" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  // ╠ - double vertical and right
  else if (hasUp && hasDown && hasRight && !hasLeft) {
    // Left vertical line (continuous)
    paths.push(
      `<line x1="${outerLeft}" y1="${y}" x2="${outerLeft}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    // Right vertical with gap for horizontal
    paths.push(
      `<line x1="${outerRight}" y1="${y}" x2="${outerRight}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${outerBottom}" x2="${outerRight}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    // Horizontal lines to the right
    paths.push(
      `<line x1="${outerRight}" y1="${outerTop}" x2="${x + cellWidth}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${outerBottom}" x2="${x + cellWidth}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  // ╣ - double vertical and left
  else if (hasUp && hasDown && hasLeft && !hasRight) {
    // Right vertical line (continuous)
    paths.push(
      `<line x1="${outerRight}" y1="${y}" x2="${outerRight}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    // Left vertical with gap for horizontal
    paths.push(
      `<line x1="${outerLeft}" y1="${y}" x2="${outerLeft}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerLeft}" y1="${outerBottom}" x2="${outerLeft}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    // Horizontal lines to the left
    paths.push(
      `<line x1="${x}" y1="${outerTop}" x2="${outerLeft}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${x}" y1="${outerBottom}" x2="${outerLeft}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  // ╦ - double down and horizontal
  else if (hasDown && hasLeft && hasRight && !hasUp) {
    // Top horizontal line (continuous)
    paths.push(
      `<line x1="${x}" y1="${outerTop}" x2="${x + cellWidth}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    // Bottom horizontal with gap for vertical
    paths.push(
      `<line x1="${x}" y1="${outerBottom}" x2="${outerLeft}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${outerBottom}" x2="${x + cellWidth}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    // Vertical lines down
    paths.push(
      `<line x1="${outerLeft}" y1="${outerBottom}" x2="${outerLeft}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${outerBottom}" x2="${outerRight}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  // ╩ - double up and horizontal
  else if (hasUp && hasLeft && hasRight && !hasDown) {
    // Bottom horizontal line (continuous)
    paths.push(
      `<line x1="${x}" y1="${outerBottom}" x2="${x + cellWidth}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    // Top horizontal with gap for vertical
    paths.push(
      `<line x1="${x}" y1="${outerTop}" x2="${outerLeft}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${outerTop}" x2="${x + cellWidth}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    // Vertical lines up
    paths.push(
      `<line x1="${outerLeft}" y1="${y}" x2="${outerLeft}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${y}" x2="${outerRight}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  // ╬ - double cross
  else if (hasUp && hasDown && hasLeft && hasRight) {
    // Vertical lines with gaps
    paths.push(
      `<line x1="${outerLeft}" y1="${y}" x2="${outerLeft}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerLeft}" y1="${outerBottom}" x2="${outerLeft}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${y}" x2="${outerRight}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${outerBottom}" x2="${outerRight}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
    // Horizontal lines with gaps
    paths.push(
      `<line x1="${x}" y1="${outerTop}" x2="${outerLeft}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${outerTop}" x2="${x + cellWidth}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${x}" y1="${outerBottom}" x2="${outerLeft}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${outerRight}" y1="${outerBottom}" x2="${x + cellWidth}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }
  // Fallback for other combinations - just draw the segments
  else {
    if (hasUp) {
      paths.push(
        `<line x1="${outerLeft}" y1="${y}" x2="${outerLeft}" y2="${centerY}" stroke="${color}" stroke-width="${lineWidth}"/>`,
        `<line x1="${outerRight}" y1="${y}" x2="${outerRight}" y2="${centerY}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    }
    if (hasDown) {
      paths.push(
        `<line x1="${outerLeft}" y1="${centerY}" x2="${outerLeft}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`,
        `<line x1="${outerRight}" y1="${centerY}" x2="${outerRight}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    }
    if (hasLeft) {
      paths.push(
        `<line x1="${x}" y1="${outerTop}" x2="${centerX}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
        `<line x1="${x}" y1="${outerBottom}" x2="${centerX}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    }
    if (hasRight) {
      paths.push(
        `<line x1="${centerX}" y1="${outerTop}" x2="${x + cellWidth}" y2="${outerTop}" stroke="${color}" stroke-width="${lineWidth}"/>`,
        `<line x1="${centerX}" y1="${outerBottom}" x2="${x + cellWidth}" y2="${outerBottom}" stroke="${color}" stroke-width="${lineWidth}"/>`
      );
    }
  }

  return { svg: paths.join(''), handled: true };
}

/**
 * Render diagonal line characters (U+2571-U+2573)
 */
function renderDiagonalLine(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color, lineWidth } = ctx;
  const paths: string[] = [];

  if (codePoint === 0x2571 || codePoint === 0x2573) {
    // ╱ diagonal from bottom-left to top-right
    paths.push(
      `<line x1="${x}" y1="${y + cellHeight}" x2="${x + cellWidth}" y2="${y}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }

  if (codePoint === 0x2572 || codePoint === 0x2573) {
    // ╲ diagonal from top-left to bottom-right
    paths.push(
      `<line x1="${x}" y1="${y}" x2="${x + cellWidth}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }

  return { svg: paths.join(''), handled: true };
}

// ============================================================================
// Block Elements (U+2580-U+259F)
// ============================================================================

/**
 * Render a block element character
 */
function renderBlockElement(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color } = ctx;

  // Use crispEdges to disable anti-aliasing and prevent seams between adjacent cells
  const crisp = ' shape-rendering="crispEdges"';

  let svg = '';

  switch (codePoint) {
    // Upper half block
    case 0x2580:
      svg = `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`;
      break;

    // Lower blocks (1/8 to 7/8)
    case 0x2581: // Lower 1/8
      svg = `<rect x="${x}" y="${y + cellHeight * 7 / 8}" width="${cellWidth}" height="${cellHeight / 8}" fill="${color}"${crisp}/>`;
      break;
    case 0x2582: // Lower 1/4
      svg = `<rect x="${x}" y="${y + cellHeight * 3 / 4}" width="${cellWidth}" height="${cellHeight / 4}" fill="${color}"${crisp}/>`;
      break;
    case 0x2583: // Lower 3/8
      svg = `<rect x="${x}" y="${y + cellHeight * 5 / 8}" width="${cellWidth}" height="${cellHeight * 3 / 8}" fill="${color}"${crisp}/>`;
      break;
    case 0x2584: // Lower half
      svg = `<rect x="${x}" y="${y + cellHeight / 2}" width="${cellWidth}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`;
      break;
    case 0x2585: // Lower 5/8
      svg = `<rect x="${x}" y="${y + cellHeight * 3 / 8}" width="${cellWidth}" height="${cellHeight * 5 / 8}" fill="${color}"${crisp}/>`;
      break;
    case 0x2586: // Lower 3/4
      svg = `<rect x="${x}" y="${y + cellHeight / 4}" width="${cellWidth}" height="${cellHeight * 3 / 4}" fill="${color}"${crisp}/>`;
      break;
    case 0x2587: // Lower 7/8
      svg = `<rect x="${x}" y="${y + cellHeight / 8}" width="${cellWidth}" height="${cellHeight * 7 / 8}" fill="${color}"${crisp}/>`;
      break;

    // Full block
    case 0x2588:
      svg = `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${color}"${crisp}/>`;
      break;

    // Left blocks (7/8 to 1/8)
    case 0x2589: // Left 7/8
      svg = `<rect x="${x}" y="${y}" width="${cellWidth * 7 / 8}" height="${cellHeight}" fill="${color}"${crisp}/>`;
      break;
    case 0x258a: // Left 3/4
      svg = `<rect x="${x}" y="${y}" width="${cellWidth * 3 / 4}" height="${cellHeight}" fill="${color}"${crisp}/>`;
      break;
    case 0x258b: // Left 5/8
      svg = `<rect x="${x}" y="${y}" width="${cellWidth * 5 / 8}" height="${cellHeight}" fill="${color}"${crisp}/>`;
      break;
    case 0x258c: // Left half
      svg = `<rect x="${x}" y="${y}" width="${cellWidth / 2}" height="${cellHeight}" fill="${color}"${crisp}/>`;
      break;
    case 0x258d: // Left 3/8
      svg = `<rect x="${x}" y="${y}" width="${cellWidth * 3 / 8}" height="${cellHeight}" fill="${color}"${crisp}/>`;
      break;
    case 0x258e: // Left 1/4
      svg = `<rect x="${x}" y="${y}" width="${cellWidth / 4}" height="${cellHeight}" fill="${color}"${crisp}/>`;
      break;
    case 0x258f: // Left 1/8
      svg = `<rect x="${x}" y="${y}" width="${cellWidth / 8}" height="${cellHeight}" fill="${color}"${crisp}/>`;
      break;

    // Right half block
    case 0x2590:
      svg = `<rect x="${x + cellWidth / 2}" y="${y}" width="${cellWidth / 2}" height="${cellHeight}" fill="${color}"${crisp}/>`;
      break;

    // Shade characters - rendered as semi-transparent rectangles
    // following the approach used by VTE-based terminals (GNOME Terminal, etc.)
    // for a cleaner, more uniform appearance without gaps between cells
    case 0x2591: // Light shade (25% opacity)
      svg = `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${color}" fill-opacity="0.25"${crisp}/>`;
      break;
    case 0x2592: // Medium shade (50% opacity)
      svg = `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${color}" fill-opacity="0.5"${crisp}/>`;
      break;
    case 0x2593: // Dark shade (75% opacity)
      svg = `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${color}" fill-opacity="0.75"${crisp}/>`;
      break;

    // Upper 1/8 block
    case 0x2594:
      svg = `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight / 8}" fill="${color}"${crisp}/>`;
      break;

    // Right 1/8 block
    case 0x2595:
      svg = `<rect x="${x + cellWidth * 7 / 8}" y="${y}" width="${cellWidth / 8}" height="${cellHeight}" fill="${color}"${crisp}/>`;
      break;

    // Quadrants
    case 0x2596: // Lower left
      svg = `<rect x="${x}" y="${y + cellHeight / 2}" width="${cellWidth / 2}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`;
      break;
    case 0x2597: // Lower right
      svg = `<rect x="${x + cellWidth / 2}" y="${y + cellHeight / 2}" width="${cellWidth / 2}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`;
      break;
    case 0x2598: // Upper left
      svg = `<rect x="${x}" y="${y}" width="${cellWidth / 2}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`;
      break;
    case 0x2599: // Upper left, lower left, lower right
      svg = [
        `<rect x="${x}" y="${y}" width="${cellWidth / 2}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`,
        `<rect x="${x}" y="${y + cellHeight / 2}" width="${cellWidth}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`,
      ].join('');
      break;
    case 0x259a: // Upper left, lower right
      svg = [
        `<rect x="${x}" y="${y}" width="${cellWidth / 2}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`,
        `<rect x="${x + cellWidth / 2}" y="${y + cellHeight / 2}" width="${cellWidth / 2}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`,
      ].join('');
      break;
    case 0x259b: // Upper left, upper right, lower left
      svg = [
        `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`,
        `<rect x="${x}" y="${y + cellHeight / 2}" width="${cellWidth / 2}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`,
      ].join('');
      break;
    case 0x259c: // Upper left, upper right, lower right
      svg = [
        `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`,
        `<rect x="${x + cellWidth / 2}" y="${y + cellHeight / 2}" width="${cellWidth / 2}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`,
      ].join('');
      break;
    case 0x259d: // Upper right
      svg = `<rect x="${x + cellWidth / 2}" y="${y}" width="${cellWidth / 2}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`;
      break;
    case 0x259e: // Upper right, lower left
      svg = [
        `<rect x="${x + cellWidth / 2}" y="${y}" width="${cellWidth / 2}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`,
        `<rect x="${x}" y="${y + cellHeight / 2}" width="${cellWidth / 2}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`,
      ].join('');
      break;
    case 0x259f: // Upper right, lower left, lower right
      svg = [
        `<rect x="${x + cellWidth / 2}" y="${y}" width="${cellWidth / 2}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`,
        `<rect x="${x}" y="${y + cellHeight / 2}" width="${cellWidth}" height="${cellHeight / 2}" fill="${color}"${crisp}/>`,
      ].join('');
      break;

    default:
      return { svg: '', handled: false };
  }

  return { svg, handled: true };
}

/**
 * Render a shade pattern using a semi-transparent rect
 */
// ============================================================================
// Braille Patterns (U+2800-U+28FF)
// ============================================================================

/**
 * Render a Braille pattern character
 * Braille characters are encoded with 8 dots in a 2x4 grid:
 *   1 4
 *   2 5
 *   3 6
 *   7 8
 * The code point is U+2800 + (bit pattern)
 */
function renderBraille(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color } = ctx;

  // Extract which dots are filled (bits 0-7)
  const pattern = codePoint - 0x2800;

  // Dot positions (relative fractions of cell)
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

  // Map bit positions to dot positions
  // Bits: 0=dot1, 1=dot2, 2=dot3, 3=dot4, 4=dot5, 5=dot6, 6=dot7, 7=dot8
  const dotPositions = [
    [leftX, rows[0]],   // dot 1
    [leftX, rows[1]],   // dot 2
    [leftX, rows[2]],   // dot 3
    [rightX, rows[0]],  // dot 4
    [rightX, rows[1]],  // dot 5
    [rightX, rows[2]],  // dot 6
    [leftX, rows[3]],   // dot 7
    [rightX, rows[3]],  // dot 8
  ];

  for (let i = 0; i < 8; i++) {
    if (pattern & (1 << i)) {
      const [dx, dy] = dotPositions[i];
      dots.push(`<circle cx="${dx}" cy="${dy}" r="${dotRadius}" fill="${color}"/>`);
    }
  }

  return { svg: dots.join(''), handled: true };
}

// ============================================================================
// Symbols for Legacy Computing (U+1FB00-U+1FBFF)
// ============================================================================

/**
 * Render a Legacy Computing symbol
 */
function renderLegacyComputing(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color } = ctx;

  // Block Sextants (U+1FB00-U+1FB3B)
  // These are 2x3 grids where each sextant can be filled
  if (codePoint >= 0x1fb00 && codePoint <= 0x1fb3b) {
    return renderSextant(codePoint, ctx);
  }

  // Smooth mosaic terminal graphics (U+1FB3C-U+1FB6F)
  // These include diagonal fills and triangular blocks
  if (codePoint >= 0x1fb3c && codePoint <= 0x1fb6f) {
    return renderSmoothMosaic(codePoint, ctx);
  }

  // Additional block elements (U+1FB70-U+1FB8B)
  if (codePoint >= 0x1fb70 && codePoint <= 0x1fb8b) {
    return renderLegacyBlockElement(codePoint, ctx);
  }

  // Rectangular shade characters (U+1FB8C-U+1FB94)
  if (codePoint >= 0x1fb8c && codePoint <= 0x1fb94) {
    return renderLegacyShade(codePoint, ctx);
  }

  // Fill patterns (U+1FB95-U+1FB99)
  if (codePoint >= 0x1fb95 && codePoint <= 0x1fb99) {
    return renderFillPattern(codePoint, ctx);
  }

  // Triangular shade (U+1FB9A-U+1FB9F)
  if (codePoint >= 0x1fb9a && codePoint <= 0x1fb9f) {
    return renderTriangularShade(codePoint, ctx);
  }

  // Character cell diagonals (U+1FBA0-U+1FBAF)
  if (codePoint >= 0x1fba0 && codePoint <= 0x1fbaf) {
    return renderCellDiagonal(codePoint, ctx);
  }

  return { svg: '', handled: false };
}

/**
 * Render a sextant character (2x3 grid)
 * U+1FB00-U+1FB3B represent all combinations of filled sextants
 */
function renderSextant(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color } = ctx;

  // Sextant layout:
  // 1 2
  // 3 4
  // 5 6
  // The code points encode which sextants are filled
  // U+1FB00 has none filled (empty, but we still handle it)
  // Each subsequent code point adds sextants in a specific pattern

  // Calculate sextant dimensions
  const sw = cellWidth / 2;
  const sh = cellHeight / 3;

  // Map code points to sextant patterns
  // This is a simplified mapping - the actual Unicode encoding is complex
  const offset = codePoint - 0x1fb00;

  // For sextants, bits represent: 1=top-left, 2=top-right, 4=mid-left, 8=mid-right, 16=bot-left, 32=bot-right
  // But the Unicode encoding skips some combinations (those covered by other blocks)
  // We'll use a lookup approach for common patterns

  const sextantPatterns: Record<number, number[]> = {};

  // Generate all 64 possible sextant combinations (6 cells = 2^6)
  // Skip patterns that have full rows/columns (covered by block elements)
  let patternIndex = 0;
  for (let bits = 1; bits < 64; bits++) {
    // Skip full block (all 6 bits) - it's U+2588
    if (bits === 63) continue;
    // Skip patterns covered by basic block elements
    // (This is simplified - actual Unicode is more nuanced)
    sextantPatterns[patternIndex] = [];
    if (bits & 1) sextantPatterns[patternIndex].push(0);  // top-left
    if (bits & 2) sextantPatterns[patternIndex].push(1);  // top-right
    if (bits & 4) sextantPatterns[patternIndex].push(2);  // mid-left
    if (bits & 8) sextantPatterns[patternIndex].push(3);  // mid-right
    if (bits & 16) sextantPatterns[patternIndex].push(4); // bot-left
    if (bits & 32) sextantPatterns[patternIndex].push(5); // bot-right
    patternIndex++;
  }

  const filled = sextantPatterns[offset] || [];
  const rects: string[] = [];

  // Sextant positions: 0=top-left, 1=top-right, 2=mid-left, 3=mid-right, 4=bot-left, 5=bot-right
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

/**
 * Render smooth mosaic terminal graphics (diagonal fills, triangles)
 */
function renderSmoothMosaic(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color } = ctx;

  // These characters have diagonal cuts creating triangular shapes
  // For simplicity, we'll render common patterns

  // Upper left triangle
  if (codePoint === 0x1fb3c) {
    return {
      svg: `<polygon points="${x},${y} ${x + cellWidth},${y} ${x},${y + cellHeight}" fill="${color}"/>`,
      handled: true,
    };
  }

  // Upper right triangle
  if (codePoint === 0x1fb3d) {
    return {
      svg: `<polygon points="${x},${y} ${x + cellWidth},${y} ${x + cellWidth},${y + cellHeight}" fill="${color}"/>`,
      handled: true,
    };
  }

  // Lower left triangle
  if (codePoint === 0x1fb3e) {
    return {
      svg: `<polygon points="${x},${y} ${x},${y + cellHeight} ${x + cellWidth},${y + cellHeight}" fill="${color}"/>`,
      handled: true,
    };
  }

  // Lower right triangle
  if (codePoint === 0x1fb3f) {
    return {
      svg: `<polygon points="${x + cellWidth},${y} ${x},${y + cellHeight} ${x + cellWidth},${y + cellHeight}" fill="${color}"/>`,
      handled: true,
    };
  }

  // For other smooth mosaic characters, render as a full block fallback
  return {
    svg: `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${color}" fill-opacity="0.5"/>`,
    handled: true,
  };
}

/**
 * Render legacy block elements (additional fractional blocks)
 */
function renderLegacyBlockElement(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color } = ctx;

  // These extend the basic block elements with more fractional sizes
  // U+1FB70-U+1FB75: Vertical one-eighth blocks (positions 1-6)
  // U+1FB76-U+1FB7B: Horizontal one-eighth blocks (positions 1-6)
  // And various combinations

  const offset = codePoint - 0x1fb70;

  // Vertical eighth blocks at different positions
  if (offset >= 0 && offset <= 5) {
    const startY = y + (offset + 1) * (cellHeight / 8);
    return {
      svg: `<rect x="${x}" y="${startY}" width="${cellWidth}" height="${cellHeight / 8}" fill="${color}"/>`,
      handled: true,
    };
  }

  // Horizontal eighth blocks at different positions
  if (offset >= 6 && offset <= 11) {
    const pos = offset - 6;
    const startX = x + (pos + 1) * (cellWidth / 8);
    return {
      svg: `<rect x="${startX}" y="${y}" width="${cellWidth / 8}" height="${cellHeight}" fill="${color}"/>`,
      handled: true,
    };
  }

  // Fallback for other characters in this range
  return {
    svg: `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${color}" fill-opacity="0.5"/>`,
    handled: true,
  };
}

/**
 * Render legacy shade characters
 */
function renderLegacyShade(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color } = ctx;

  // These are half-block shades and inverse shades
  const offset = codePoint - 0x1fb8c;

  // Medium shade variations for different block portions
  const shadeOpacity = 0.5;

  switch (offset) {
    case 0: // Left half medium shade
      return {
        svg: `<rect x="${x}" y="${y}" width="${cellWidth / 2}" height="${cellHeight}" fill="${color}" fill-opacity="${shadeOpacity}"/>`,
        handled: true,
      };
    case 1: // Right half medium shade
      return {
        svg: `<rect x="${x + cellWidth / 2}" y="${y}" width="${cellWidth / 2}" height="${cellHeight}" fill="${color}" fill-opacity="${shadeOpacity}"/>`,
        handled: true,
      };
    case 2: // Upper half medium shade
      return {
        svg: `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight / 2}" fill="${color}" fill-opacity="${shadeOpacity}"/>`,
        handled: true,
      };
    case 3: // Lower half medium shade
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

/**
 * Render fill patterns (checkerboard, etc.)
 */
function renderFillPattern(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color } = ctx;

  // U+1FB95: Checker board fill
  // U+1FB96: Inverse checker board
  // U+1FB97-99: Various diagonal fills

  if (codePoint === 0x1fb95 || codePoint === 0x1fb96) {
    // Checkerboard pattern
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

  // Diagonal fill patterns
  return {
    svg: `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${color}" fill-opacity="0.5"/>`,
    handled: true,
  };
}

/**
 * Render triangular shade characters
 */
function renderTriangularShade(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color } = ctx;

  // U+1FB9A: Upper and lower triangular medium shade
  // U+1FB9B: Left and right triangular medium shade
  // etc.

  const shadeOpacity = 0.5;

  switch (codePoint) {
    case 0x1fb9a: // Upper left triangular medium shade
      return {
        svg: `<polygon points="${x},${y} ${x + cellWidth},${y} ${x},${y + cellHeight}" fill="${color}" fill-opacity="${shadeOpacity}"/>`,
        handled: true,
      };
    case 0x1fb9b: // Upper right triangular medium shade
      return {
        svg: `<polygon points="${x},${y} ${x + cellWidth},${y} ${x + cellWidth},${y + cellHeight}" fill="${color}" fill-opacity="${shadeOpacity}"/>`,
        handled: true,
      };
    case 0x1fb9c: // Lower right triangular medium shade
      return {
        svg: `<polygon points="${x + cellWidth},${y} ${x},${y + cellHeight} ${x + cellWidth},${y + cellHeight}" fill="${color}" fill-opacity="${shadeOpacity}"/>`,
        handled: true,
      };
    case 0x1fb9d: // Lower left triangular medium shade
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

/**
 * Render character cell diagonal lines
 */
function renderCellDiagonal(codePoint: number, ctx: GlyphContext): GlyphResult {
  const { cellWidth, cellHeight, x, y, color, lineWidth } = ctx;

  // These are thin diagonal lines within the cell
  // U+1FBA0-U+1FBAF: Various diagonal configurations

  const paths: string[] = [];
  const offset = codePoint - 0x1fba0;

  // Box drawing light diagonal upper right to lower left
  if (offset === 0 || offset === 2 || offset === 4 || offset === 6 ||
      offset === 8 || offset === 10 || offset === 12 || offset === 14) {
    paths.push(
      `<line x1="${x + cellWidth}" y1="${y}" x2="${x}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }

  // Box drawing light diagonal upper left to lower right
  if (offset === 1 || offset === 2 || offset === 5 || offset === 6 ||
      offset === 9 || offset === 10 || offset === 13 || offset === 14) {
    paths.push(
      `<line x1="${x}" y1="${y}" x2="${x + cellWidth}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }

  // Box drawing light diagonal middle segments
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
    // Fallback: simple X
    paths.push(
      `<line x1="${x}" y1="${y}" x2="${x + cellWidth}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`,
      `<line x1="${x + cellWidth}" y1="${y}" x2="${x}" y2="${y + cellHeight}" stroke="${color}" stroke-width="${lineWidth}"/>`
    );
  }

  return { svg: paths.join(''), handled: true };
}
