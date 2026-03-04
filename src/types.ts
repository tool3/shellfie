export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface TextStyle {
  foreground?: string | RGB;
  background?: string | RGB;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  dim?: boolean;
  inverse?: boolean;
}

export interface TextSpan {
  text: string;
  style: TextStyle;
}

export interface ParsedLine {
  spans: TextSpan[];
}

export interface Theme {
  name: string;
  background: string;
  foreground: string;
  cursor: string;
  selection: string;
  headerBackground?: string;
  footerBackground?: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export interface ControlStyle {
  close: string;
  minimize: string;
  maximize: string;
  radius: number;
  spacing: number;
  size: number;
}

export interface HeaderConfig {
  backgroundColor?: string;
  height?: number;
  border?: boolean;
  borderColor?: string;
  borderWidth?: number;
}

export interface FooterConfig {
  backgroundColor?: string;
  height?: number;
  border?: boolean;
  borderColor?: string;
  borderWidth?: number;
}

export interface ShellConfig {
  titleBar: boolean;
  titleBarHeight: number;
  borderRadius: number;
  controls: boolean;
  controlsPosition: 'left' | 'right';
  controlStyle: ControlStyle;
  padding: number;
  shadow: boolean;
  border: boolean;
  borderColor: string;
  borderWidth: number;
  header?: HeaderConfig;
  footer?: FooterConfig;
}

export interface Template {
  name: string;
  shell: ShellConfig;
}

export type PaddingInput = number | [number, number] | [number, number, number, number];

export interface ResolvedPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface FontConfig {
  family: string;
  size: number;
  lineHeight: number;
  charWidth: number;
  embedData?: string;
  embedFormat?: 'woff2' | 'woff' | 'ttf';
}

export interface shellfieOptions {
  template?: 'macos' | 'windows' | 'minimal' | Template;
  title?: string;
  theme?: Theme;
  fontSize?: number;
  lineHeight?: number;
  padding?: PaddingInput;
  width?: number; // If provided, sets exact SVG width (auto-size if omitted)
  height?: number; // If provided, sets exact SVG height (auto-size if omitted)
  watermark?: string;
  watermarkPadding?: PaddingInput;
  controls?: boolean;
  controlsPosition?: 'left' | 'right';
  fontFamily?: string;
  embedFont?: boolean;
  customFont?: {
    data: string;
    format: 'woff2' | 'woff' | 'ttf';
  };
  customGlyphs?: boolean;
  header?: HeaderConfig;
  footer?: FooterConfig;
}

export interface ResolvedHeaderConfig {
  backgroundColor: string;
  height: number;
  border: boolean;
  borderColor: string;
  borderWidth: number;
}

export interface ResolvedFooterConfig {
  backgroundColor: string;
  height: number;
  border: boolean;
  borderColor: string;
  borderWidth: number;
}

export interface RenderOptions {
  template: Template;
  title: string;
  theme: Theme;
  font: FontConfig;
  padding: ResolvedPadding;
  width: number | null; // null = auto-size, number = exact width
  height: number | null; // null = auto-size, number = exact height
  watermark: string | null;
  watermarkPadding: ResolvedPadding;
  header: ResolvedHeaderConfig | null;
  footer: ResolvedFooterConfig | null;
  controls: boolean;
  customGlyphs: boolean;
}
