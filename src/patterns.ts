import type { PatternConfig, PatternType, ResolvedPattern } from './types';

const DEFAULT_PATTERN_COLOR = '#ffffff0d'; // white at ~5% opacity

const PATTERN_DEFAULTS: Record<PatternType, { size: number; strokeWidth: number }> = {
  'grid': { size: 20, strokeWidth: 1 },
  'dots': { size: 20, strokeWidth: 0 },
  'stripes': { size: 10, strokeWidth: 0 },
  'diagonal-stripes': { size: 10, strokeWidth: 0 },
  'crosshatch': { size: 16, strokeWidth: 1 },
};

export function resolvePattern(
  pattern: PatternType | PatternConfig | undefined
): ResolvedPattern | null {
  if (!pattern) return null;

  const type = typeof pattern === 'string' ? pattern : pattern.type;
  const defaults = PATTERN_DEFAULTS[type];

  if (typeof pattern === 'string') {
    return {
      type,
      color: DEFAULT_PATTERN_COLOR,
      size: defaults.size,
      strokeWidth: defaults.strokeWidth,
    };
  }

  return {
    type,
    color: pattern.color ?? DEFAULT_PATTERN_COLOR,
    size: pattern.size ?? defaults.size,
    strokeWidth: pattern.strokeWidth ?? defaults.strokeWidth,
  };
}

export function createPatternDef(pattern: ResolvedPattern, id: string): string {
  const { type, color, size, strokeWidth } = pattern;

  switch (type) {
    case 'grid':
      return `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
      <line x1="0" y1="${size}" x2="${size}" y2="${size}" stroke="${color}" stroke-width="${strokeWidth}"/>
      <line x1="${size}" y1="0" x2="${size}" y2="${size}" stroke="${color}" stroke-width="${strokeWidth}"/>
    </pattern>`;

    case 'dots': {
      const radius = Math.max(1, size / 10);
      return `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="${color}"/>
    </pattern>`;
    }

    case 'stripes':
      return `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
      <rect width="${size / 2}" height="${size}" fill="${color}"/>
    </pattern>`;

    case 'diagonal-stripes': {
      const sw = strokeWidth || Math.max(1, size / 4);
      return `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="${sw}" height="${size}" fill="${color}"/>
    </pattern>`;
    }

    case 'crosshatch': {
      const sw = strokeWidth || 1;
      return `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="${size}" y2="${size}" stroke="${color}" stroke-width="${sw}"/>
      <line x1="${size}" y1="0" x2="0" y2="${size}" stroke="${color}" stroke-width="${sw}"/>
    </pattern>`;
    }
  }
}
