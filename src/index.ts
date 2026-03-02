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

const DEFAULTS = {
  template: 'macos',
  title: '',
  theme: darkTheme,
  fontSize: 14,
  lineHeight: 1.4,
  padding: 16,
  width: null,
  watermark: null,
  watermarkPadding: null,
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
  const watermarkPaddingInput = options.watermarkPadding ?? paddingInput;

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
    watermark: options.watermark ?? DEFAULTS.watermark,
    watermarkPadding: resolvePadding(watermarkPaddingInput),
    controls: options.controls ?? template.shell.controls,
    customGlyphs: options.customGlyphs ?? DEFAULTS.customGlyphs,
    header: resolveShellConfig(options.header, theme, template.shell.titleBarHeight, 'headerBackground'),
    footer: resolveShellConfig(options.footer, theme, template.shell.titleBarHeight, 'footerBackground'),
  };
};

export const shellfie = (input: string, options: shellfieOptions = {}): string =>
  renderSvg(parseAnsi(input), resolveOptions(options)).svg;

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

  return renderSvg(parseAnsi(input), renderOptions).svg;
};

export const parse = (input: string): ParsedLine[] => parseAnsi(input);

export const render = (lines: ParsedLine[], options: shellfieOptions = {}): string =>
  renderSvg(lines, resolveOptions(options)).svg;

export type {
  ControlStyle,
  FontConfig,
  ParsedLine,
  RGB,
  ShellConfig,
  shellfieOptions,
  Template,
  TextSpan,
  TextStyle,
  Theme
} from './types';

export { createFontConfig, loadEmbeddedFont, loadFont } from './fonts';
export { getMaxWidth, parseAnsi, stripAnsi } from './parser';
export { createTheme, darkTheme } from './renderer';
export { createTemplate, resolveTemplate, templates } from './templates';
export * from './themes';
export { themes } from './themes';

export default shellfie;
