/**
 * Core types for shellfie
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
  /** Header/title bar background color (defaults to background) */
  headerBackground?: string;
  /** Footer background color (defaults to background) */
  footerBackground?: string;
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

/** Control button style */
export interface ControlStyle {
  close: string;
  minimize: string;
  maximize: string;
  radius: number;
  spacing: number;
  size: number;
}

/** Template shell configuration (window decoration settings) */
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
}

/** Template definition */
export interface Template {
  name: string;
  shell: ShellConfig;
}

/**
 * CSS-style padding shorthand
 * - Single number: all sides
 * - [vertical, horizontal]: top/bottom, left/right
 * - [top, right, bottom, left]: each side individually
 */
export type PaddingInput = number | [number, number] | [number, number, number, number];

/** Resolved padding values for all four sides */
export interface ResolvedPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
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

/** Header chrome configuration (title bar styling) */
export interface HeaderConfig {
  /** Background color for the title bar area (defaults to theme background) */
  backgroundColor?: string;
  /** Height of the header/title bar in pixels (defaults to template's titleBarHeight) */
  height?: number;
  /** Show border line below the title bar */
  border?: boolean;
  /** Border color (defaults to foreground with low opacity) */
  borderColor?: string;
  /** Border width in pixels */
  borderWidth?: number;
}

/** Footer chrome configuration (bottom bar styling) */
export interface FooterConfig {
  /** Background color for the footer area (defaults to theme background) */
  backgroundColor?: string;
  /** Height of the footer in pixels (defaults to same as title bar) */
  height?: number;
  /** Show border line above the footer */
  border?: boolean;
  /** Border color (defaults to foreground with low opacity) */
  borderColor?: string;
  /** Border width in pixels */
  borderWidth?: number;
}

/** Main options for shellfie */
export interface shellfieOptions {
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
  /**
   * Content padding in pixels. Supports CSS-style shorthand:
   * - Single number: all sides (e.g., 16)
   * - [vertical, horizontal]: top/bottom, left/right (e.g., [10, 20])
   * - [top, right, bottom, left]: each side (e.g., [10, 20, 30, 40])
   */
  padding?: PaddingInput;
  /** Terminal width in columns (auto-detect if not specified) */
  width?: number;
  /** Watermark text (supports ANSI escape codes for styling) */
  watermark?: string;
  /**
   * Padding from edge for watermark in pixels. Supports CSS-style shorthand:
   * - Single number: all sides
   * - [vertical, horizontal]: top/bottom, left/right
   * - [top, right, bottom, left]: each side
   * Defaults to content padding if not specified.
   */
  watermarkPadding?: PaddingInput;
  /** Show control buttons */
  controls?: boolean;
  /** Font family */
  fontFamily?: string;
  /** Embed font in SVG for portability */
  embedFont?: boolean;
  /** Custom font data for embedding */
  customFont?: {
    data: string;
    format: 'woff2' | 'woff' | 'ttf';
  };
  /**
   * Whether to draw custom glyphs for box drawing, block elements, and other
   * terminal graphics characters instead of using the font.
   *
   * This results in pixel-perfect rendering with continuous lines, similar to
   * how terminals like VSCode render these characters. Enabled by default.
   *
   * Supported Unicode ranges:
   * - Box Drawing (U+2500-U+257F)
   * - Block Elements (U+2580-U+259F)
   * - Braille Patterns (U+2800-U+28FF)
   * - Symbols for Legacy Computing (U+1FB00-U+1FBFF)
   *
   * @default true
   */
  customGlyphs?: boolean;
  /**
   * Header (title bar) styling configuration.
   * Customize the background color and border of the title bar area.
   */
  header?: HeaderConfig;
  /**
   * Footer styling configuration.
   * Adds a footer bar at the bottom, mirroring the title bar style.
   */
  footer?: FooterConfig;
}

/** Resolved header configuration for rendering */
export interface ResolvedHeaderConfig {
  backgroundColor: string;
  height: number;
  border: boolean;
  borderColor: string;
  borderWidth: number;
}

/** Resolved footer configuration for rendering */
export interface ResolvedFooterConfig {
  backgroundColor: string;
  height: number;
  border: boolean;
  borderColor: string;
  borderWidth: number;
}

/** Internal render options (resolved from shellfieOptions) */
export interface RenderOptions {
  template: Template;
  title: string;
  theme: Theme;
  font: FontConfig;
  padding: ResolvedPadding;
  width: number | null;
  watermark: string | null;
  watermarkPadding: ResolvedPadding;
  header: ResolvedHeaderConfig | null;
  footer: ResolvedFooterConfig | null;
  controls: boolean;
  /** Whether to render custom glyphs for box drawing and block elements */
  customGlyphs: boolean;
}
