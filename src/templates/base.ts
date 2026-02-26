/**
 * Base template configuration
 */

import type { Template, ChromeConfig, WindowControlStyle } from '../types';

/**
 * Default window control style (macOS-like)
 */
export const defaultWindowControlStyle: WindowControlStyle = {
  close: '#ff5f56',
  minimize: '#ffbd2e',
  maximize: '#27c93f',
  radius: 6,
  spacing: 20,
  size: 12,
};

/**
 * Default chrome configuration
 */
export const defaultChrome: ChromeConfig = {
  titleBar: true,
  titleBarHeight: 40,
  borderRadius: 8,
  windowControls: true,
  windowControlsPosition: 'left',
  windowControlStyle: defaultWindowControlStyle,
  padding: 16,
  shadow: true,
  border: false,
  borderColor: '#333333',
  borderWidth: 1,
};

/**
 * Create a template by merging with default configuration
 */
export function createTemplate(
  name: string,
  overrides: Partial<ChromeConfig> = {}
): Template {
  return {
    name,
    chrome: {
      ...defaultChrome,
      ...overrides,
      windowControlStyle: {
        ...defaultWindowControlStyle,
        ...(overrides.windowControlStyle ?? {}),
      },
    },
  };
}
