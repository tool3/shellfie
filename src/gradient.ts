import { gradient as grfti } from 'grfti';
import type { Gradient } from './types';

export interface GradientDefOptions {
  direction?: Gradient['direction'];
  padStart?: number;
  padEnd?: number;
  total?: number;
}

const GRADIENT_CALL = /^\s*gradient\s*\(/i;

// grfti always reports a direction, but consumers pick their own default for an
// unspecified one (shellfie horizontal, dvd vertical), so only carry it when written.
const DIRECTION_FLAG = /:\s*(horizontal|vertical|diagonal|diag|row|column|[hvd])\s*(?=[:)]|\s*$)/i;

const DIRECTIONS: Record<string, NonNullable<Gradient['direction']>> = {
  horizontal: 'horizontal', h: 'horizontal', row: 'horizontal',
  vertical: 'vertical', v: 'vertical', column: 'vertical',
  diagonal: 'diagonal', diag: 'diagonal', d: 'diagonal',
};

const COORDS: Record<NonNullable<Gradient['direction']>, { x1: string; y1: string; x2: string; y2: string }> = {
  horizontal: { x1: '0%', y1: '0%', x2: '100%', y2: '0%' },
  vertical: { x1: '0%', y1: '0%', x2: '0%', y2: '100%' },
  diagonal: { x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
};

const writtenDirection = (value: string): Gradient['direction'] => {
  const match = value.match(DIRECTION_FLAG);
  return match ? DIRECTIONS[match[1].toLowerCase()] : undefined;
};

export function parseGradient(value: string): Gradient | string {
  if (!GRADIENT_CALL.test(value)) return value;

  try {
    const parsed = grfti(value);
    const direction = writtenDirection(value);
    const positions = parsed.stops.map((stop) => stop.position);
    const even = positions.every(
      (position, index) =>
        Math.abs(position - (positions.length === 1 ? 0 : index / (positions.length - 1))) < 1e-9
    );

    return {
      type: 'gradient',
      colors: parsed.colors.map((color) => color.hex),
      ...(even ? {} : { positions }),
      ...(direction ? { direction } : {}),
    };
  } catch {
    return value;
  }
}

export function isGradient(value: unknown): value is Gradient {
  return typeof value === 'object' && value !== null && (value as Gradient).type === 'gradient';
}

export function createGradientDef(gradient: Gradient, id: string, options: GradientDefOptions = {}): string {
  const direction = gradient.direction ?? options.direction ?? 'horizontal';
  const { x1, y1, x2, y2 } = COORDS[direction];

  const colors = gradient.reverse ? [...gradient.colors].reverse() : gradient.colors;
  const written = gradient.positions;
  const positions = written === undefined || written.length !== colors.length
    ? undefined
    : gradient.reverse
      ? [...written].reverse().map((position) => 1 - position)
      : written;

  const total = options.total ?? 0;
  const start = total > 0 ? ((options.padStart ?? 0) / total) * 100 : 0;
  const end = total > 0 ? 100 - ((options.padEnd ?? 0) / total) * 100 : 100;

  const stops = colors
    .map((color, index) => {
      const base = positions !== undefined
        ? (positions[index] ?? 0) * 100
        : colors.length === 1
          ? 50
          : (index / (colors.length - 1)) * 100;
      const offset = start + (base / 100) * (end - start);
      return `<stop offset="${Number(offset.toFixed(2))}%" stop-color="${color}"/>`;
    })
    .join('');

  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`;
}
