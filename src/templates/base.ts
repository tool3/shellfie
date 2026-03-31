import type { Template, ShellConfig, ControlStyle } from '../types';

export const defaultControlStyle: ControlStyle = {
  close: '#ff5f56',
  minimize: '#ffbd2e',
  maximize: '#27c93f',
  radius: 6,
  spacing: 20,
  size: 12,
};

export const defaultShell: ShellConfig = {
  titleBar: true,
  titleBarHeight: 40,
  borderRadius: 8,
  controls: true,
  controlsPosition: 'left',
  controlStyle: defaultControlStyle,
  padding: 16,
  shadow: false,
  border: false,
  borderColor: '#333333',
  borderWidth: 1,
};

/**
 * Parse CSS border shorthand: '1px solid red' -> { border: true, borderWidth, borderColor }
 */
const parseBorder = (border: string | boolean): { border: boolean; borderWidth?: number; borderColor?: string } => {
  if (typeof border === 'boolean') return { border };
  const parts = border.trim().split(/\s+/);
  let width = 1;
  let color = border.trim();
  if (parts.length >= 3) {
    width = parseFloat(parts[0]) || 1;
    color = parts.slice(2).join(' ');
  } else if (parts.length === 2) {
    const maybeWidth = parseFloat(parts[0]);
    if (!isNaN(maybeWidth)) { width = maybeWidth; color = parts[1]; }
    else color = parts[1];
  }
  return { border: true, borderWidth: width, borderColor: color };
};

export const createTemplate = (name: string, overrides: Partial<ShellConfig> = {}): Template => {
  const borderOverrides = overrides.border != null ? parseBorder(overrides.border) : {};

  // Also parse header/footer border shorthands
  let header = overrides.header;
  if (header?.border != null && typeof header.border === 'string') {
    const parsed = parseBorder(header.border);
    header = { ...header, ...parsed };
  }

  let footer = overrides.footer;
  if (footer?.border != null && typeof footer.border === 'string') {
    const parsed = parseBorder(footer.border);
    footer = { ...footer, ...parsed };
  }

  return {
    name,
    shell: {
      ...defaultShell,
      ...overrides,
      ...borderOverrides,
      controlStyle: {
        ...defaultControlStyle,
        ...(overrides.controlStyle ?? {}),
      },
      ...(header ? { header } : {}),
      ...(footer ? { footer } : {}),
    },
  };
};
