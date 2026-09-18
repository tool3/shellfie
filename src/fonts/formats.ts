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
  win32: ['C:\\Windows\\Fonts\\consola.ttf', 'C:\\Windows\\Fonts\\cour.ttf'],
};

export type FontFormat = 'woff2' | 'woff' | 'ttf';

export type LoadedFont = { data: string; format: FontFormat };

export function getFontFormat(path: string): FontFormat | null {
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
