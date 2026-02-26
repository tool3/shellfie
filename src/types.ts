/**
 * Core types for snaptty
 */

/** RGB color representation */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Text style attributes */
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

/** A span of text with consistent styling */
export interface TextSpan {
  text: string;
  style: TextStyle;
}

/** A parsed line containing multiple styled spans */
export interface ParsedLine {
  spans: TextSpan[];
}

/** Color theme definition */
export interface Theme {
  name: string;
  background: string;
  foreground: string;
  cursor: string;
  selection: string;
  /** Standard ANSI colors (0-7) */
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  /** Bright ANSI colors (8-15) */
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

/** Window control button style */
export interface WindowControlStyle {
  close: string;
  minimize: string;
  maximize: string;
  radius: number;
  spacing: number;
  size: number;
}

/** Template chrome configuration */
export interface ChromeConfig {
  titleBar: boolean;
  titleBarHeight: number;
  borderRadius: number;
  windowControls: boolean;
  windowControlsPosition: 'left' | 'right';
  windowControlStyle: WindowControlStyle;
  padding: number;
  shadow: boolean;
  border: boolean;
  borderColor: string;
  borderWidth: number;
}

/** Template definition */
export interface Template {
  name: string;
  chrome: ChromeConfig;
}

/** Font configuration */
export interface FontConfig {
  family: string;
  size: number;
  lineHeight: number;
  /** Character width in em units (monospace assumed) */
  charWidth: number;
  /** Optional base64-encoded font data for embedding */
  embedData?: string;
  embedFormat?: 'woff2' | 'woff' | 'ttf';
}

/** Main options for snaptty */
export interface SnapttyOptions {
  /** Template name or custom template object */
  template?: 'macos' | 'windows' | 'minimal' | Template;
  /** Window title */
  title?: string;
  /** Color theme */
  theme?: Theme;
  /** Font size in pixels */
  fontSize?: number;
  /** Line height multiplier */
  lineHeight?: number;
  /** Content padding in pixels */
  padding?: number;
  /** Terminal width in columns (auto-detect if not specified) */
  width?: number;
  /** Watermark text */
  watermark?: string;
  /** Show window control buttons */
  windowControls?: boolean;
  /** Font family */
  fontFamily?: string;
  /** Embed font in SVG for portability */
  embedFont?: boolean;
  /** Custom font data for embedding */
  customFont?: {
    data: string;
    format: 'woff2' | 'woff' | 'ttf';
  };
}

/** Internal render options (resolved from SnapttyOptions) */
export interface RenderOptions {
  template: Template;
  title: string;
  theme: Theme;
  font: FontConfig;
  padding: number;
  width: number | null;
  watermark: string | null;
  windowControls: boolean;
}
