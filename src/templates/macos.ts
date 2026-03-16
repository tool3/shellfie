/**
 * macOS-style terminal template
 *
 * Features:
 * - Traffic light buttons (close, minimize, maximize)
 * - Rounded corners
 * - Centered title
 */

import type { Template } from '../types';
import { createTemplate } from './base';

export const macosTemplate: Template = createTemplate('macos', {
  titleBar: true,
  titleBarHeight: 40,
  borderRadius: 10,
  controls: true,
  controlsPosition: 'left',
  controlStyle: {
    close: '#ff5f56',
    minimize: '#ffbd2e',
    maximize: '#27c93f',
    radius: 6,
    spacing: 20,
    size: 12,
  },
  padding: 16,
  shadow: false,
  border: false,
  borderWidth: 0,
  header: {
    border: false,
  },
});
