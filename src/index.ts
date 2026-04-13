import { createFontConfig, loadEmbeddedFont } from './fonts';
import { isGradient, parseGradient } from './gradient';
import { detectLanguage, highlight } from './highlight';
import { parseAnsi } from './parser';
import { resolvePattern } from './patterns';
import { presets } from './presets';
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
  ResolvedGlow,
  ResolvedHeaderConfig,
  ResolvedBadge,
  ResolvedLineNumbers,
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

/**
 * Parse CSS border shorthand: '1px solid red' -> { width: 1, color: 'red' }
 * Also accepts just a color string: 'red' -> { width: 1, color: 'red' }
 */
const parseBorderShorthand = (border: string): { width: number; color: string } => {
  const parts = border.trim().split(/\s+/);
  let width = 1;
  let color = border.trim();

  if (parts.length >= 3) {
    // '1px solid red' or '2px solid #ff0000'
    width = parseFloat(parts[0]) || 1;
    color = parts.slice(2).join(' ');
  } else if (parts.length === 2) {
    // '1px red' or 'solid red'
    const maybeWidth = parseFloat(parts[0]);
    if (!isNaN(maybeWidth)) {
      width = maybeWidth;
      color = parts[1];
    } else {
      color = parts[1];
    }
  }
  // else single value = just a color

  return { width, color };
};

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

  let border = config.border ?? true;
  let borderColor = config.borderColor ?? addAlpha(theme.foreground, 0.1);
  let borderWidth = config.borderWidth ?? 1;

  if (typeof border === 'string') {
    const parsed = parseBorderShorthand(border);
    borderColor = config.borderColor ?? parsed.color;
    borderWidth = config.borderWidth ?? parsed.width;
    border = true;
  }

  return {
    backgroundColor: config.backgroundColor ?? theme[backgroundKey] ?? theme.background,
    height: config.height ?? defaultHeight,
    border,
    borderColor,
    borderWidth,
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

const resolveLineNumbers = (
  lineNumbers: shellfieOptions['lineNumbers'],
  theme: Theme
): ResolvedLineNumbers | null => {
  if (!lineNumbers) return null;
  if (lineNumbers === true) {
    return { color: addAlpha(theme.foreground, 0.4), startFrom: 1 };
  }
  return {
    color: lineNumbers.color ?? addAlpha(theme.foreground, 0.4),
    startFrom: lineNumbers.startFrom ?? 1,
  };
};

const resolveBadge = (
  badge: shellfieOptions['badge'],
  language: shellfieOptions['language'],
  input: string,
  theme: Theme
): ResolvedBadge | null => {
  if (!badge) return null;

  let label: string | undefined;
  if (typeof badge === 'object' && badge.label) {
    label = badge.label;
  } else if (typeof language === 'string' && language !== 'auto') {
    label = language;
  } else {
    const detected = detectLanguage(input);
    if (detected) label = detected.language;
  }

  if (!label) return null;

  // Capitalize first letter
  const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);

  const obj = typeof badge === 'object' ? badge : {};
  return {
    label: displayLabel,
    color: obj.color ?? theme.foreground,
    backgroundColor: obj.backgroundColor ?? null,
    borderRadius: obj.borderRadius ?? null,
    borderColor: obj.borderColor ?? (obj.borderWidth != null ? addAlpha(theme.foreground, 0.2) : null),
    borderWidth: obj.borderWidth ?? 1,
    opacity: obj.opacity ?? 0.8,
  };
};

const resolveGlow = (
  glow: shellfieOptions['glow'],
  borderColor: string | Gradient
): ResolvedGlow | null => {
  if (!glow) return null;
  const defaultColor = typeof borderColor === 'string' ? borderColor : '#00ffff';
  if (glow === true) {
    return { color: defaultColor, strength: 8, opacity: 0.6 };
  }
  return {
    color: glow.color ?? defaultColor,
    strength: glow.strength ?? 8,
    opacity: glow.opacity ?? 0.6,
  };
};

const resolveOverlays = (overlays: shellfieOptions['overlays']): shellfieOptions['overlays'] => {
  if (!overlays) return [];
  return overlays;
};

const DEFAULT_BACKGROUND_PADDING = 20;
const DEFAULT_BACKGROUND_BORDER_RADIUS = 12;

const isBackgroundConfig = (bg: unknown): bg is BackgroundConfig =>
  typeof bg === 'object' && bg !== null && 'color' in bg;

const resolveBackground = (
  background: string | BackgroundConfig | undefined
): ResolvedBackground | null => {
  if (!background) return null;

  // Handle { color, padding?, borderRadius?, pattern? } object format
  if (isBackgroundConfig(background)) {
    const colorValue = typeof background.color === 'string'
      ? parseGradient(background.color)
      : background.color;
    return {
      value: colorValue,
      padding: background.padding ?? DEFAULT_BACKGROUND_PADDING,
      borderRadius: background.borderRadius ?? DEFAULT_BACKGROUND_BORDER_RADIUS,
      pattern: resolvePattern(background.pattern),
    };
  }

  // Handle string format (hex color or gradient string)
  const value = parseGradient(background);

  return {
    value,
    padding: DEFAULT_BACKGROUND_PADDING,
    borderRadius: DEFAULT_BACKGROUND_BORDER_RADIUS,
    pattern: null,
  };
};

const stripUndefined = (obj: shellfieOptions): shellfieOptions => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) result[key] = value;
  }
  return result as shellfieOptions;
};

const resolvePreset = (preset: shellfieOptions['preset']): Omit<shellfieOptions, 'preset'> | undefined => {
  if (!preset) return undefined;
  if (typeof preset === 'string') {
    const resolved = presets[preset as keyof typeof presets];
    if (!resolved) throw new Error(`Unknown preset: ${preset}`);
    return resolved;
  }
  return preset;
};

const resolveOptions = (options: shellfieOptions = {}, input: string = ''): RenderOptions => {
  // Merge preset as base layer — user options override preset values
  const preset = resolvePreset(options.preset);
  const merged = preset ? { ...preset, ...stripUndefined(options) } : options;
  // Don't let preset recurse
  delete (merged as shellfieOptions).preset;

  const baseTemplate = resolveTemplate(merged.template);
  const shellOverrides: Partial<typeof baseTemplate.shell> = {};
  if (merged.controlsPosition) shellOverrides.controlsPosition = merged.controlsPosition;
  if (merged.borderColor) shellOverrides.borderColor = parseGradient(merged.borderColor);
  const template = Object.keys(shellOverrides).length > 0
    ? { ...baseTemplate, shell: { ...baseTemplate.shell, ...shellOverrides } }
    : baseTemplate;

  const theme = merged.theme ?? DEFAULTS.theme;
  const paddingInput = merged.padding ?? template.shell.padding;
  const defaultWatermarkPadding = typeof paddingInput === 'number' ? paddingInput : paddingInput[0];

  const font = createFontConfig({
    family: merged.fontFamily ?? DEFAULTS.fontFamily,
    size: merged.fontSize ?? DEFAULTS.fontSize,
    lineHeight: merged.lineHeight ?? DEFAULTS.lineHeight,
    embedData: merged.customFont?.data,
    embedFormat: merged.customFont?.format,
  });

  return {
    template,
    title: merged.title ?? DEFAULTS.title,
    titleAlignment: merged.titleAlignment ?? 'center',
    titleStyle: merged.titleStyle ?? 'text',
    theme,
    font,
    padding: resolvePadding(paddingInput),
    width: merged.width ?? DEFAULTS.width,
    height: merged.height ?? DEFAULTS.height,
    watermark: resolveWatermark(merged.watermark, defaultWatermarkPadding),
    controls: merged.controls ?? template.shell.controls,
    customGlyphs: merged.customGlyphs ?? DEFAULTS.customGlyphs,
    header: resolveShellConfig(mergeConfigs(merged.header, template.shell.header), theme, template.shell.titleBarHeight, 'headerBackground'),
    footer: resolveShellConfig(mergeConfigs(merged.footer, template.shell.footer), theme, template.shell.titleBarHeight, 'footerBackground'),
    background: resolveBackground(merged.background),
    lineNumbers: resolveLineNumbers(merged.lineNumbers, theme),
    badge: resolveBadge(merged.badge, merged.language, input, theme),
    backgroundOpacity: merged.backgroundOpacity ?? 1,
    glow: resolveGlow(merged.glow, template.shell.borderColor),
    overlays: resolveOverlays(merged.overlays),
    animation: merged.animation ?? null,
    animationColor: merged.animationColor ?? null,
  };
};

export const shellfie = (input: string, options: shellfieOptions = {}): string => {
  // Apply syntax highlighting (default: auto-detect, use false to disable)
  const language = options.language ?? 'auto';
  const processedInput = language === false
    ? input
    : highlight(input, language);

  return renderSvg(parseAnsi(processedInput), resolveOptions(options, input)).svg;
};

export const shellfieAsync = async (
  input: string,
  options: shellfieOptions = {}
): Promise<string> => {
  const renderOptions = resolveOptions(options, input);

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
  PatternConfig,
  PatternType,
  Preset,
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

export type { AnimationType } from './animations';

export { presets } from './presets';

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
