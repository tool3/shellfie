/**
 * Minimal terminal template
 *
 * Features:
 * - No title bar
 * - No window controls
 * - Subtle rounded corners
 * - No shadow
 * - Clean, content-focused appearance
 */

import type { Template } from '../types';
import { createTemplate } from './base';

export const minimalTemplate: Template = createTemplate('minimal', {
  titleBar: false,
  titleBarHeight: 0,
  borderRadius: 6,
  windowControls: false,
  windowControlsPosition: 'left',
  padding: 16,
  shadow: false,
  border: false,
  borderColor: '#333333',
  borderWidth: 1,
});
