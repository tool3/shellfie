/**
 * Template exports
 */

import type { Template } from '../types.js';
import { macosTemplate } from './macos.js';
import { windowsTemplate } from './windows.js';
import { minimalTemplate } from './minimal.js';

export { macosTemplate } from './macos.js';
export { windowsTemplate } from './windows.js';
export { minimalTemplate } from './minimal.js';
export { createTemplate, defaultChrome, defaultWindowControlStyle } from './base.js';

/**
 * Available templates
 */
export const templates = {
  macos: macosTemplate,
  windows: windowsTemplate,
  minimal: minimalTemplate,
} as const;

/**
 * Template name type
 */
export type TemplateName = keyof typeof templates;

/**
 * Resolve a template from name or object
 */
export function resolveTemplate(
  template: TemplateName | Template | undefined
): Template {
  if (template === undefined) {
    return macosTemplate;
  }

  if (typeof template === 'string') {
    const resolved = templates[template];
    if (!resolved) {
      throw new Error(`Unknown template: ${template}`);
    }
    return resolved;
  }

  return template;
}
