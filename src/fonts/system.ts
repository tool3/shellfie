import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { getFontFormat, systemFontPaths, type LoadedFont } from './formats';

export async function loadFont(path: string): Promise<LoadedFont | null> {
  try {
    const format = existsSync(path) ? getFontFormat(path) : null;

    return format ? { data: (await readFile(path)).toString('base64'), format } : null;
  } catch {
    return null;
  }
}

export function findSystemFont(): string | null {
  return (systemFontPaths[process.platform] ?? []).find(existsSync) ?? null;
}
