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

import type {
  SnapttyOptions,
  RenderOptions,
  Theme,
  Template,
  ParsedLine,
} from './types.js';
import { parseAnsi, getMaxWidth } from './parser/index.js';
import { renderSvg, darkTheme, getDefaultFontConfig } from './renderer/index.js';
import { resolveTemplate, templates } from './templates/index.js';
import { createFontConfig, loadEmbeddedFont } from './fonts/index.js';

/**
 * Default options
 */
const defaults: Required<
  Omit<SnapttyOptions, 'customFont' | 'width' | 'watermark'>
> & { width: number | null; watermark: string | null } = {
  template: 'macos',
  title: '',
  theme: darkTheme,
  fontSize: 14,
  lineHeight: 1.4,
  padding: 16,
  width: null,
  watermark: null,
  windowControls: true,
  fontFamily: "'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'Courier New', monospace",
  embedFont: false,
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

  return {
    template,
    title: options.title ?? defaults.title,
    theme,
    font,
    padding: options.padding ?? template.chrome.padding,
    width: options.width ?? defaults.width,
    watermark: options.watermark ?? defaults.watermark,
    windowControls: options.windowControls ?? defaults.windowControls,
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
  SnapttyOptions,
  Theme,
  Template,
  ChromeConfig,
  WindowControlStyle,
  FontConfig,
  ParsedLine,
  TextSpan,
  TextStyle,
  RGB,
} from './types.js';

// Re-export utilities
export { templates, resolveTemplate, createTemplate } from './templates/index.js';
export { darkTheme, createTheme } from './renderer/colors.js';
export { parseAnsi, stripAnsi, getMaxWidth } from './parser/index.js';
export { createFontConfig, loadEmbeddedFont, loadFont } from './fonts/index.js';

// Default export
export default snaptty;
