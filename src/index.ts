/**
 * shellfie - Convert terminal output to crystal-clear SVG images
 *
 * @example
 * ```typescript
 * import { shellfie } from 'shellfie';
 *
 * // Simple usage
 * const svg = shellfie('Hello \x1b[32mWorld\x1b[0m');
 *
 * // With options
 * const svg = shellfie(terminalOutput, {
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
  FooterConfig,
  HeaderConfig,
  PaddingInput,
  ParsedLine,
  RenderOptions,
  ResolvedFooterConfig,
  ResolvedHeaderConfig,
  ResolvedPadding,
  shellfieOptions,
  Theme
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
 * Add alpha to hex color (append 2-char hex alpha)
 */
function addAlpha(hex: string, alpha: number): string {
  const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hex}${alphaHex}`;
}

/**
 * Resolve header configuration (title bar styling)
 */
function resolveHeader(
  header: HeaderConfig | undefined,
  theme: Theme,
  defaultHeight: number
): ResolvedHeaderConfig | null {
  if (!header) return null;

  return {
    backgroundColor: header.backgroundColor ?? theme.headerBackground ?? theme.background,
    height: header.height ?? defaultHeight,
    border: header.border ?? true,
    borderColor: header.borderColor ?? addAlpha(theme.foreground, 0.1),
    borderWidth: header.borderWidth ?? 1,
  };
}

/**
 * Resolve footer configuration (bottom bar styling)
 */
function resolveFooter(
  footer: FooterConfig | undefined,
  theme: Theme,
  defaultHeight: number
): ResolvedFooterConfig | null {
  if (!footer) return null;

  return {
    backgroundColor: footer.backgroundColor ?? theme.footerBackground ?? theme.background,
    height: footer.height ?? defaultHeight,
    border: footer.border ?? true,
    borderColor: footer.borderColor ?? addAlpha(theme.foreground, 0.1),
    borderWidth: footer.borderWidth ?? 1,
  };
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
  controls: true,
  fontFamily: "'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'Courier New', monospace",
  embedFont: false,
  customGlyphs: true,
};

/**
 * Resolve user options into internal render options
 */
function resolveOptions(options: shellfieOptions = {}): RenderOptions {
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

  const paddingInput = options.padding ?? template.shell.padding;
  const padding = resolvePadding(paddingInput);
  const watermarkPaddingInput = options.watermarkPadding ?? paddingInput;
  const watermarkPadding = resolvePadding(watermarkPaddingInput);

  // Resolve header and footer (structural chrome elements)
  const header = resolveHeader(
    options.header,
    theme,
    template.shell.titleBarHeight
  );
  const footer = resolveFooter(
    options.footer,
    theme,
    template.shell.titleBarHeight
  );

  return {
    template,
    title: options.title ?? defaults.title,
    theme,
    font,
    padding,
    width: options.width ?? defaults.width,
    watermark: options.watermark ?? defaults.watermark,
    watermarkPadding,
    controls: options.controls ?? defaults.controls,
    customGlyphs: options.customGlyphs ?? defaults.customGlyphs,
    header,
    footer,
  };
}

/**
 * Convert terminal output to SVG (synchronous)
 *
 * @param input - Terminal output string (may contain ANSI escape codes)
 * @param options - Rendering options
 * @returns SVG string
 */
export function shellfie(input: string, options: shellfieOptions = {}): string {
  const lines = parseAnsi(input);
  const renderOptions = resolveOptions(options);

  // Update controls based on template if not explicitly set
  if (options.controls === undefined) {
    renderOptions.controls = renderOptions.template.shell.controls;
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
export async function shellfieAsync(
  input: string,
  options: shellfieOptions = {}
): Promise<string> {
  const lines = parseAnsi(input);
  const renderOptions = resolveOptions(options);

  // Update controls based on template if not explicitly set
  if (options.controls === undefined) {
    renderOptions.controls = renderOptions.template.shell.controls;
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
  options: shellfieOptions = {}
): string {
  const renderOptions = resolveOptions(options);

  if (options.controls === undefined) {
    renderOptions.controls = renderOptions.template.shell.controls;
  }

  const result = renderSvg(lines, renderOptions);
  return result.svg;
}

// Re-export types
export type {
  ShellConfig, FontConfig,
  ParsedLine, RGB, shellfieOptions, Template, TextSpan,
  TextStyle, Theme, ControlStyle
} from './types';

// Re-export utilities
export { createFontConfig, loadEmbeddedFont, loadFont } from './fonts';
export { getMaxWidth, parseAnsi, stripAnsi } from './parser';
export { createTheme, darkTheme } from './renderer';
export { createTemplate, resolveTemplate, templates } from './templates';

// Default export
export default shellfie;
