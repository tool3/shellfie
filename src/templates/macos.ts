/**
 * macOS-style terminal template
 *
 * Features:
 * - Traffic light buttons (close, minimize, maximize)
 * - Rounded corners
 * - Centered title
 * - Drop shadow
 */

import type { Template } from '../types';
import { createTemplate } from './base';

export const macosTemplate: Template = createTemplate('macos', {
  titleBar: true,
  titleBarHeight: 40,
  borderRadius: 10,
  windowControls: true,
  windowControlsPosition: 'left',
  windowControlStyle: {
    close: '#ff5f56',
    minimize: '#ffbd2e',
    maximize: '#27c93f',
    radius: 6,
    spacing: 20,
    size: 12,
  },
  padding: 16,
  shadow: true,
  border: false,
  borderColor: '#333333',
  borderWidth: 1,
});
