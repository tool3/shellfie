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
  shadow: true,
  border: false,
  borderColor: '#333333',
  borderWidth: 1,
};

export const createTemplate = (name: string, overrides: Partial<ShellConfig> = {}): Template => ({
  name,
  shell: {
    ...defaultShell,
    ...overrides,
    controlStyle: {
      ...defaultControlStyle,
      ...(overrides.controlStyle ?? {}),
    },
  },
});
