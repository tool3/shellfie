/**
 * Editor terminal template
 *
 * Features:
 * - Header with tabs
 * - No window controls
 * - Subtle rounded corners
 * - No shadow
 * - Clean, content-focused appearance
 */

import type { Template } from '../types';
import { createTemplate } from './base';

export const minimalTemplate: Template = createTemplate('editor', {
  titleBar: true,
  titleBarHeight: 20,
  borderRadius: 6,
  controls: false,
  controlsPosition: 'left',
  header: {
    border: true,
    borderColor: '#333333',
    borderWidth: 1,
  },
  padding: 16,
  shadow: false,
  border: false,
  borderColor: '#333333',
  borderWidth: 1,
});
