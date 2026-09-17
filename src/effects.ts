import { applyEffects } from 'vctrfx';
import type { EffectsInput, EffectsList, VctrfxSettings } from 'vctrfx';

export type EffectTarget = 'all' | 'terminal';

export interface EffectsConfig extends VctrfxSettings {
  /** The effect stack, in the order it should be applied. */
  use: EffectsList;
  /**
   * `'all'` post-processes the finished SVG, outer background included.
   * `'terminal'` confines the effects to the window itself, leaving the
   * background, padding, shadow and glow untouched.
   */
  target?: EffectTarget;
}

export type EffectsOption = EffectsList | EffectsConfig;

const isConfig = (value: EffectsOption): value is EffectsConfig =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && 'use' in value;

export const effectsTarget = (value: EffectsOption | null | undefined): EffectTarget =>
  value != null && isConfig(value) ? value.target ?? 'all' : 'all';

const toInput = (value: EffectsOption): EffectsInput => {
  if (!isConfig(value)) return value as EffectsInput;
  const { target, ...input } = value;
  return input as EffectsInput;
};

export const WINDOW_START = '<!--shellfie:window-->';
export const WINDOW_END = '<!--/shellfie:window-->';

export interface WindowFrame {
  width: number;
  height: number;
  defs: string;
}

export const applyToDocument = (
  svg: string,
  effects: EffectsOption | null | undefined,
  settings: VctrfxSettings = {}
): string => (effects == null ? svg : applyEffects(svg, toInput(effects), settings));

/**
 * Post-process only the window block the renderer marked out, splicing the
 * result back in as a nested `<svg>` so it stays inside the window's bounds.
 */
export const applyToWindow = (
  svg: string,
  effects: EffectsOption | null | undefined,
  frame: WindowFrame,
  settings: VctrfxSettings = {}
): string => {
  const start = svg.indexOf(WINDOW_START);
  const end = svg.indexOf(WINDOW_END);
  if (effects == null || start === -1 || end === -1) {
    return svg.replace(WINDOW_START, '').replace(WINDOW_END, '');
  }

  const body = svg.slice(start + WINDOW_START.length, end);
  const document =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${frame.width} ${frame.height}"` +
    ` width="${frame.width}" height="${frame.height}">${frame.defs}${body}</svg>`;

  return (
    svg.slice(0, start) +
    applyToDocument(document, effects, settings) +
    svg.slice(end + WINDOW_END.length)
  );
};

export { applyEffects, resolveEffects, effectNames, REGISTERED_NAMES as effectsRegistry } from 'vctrfx';
export type { Effect, EffectsInput, EffectsList, EffectSpec, VctrfxSettings } from 'vctrfx';
