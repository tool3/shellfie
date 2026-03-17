import { createFontConfig, loadEmbeddedFont } from './fonts';
import { isGradient, parseGradient } from './gradient';
import { highlight } from './highlight';
import { parseAnsi } from './parser';
import { darkTheme, renderSvg } from './renderer';
import { resolveTemplate } from './templates';
import type {
  BackgroundConfig,
  CSSShorthand,
  FooterConfig,
  Gradient,
  HeaderConfig,
  PaddingInput,
  ParsedLine,
  RenderOptions,
  ResolvedBackground,
  ResolvedFooterConfig,
  ResolvedHeaderConfig,
  ResolvedPadding,
  ResolvedWatermark,
  ResolvedWatermarkStyle,
  shellfieOptions,
  Theme,
  WatermarkConfig,
  WatermarkStyle
} from './types';

const DEFAULTS = {
  template: 'macos',
  title: '',
  theme: darkTheme,
  fontSize: 14,
  lineHeight: 1.4,
  padding: 16,
  width: null, // Auto-size by default
  height: null, // Auto-size by default
  watermark: null,
  controls: true,
  fontFamily: "'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'Courier New', monospace",
  embedFont: false,
  customGlyphs: true,
} as const;

const resolvePadding = (input: PaddingInput): ResolvedPadding => {
  if (typeof input === 'number') {
    return { top: input, right: input, bottom: input, left: input };
  }
  if (input.length === 2) {
    const [vertical, horizontal] = input;
    return { top: vertical, right: horizontal, bottom: vertical, left: horizontal };
  }
  const [top, right, bottom, left] = input;
  return { top, right, bottom, left };
};

const addAlpha = (hex: string, alpha: number): string =>
  `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;

type DecorativeConfig = HeaderConfig | FooterConfig;
type ResolvedDecorativeConfig = ResolvedHeaderConfig | ResolvedFooterConfig;

const mergeConfigs = (
  userConfig: DecorativeConfig | undefined,
  templateConfig: DecorativeConfig | undefined
): DecorativeConfig | undefined => {
  if (!userConfig && !templateConfig) return undefined;
  if (!templateConfig) return userConfig;
  if (!userConfig) return templateConfig;
  // User config overrides template config
  return { ...templateConfig, ...userConfig };
};

const resolveShellConfig = (
  config: DecorativeConfig | undefined,
  theme: Theme,
  defaultHeight: number,
  backgroundKey: 'headerBackground' | 'footerBackground'
): ResolvedDecorativeConfig | null => {
  if (!config) return null;

  return {
    backgroundColor: config.backgroundColor ?? theme[backgroundKey] ?? theme.background,
    height: config.height ?? defaultHeight,
    border: config.border ?? true,
    borderColor: config.borderColor ?? addAlpha(theme.foreground, 0.1),
    borderWidth: config.borderWidth ?? 1,
  };
};

const resolveCSSShorthand = (
  value: CSSShorthand | undefined,
  fallback: number
): { top: number; right: number; bottom: number; left: number } => {
  if (value === undefined) {
    return { top: fallback, right: fallback, bottom: fallback, left: fallback };
  }
  if (typeof value === 'number') {
    return { top: value, right: value, bottom: value, left: value };
  }
  if (value.length === 2) {
    const [vertical, horizontal] = value;
    return { top: vertical, right: horizontal, bottom: vertical, left: horizontal };
  }
  const [top, right, bottom, left] = value;
  return { top, right, bottom, left };
};

// CSS properties that are handled specially (not included in cssString)
const SPECIAL_STYLE_PROPS = new Set([
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
]);

// Convert camelCase to kebab-case for CSS
const toKebabCase = (str: string): string =>
  str.replace(/([A-Z])/g, '-$1').toLowerCase();

const resolveWatermarkStyle = (
  style: WatermarkStyle | undefined,
  fallbackPadding: number
): ResolvedWatermarkStyle => {
  const padding = resolveCSSShorthand(style?.padding, fallbackPadding);
  const margin = resolveCSSShorthand(style?.margin, 0);

  // Build CSS string from remaining properties
  const cssProps: string[] = [];
  if (style) {
    for (const [key, value] of Object.entries(style)) {
      if (SPECIAL_STYLE_PROPS.has(key) || value === undefined) continue;
      cssProps.push(`${toKebabCase(key)}: ${value}`);
    }
  }

  return {
    paddingTop: style?.paddingTop ?? padding.top,
    paddingRight: style?.paddingRight ?? padding.right,
    paddingBottom: style?.paddingBottom ?? padding.bottom,
    paddingLeft: style?.paddingLeft ?? padding.left,
    marginTop: style?.marginTop ?? margin.top,
    marginRight: style?.marginRight ?? margin.right,
    marginBottom: style?.marginBottom ?? margin.bottom,
    marginLeft: style?.marginLeft ?? margin.left,
    cssString: cssProps.join('; '),
  };
};

// SVG elements that are valid for watermark markup
const SVG_ELEMENT_REGEX = /^\s*<(a|circle|defs|ellipse|g|image|line|path|polygon|polyline|rect|svg|text|tspan|use)\b/i;

// Auto-detect if content is SVG markup by checking for common SVG elements
const detectWatermarkType = (content: string): 'text' | 'markup' => {
  return SVG_ELEMENT_REGEX.test(content) ? 'markup' : 'text';
};

const resolveWatermark = (
  watermark: string | WatermarkConfig | undefined,
  fallbackPadding: number
): ResolvedWatermark | null => {
  if (!watermark) return null;

  if (typeof watermark === 'string') {
    return {
      type: detectWatermarkType(watermark),
      content: watermark,
      style: resolveWatermarkStyle(undefined, fallbackPadding),
    };
  }

  return {
    type: watermark.type ?? detectWatermarkType(watermark.content),
    content: watermark.content,
    style: resolveWatermarkStyle(watermark.style, fallbackPadding),
  };
};

const DEFAULT_BACKGROUND_PADDING = 20;
const DEFAULT_BACKGROUND_BORDER_RADIUS = 12;

const isBackgroundConfig = (bg: unknown): bg is BackgroundConfig =>
  typeof bg === 'object' && bg !== null && 'color' in bg;

const resolveBackground = (
  background: string | BackgroundConfig | undefined
): ResolvedBackground | null => {
  if (!background) return null;

  // Handle { color, padding?, borderRadius? } object format
  if (isBackgroundConfig(background)) {
    const colorValue = typeof background.color === 'string'
      ? parseGradient(background.color)
      : background.color;
    return {
      value: colorValue,
      padding: background.padding ?? DEFAULT_BACKGROUND_PADDING,
      borderRadius: background.borderRadius ?? DEFAULT_BACKGROUND_BORDER_RADIUS,
    };
  }

  // Handle string format (hex color or gradient string)
  const value = parseGradient(background);

  return {
    value,
    padding: DEFAULT_BACKGROUND_PADDING,
    borderRadius: DEFAULT_BACKGROUND_BORDER_RADIUS,
  };
};

const resolveOptions = (options: shellfieOptions = {}): RenderOptions => {
  const baseTemplate = resolveTemplate(options.template);
  const template = options.controlsPosition
    ? {
        ...baseTemplate,
        shell: { ...baseTemplate.shell, controlsPosition: options.controlsPosition },
      }
    : baseTemplate;
  const theme = options.theme ?? DEFAULTS.theme;
  const paddingInput = options.padding ?? template.shell.padding;
  const defaultWatermarkPadding = typeof paddingInput === 'number' ? paddingInput : paddingInput[0];

  const font = createFontConfig({
    family: options.fontFamily ?? DEFAULTS.fontFamily,
    size: options.fontSize ?? DEFAULTS.fontSize,
    lineHeight: options.lineHeight ?? DEFAULTS.lineHeight,
    embedData: options.customFont?.data,
    embedFormat: options.customFont?.format,
  });

  return {
    template,
    title: options.title ?? DEFAULTS.title,
    theme,
    font,
    padding: resolvePadding(paddingInput),
    width: options.width ?? DEFAULTS.width,
    height: options.height ?? DEFAULTS.height,
    watermark: resolveWatermark(options.watermark, defaultWatermarkPadding),
    controls: options.controls ?? template.shell.controls,
    customGlyphs: options.customGlyphs ?? DEFAULTS.customGlyphs,
    header: resolveShellConfig(mergeConfigs(options.header, template.shell.header), theme, template.shell.titleBarHeight, 'headerBackground'),
    footer: resolveShellConfig(mergeConfigs(options.footer, template.shell.footer), theme, template.shell.titleBarHeight, 'footerBackground'),
    background: resolveBackground(options.background),
  };
};

export const shellfie = (input: string, options: shellfieOptions = {}): string => {
  // Apply syntax highlighting (default: auto-detect, use false to disable)
  const language = options.language ?? 'auto';
  const processedInput = language === false
    ? input
    : highlight(input, language);

  return renderSvg(parseAnsi(processedInput), resolveOptions(options)).svg;
};

export const shellfieAsync = async (
  input: string,
  options: shellfieOptions = {}
): Promise<string> => {
  const renderOptions = resolveOptions(options);

  if (options.embedFont && !options.customFont) {
    const fontData = await loadEmbeddedFont();
    if (fontData) {
      renderOptions.font.embedData = fontData.data;
      renderOptions.font.embedFormat = fontData.format;
    }
  }

  // Apply syntax highlighting (default: auto-detect, use false to disable)
  const language = options.language ?? 'auto';
  const processedInput = language === false
    ? input
    : highlight(input, language);

  return renderSvg(parseAnsi(processedInput), renderOptions).svg;
};

export const parse = (input: string): ParsedLine[] => parseAnsi(input);

export const render = (lines: ParsedLine[], options: shellfieOptions = {}): string =>
  renderSvg(lines, resolveOptions(options)).svg;

export type {
  BackgroundConfig,
  ControlStyle,
  CSSShorthand,
  FontConfig,
  Gradient,
  ParsedLine,
  RGB,
  ShellConfig,
  shellfieOptions,
  Template,
  TextSpan,
  TextStyle,
  Theme,
  WatermarkConfig,
  WatermarkStyle
} from './types';

export { isGradient, parseGradient } from './gradient';

export { createFontConfig, loadEmbeddedFont, loadFont } from './fonts';
export {
  detectLanguage,
  getLanguage,
  getLanguageByExtension,
  getLanguageNames,
  highlight,
  languages as highlightLanguages,
} from './highlight';
export { getMaxWidth, parseAnsi, stripAnsi } from './parser';
export { createTheme, darkTheme } from './renderer';
export { createTemplate, resolveTemplate, templates } from './templates';
export * from './themes';
export { themes } from './themes';

export default shellfie;
