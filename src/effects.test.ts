import { describe, it, expect } from 'vitest';
import { crt, grain, scanlines } from 'vctrfx';
import { shellfie } from '.';

const INPUT = '\x1b[32m❯\x1b[0m npm test';

describe('effects', () => {
  it('leaves the output untouched when none are asked for', () => {
    expect(shellfie(INPUT, { effects: undefined })).toBe(shellfie(INPUT));
    expect(shellfie(INPUT, { effects: [] })).toBe(shellfie(INPUT));
    expect(shellfie(INPUT, { effects: '' })).toBe(shellfie(INPUT));
  });

  it('accepts a preset name as a string', () => {
    const svg = shellfie(INPUT, { effects: 'crt' });
    expect(svg).toContain('filter');
    expect(svg.length).toBeGreaterThan(shellfie(INPUT).length);
  });

  it('reads the same stack from a string, specs and vctrfx effects', () => {
    const fromString = shellfie(INPUT, { effects: 'scanlines(gap:3) grain(amount:.4)' });
    const fromSpecs = shellfie(INPUT, { effects: [{ scanlines: { gap: 3 } }, { grain: { amount: 0.4 } }] });
    const fromEffects = shellfie(INPUT, { effects: [scanlines({ gap: 3 }), grain({ amount: 0.4 })] });
    expect(fromString).toBe(fromSpecs);
    expect(fromString).toBe(fromEffects);
  });

  it('applies effects in the order they are written', () => {
    expect(shellfie(INPUT, { effects: 'grain scanlines' }))
      .not.toBe(shellfie(INPUT, { effects: 'scanlines grain' }));
  });

  it('passes vctrfx settings through the config form', () => {
    const seeded = shellfie(INPUT, { effects: { use: 'grain', seed: 'one' } });
    expect(seeded).not.toBe(shellfie(INPUT, { effects: { use: 'grain', seed: 'two' } }));
    expect(seeded).toBe(shellfie(INPUT, { effects: { use: 'grain', seed: 'one' } }));
  });

  it('confines a terminal target to the window, leaving the background alone', () => {
    const options = { background: '#223344', effects: { use: 'crt', target: 'terminal' as const } };
    const svg = shellfie(INPUT, options);
    expect(svg).not.toContain('shellfie:window');
    expect(svg.match(/<svg/g)).toHaveLength(2);
    expect(svg.slice(0, svg.indexOf('<svg', 1))).toContain('fill="#223344"');
  });

  it('effects the whole document by default', () => {
    const svg = shellfie(INPUT, { background: '#223344', effects: 'crt' });
    expect(svg.match(/<svg/g)).toHaveLength(1);
  });

  it('reaches a preset’s inner effect through a dotted key', () => {
    expect(shellfie(INPUT, { effects: 'crt(scanlines.gap:9)' }))
      .not.toBe(shellfie(INPUT, { effects: 'crt' }));
  });

  it('accepts a preset built by hand', () => {
    expect(shellfie(INPUT, { effects: [crt()] })).toBe(shellfie(INPUT, { effects: 'crt' }));
  });

  it('rejects an unknown effect with a suggestion', () => {
    expect(() => shellfie(INPUT, { effects: 'scanline' })).toThrow(/Did you mean "scanlines"/);
  });

  it('survives every registered effect', () => {
    const names = ['blur', 'bloom', 'glow', 'shadow', 'grayscale', 'saturate', 'hueRotate', 'invert',
      'brightness', 'contrast', 'sepia', 'fade', 'posterize', 'threshold', 'duotone', 'tint', 'grain',
      'scanlines', 'chromaticAberration', 'glitch', 'pixelate', 'halftone', 'vignette', 'outline',
      'wave', 'emboss', 'sharpen', 'crt', 'vhs', 'riso', 'xerox', 'neon', 'film', 'newsprint', 'cyberpunk'];
    for (const name of names) {
      expect(() => shellfie(INPUT, { effects: name }), name).not.toThrow();
    }
  });
});
