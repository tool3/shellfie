/**
 * Template exports
 */

import type { Template } from '../types';
import { macosTemplate } from './macos';
import { windowsTemplate } from './windows';
import { minimalTemplate } from './minimal';

export { macosTemplate } from './macos';
export { windowsTemplate } from './windows';
export { minimalTemplate } from './minimal';
export { createTemplate, defaultChrome, defaultWindowControlStyle } from './base';

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
