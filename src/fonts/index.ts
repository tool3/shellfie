import type { FontConfig } from '../types';
import { defaultFontFamily, type FontFormat, type LoadedFont } from './formats';
import { findSystemFont, loadFont } from './system';

export { defaultFontFamily, systemFontPaths, getFontFormat } from './formats';
export type { FontFormat, LoadedFont } from './formats';
export { loadFont, findSystemFont } from './system';

export function createFontConfig(options: {
  family?: string;
  size?: number;
  lineHeight?: number;
  embedData?: string;
  embedFormat?: FontFormat;
}): FontConfig {
  return {
    family: options.family ?? defaultFontFamily,
    size: options.size ?? 14,
    lineHeight: options.lineHeight ?? 1.4,
    charWidth: 0.6,
    embedData: options.embedData,
    embedFormat: options.embedFormat,
  };
}

export async function loadEmbeddedFont(customPath?: string): Promise<LoadedFont | null> {
  const custom = customPath ? await loadFont(customPath) : null;

  if (custom) return custom;

  const systemPath = findSystemFont();

  return systemPath ? loadFont(systemPath) : null;
}
