/**
 * snaptty - Convert terminal output to crystal-clear SVG images
 *
 * @example
 * ```typescript
 * import { snaptty } from 'snaptty';
 *
 * // Simple usage
 * const svg = snaptty('Hello \x1b[32mWorld\x1b[0m');
 *
 * // With options
 * const svg = snaptty(terminalOutput, {
 *   template: 'macos',
 *   title: 'my-script.sh',
 *   fontSize: 14,
 * });
 * ```
 */

import { createFontConfig, loadEmbeddedFont } from './fonts';
import { parseAnsi } from './parser';
import { darkTheme, renderSvg } from './renderer';
import { resolveTemplate } from './templates';
import type {
  PaddingInput,
  ParsedLine,
  RenderOptions,
  ResolvedPadding,
  SnapttyOptions
} from './types';

/**
 * Resolve CSS-style padding shorthand into individual values
 */
function resolvePadding(input: PaddingInput): ResolvedPadding {
  if (typeof input === 'number') {
    return { top: input, right: input, bottom: input, left: input };
  }
  if (input.length === 2) {
    const [vertical, horizontal] = input;
    return { top: vertical, right: horizontal, bottom: vertical, left: horizontal };
  }
  const [top, right, bottom, left] = input;
  return { top, right, bottom, left };
}

/**
 * Default options
 */
const defaults = {
  template: 'macos' as const,
  title: '',
  theme: darkTheme,
  fontSize: 14,
  lineHeight: 1.4,
  padding: 16 as PaddingInput,
  width: null as number | null,
  watermark: null as string | null,
  watermarkPadding: null as PaddingInput | null,
  windowControls: true,
  fontFamily: "'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'Courier New', monospace",
  embedFont: false,
  customGlyphs: true,
};

/**
 * Resolve user options into internal render options
 */
function resolveOptions(options: SnapttyOptions = {}): RenderOptions {
  const template = resolveTemplate(options.template);
  const theme = options.theme ?? defaults.theme;
  const fontSize = options.fontSize ?? defaults.fontSize;
  const lineHeight = options.lineHeight ?? defaults.lineHeight;
  const fontFamily = options.fontFamily ?? defaults.fontFamily;

  // Handle font configuration
  let embedData: string | undefined;
  let embedFormat: 'woff2' | 'woff' | 'ttf' | undefined;

  if (options.customFont) {
    embedData = options.customFont.data;
    embedFormat = options.customFont.format;
  }

  const font = createFontConfig({
    family: fontFamily,
    size: fontSize,
    lineHeight,
    embedData,
    embedFormat,
  });

  const paddingInput = options.padding ?? template.chrome.padding;
  const padding = resolvePadding(paddingInput);
  const watermarkPaddingInput = options.watermarkPadding ?? paddingInput;
  const watermarkPadding = resolvePadding(watermarkPaddingInput);

  return {
    template,
    title: options.title ?? defaults.title,
    theme,
    font,
    padding,
    width: options.width ?? defaults.width,
    watermark: options.watermark ?? defaults.watermark,
    watermarkPadding,
    windowControls: options.windowControls ?? defaults.windowControls,
    customGlyphs: options.customGlyphs ?? defaults.customGlyphs,
  };
}

/**
 * Convert terminal output to SVG (synchronous)
 *
 * @param input - Terminal output string (may contain ANSI escape codes)
 * @param options - Rendering options
 * @returns SVG string
 */
export function snaptty(input: string, options: SnapttyOptions = {}): string {
  const lines = parseAnsi(input);
  const renderOptions = resolveOptions(options);

  // Update window controls based on template if not explicitly set
  if (options.windowControls === undefined) {
    renderOptions.windowControls = renderOptions.template.chrome.windowControls;
  }

  const result = renderSvg(lines, renderOptions);
  return result.svg;
}

/**
 * Convert terminal output to SVG with async font embedding
 *
 * Use this when you need portable SVGs with embedded fonts.
 *
 * @param input - Terminal output string (may contain ANSI escape codes)
 * @param options - Rendering options
 * @returns Promise resolving to SVG string
 */
export async function snapttyAsync(
  input: string,
  options: SnapttyOptions = {}
): Promise<string> {
  const lines = parseAnsi(input);
  const renderOptions = resolveOptions(options);

  // Update window controls based on template if not explicitly set
  if (options.windowControls === undefined) {
    renderOptions.windowControls = renderOptions.template.chrome.windowControls;
  }

  // Handle font embedding if requested
  if (options.embedFont && !options.customFont) {
    const fontData = await loadEmbeddedFont();
    if (fontData) {
      renderOptions.font.embedData = fontData.data;
      renderOptions.font.embedFormat = fontData.format;
    }
  }

  const result = renderSvg(lines, renderOptions);
  return result.svg;
}

/**
 * Parse terminal output without rendering
 *
 * Useful for inspecting the parsed structure or custom rendering.
 */
export function parse(input: string): ParsedLine[] {
  return parseAnsi(input);
}

/**
 * Render parsed lines to SVG
 *
 * Use with `parse()` for custom workflows.
 */
export function render(
  lines: ParsedLine[],
  options: SnapttyOptions = {}
): string {
  const renderOptions = resolveOptions(options);

  if (options.windowControls === undefined) {
    renderOptions.windowControls = renderOptions.template.chrome.windowControls;
  }

  const result = renderSvg(lines, renderOptions);
  return result.svg;
}

// Re-export types
export type {
  ChromeConfig, FontConfig,
  ParsedLine, RGB, SnapttyOptions, Template, TextSpan,
  TextStyle, Theme, WindowControlStyle
} from './types';

// Re-export utilities
export { createFontConfig, loadEmbeddedFont, loadFont } from './fonts';
export { getMaxWidth, parseAnsi, stripAnsi } from './parser';
export { createTheme, darkTheme } from './renderer';
export { createTemplate, resolveTemplate, templates } from './templates';

// Default export
export default snaptty;
