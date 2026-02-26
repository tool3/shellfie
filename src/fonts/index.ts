import type { FontConfig } from '../types';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

export const defaultFontFamily =
  "'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'Courier New', monospace";

export const systemFontPaths: Record<string, string[]> = {
  darwin: [
    '/System/Library/Fonts/SFMono.ttf',
    '/System/Library/Fonts/Monaco.dfont',
    '/System/Library/Fonts/Menlo.ttc',
  ],
  linux: [
    '/usr/share/fonts/truetype/ubuntu/UbuntuMono-R.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
    '/usr/share/fonts/TTF/DejaVuSansMono.ttf',
  ],
  win32: [
    'C:\\Windows\\Fonts\\consola.ttf',
    'C:\\Windows\\Fonts\\cour.ttf',
  ],
};

export function getFontFormat(path: string): 'woff2' | 'woff' | 'ttf' | null {
  const ext = path.toLowerCase().split('.').pop();
  switch (ext) {
    case 'woff2':
      return 'woff2';
    case 'woff':
      return 'woff';
    case 'ttf':
    case 'otf':
      return 'ttf';
    default:
      return null;
  }
}

export async function loadFont(
  path: string
): Promise<{ data: string; format: 'woff2' | 'woff' | 'ttf' } | null> {
  try {
    if (!existsSync(path)) {
      return null;
    }

    const format = getFontFormat(path);
    if (!format) {
      return null;
    }

    const buffer = await readFile(path);
    const data = buffer.toString('base64');

    return { data, format };
  } catch {
    return null;
  }
}

export function createFontConfig(options: {
  family?: string;
  size?: number;
  lineHeight?: number;
  embedData?: string;
  embedFormat?: 'woff2' | 'woff' | 'ttf';
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

export function findSystemFont(): string | null {
  const platform = process.platform;
  const paths = systemFontPaths[platform] ?? [];

  for (const path of paths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

export async function loadEmbeddedFont(
  customPath?: string
): Promise<{ data: string; format: 'woff2' | 'woff' | 'ttf' } | null> {
  if (customPath) {
    const result = await loadFont(customPath);
    if (result) {
      return result;
    }
  }

  const systemPath = findSystemFont();
  if (systemPath) {
    return loadFont(systemPath);
  }

  return null;
}
