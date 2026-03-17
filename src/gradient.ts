import type { Gradient } from './types';

export function parseGradient(value: string): Gradient | string {
  if (!value.startsWith('gradient(')) {
    return value;
  }

  const match = value.match(/^gradient\(([^)]+)\)$/);
  if (!match) {
    return value;
  }

  const content = match[1];
  const parts = content.split(':');
  const colorsPart = parts[0];
  const options = parts.slice(1);

  const colors = colorsPart.split(',').map(c => c.trim()).filter(c => c.length > 0);

  if (colors.length === 0) {
    return value;
  }

  const gradient: Gradient = {
    type: 'gradient',
    colors
  };

  for (const opt of options) {
    const trimmed = opt.trim().toLowerCase();
    if (trimmed === 'horizontal' || trimmed === 'vertical' || trimmed === 'diagonal') {
      gradient.direction = trimmed;
    } else if (trimmed === 'reverse' || trimmed === 'reversed') {
      gradient.reverse = true;
    }
  }

  return gradient;
}

/**
 * Check if a value is a Gradient object.
 */
export function isGradient(value: unknown): value is Gradient {
  return typeof value === 'object' && value !== null && (value as Gradient).type === 'gradient';
}

/**
 * Generate SVG gradient definition element.
 * Returns the <linearGradient> element for inclusion in <defs>.
 */
export function createGradientDef(
  gradient: Gradient,
  id: string,
  width: number,
  height: number
): string {
  const colors = gradient.reverse ? [...gradient.colors].reverse() : gradient.colors;
  const direction = gradient.direction ?? 'horizontal';

  // Calculate gradient coordinates based on direction
  let x1: string, y1: string, x2: string, y2: string;

  switch (direction) {
    case 'vertical':
      x1 = '0%'; y1 = '0%'; x2 = '0%'; y2 = '100%';
      break;
    case 'diagonal':
      x1 = '0%'; y1 = '0%'; x2 = '100%'; y2 = '100%';
      break;
    case 'horizontal':
    default:
      x1 = '0%'; y1 = '0%'; x2 = '100%'; y2 = '0%';
      break;
  }

  // Generate stop elements with even distribution
  const stops = colors.map((color, index) => {
    const offset = colors.length === 1 ? 0 : (index / (colors.length - 1)) * 100;
    return `<stop offset="${offset}%" stop-color="${color}"/>`;
  }).join('\n      ');

  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
      ${stops}
    </linearGradient>`;
}
