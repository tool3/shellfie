/**
 * Windows-style terminal template
 *
 * Features:
 * - Square window control buttons on the right
 * - Sharp corners
 * - Left-aligned title
 * - Border instead of shadow
 */

import type { Template } from '../types';
import { createTemplate } from './base';

export const windowsTemplate: Template = createTemplate('windows', {
  titleBar: true,
  titleBarHeight: 40,
  borderRadius: 0,
  controls: true,
  controlsPosition: 'right',
  controlStyle: {
    close: '#e81123',
    minimize: '#333333',
    maximize: '#333333',
    radius: 0,
    spacing: 46,
    size: 10,
  },
  padding: 12,
  shadow: false,
  border: false,
});
