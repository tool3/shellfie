import type { Preset } from '../types';

export { browserbase } from './browserbase';
export { clerk } from './clerk';
export { cloudflare } from './cloudflare';
export { elevenlabs } from './elevenlabs';
export { firecrawl } from './firecrawl';
export { gemini } from './gemini';
export { mintlify } from './mintlify';
export { nuxt } from './nuxt';
export { openai } from './openai';
export { prisma } from './prisma';
export { resend } from './resend';
export { supabase } from './supabase';
export { tailwind } from './tailwind';
export { triggerdev } from './triggerdev';
export { vercel } from './vercel';

import { browserbase } from './browserbase';
import { clerk } from './clerk';
import { cloudflare } from './cloudflare';
import { elevenlabs } from './elevenlabs';
import { firecrawl } from './firecrawl';
import { gemini } from './gemini';
import { mintlify } from './mintlify';
import { nuxt } from './nuxt';
import { openai } from './openai';
import { prisma } from './prisma';
import { resend } from './resend';
import { supabase } from './supabase';
import { tailwind } from './tailwind';
import { triggerdev } from './triggerdev';
import { vercel } from './vercel';

export const presets = {
  browserbase,
  clerk,
  cloudflare,
  elevenlabs,
  firecrawl,
  gemini,
  mintlify,
  nuxt,
  openai,
  prisma,
  resend,
  supabase,
  tailwind,
  triggerdev,
  vercel,
} as const;

export type PresetName = keyof typeof presets;

export const resolvePreset = (preset: PresetName | Preset | undefined): Preset | undefined => {
  if (!preset) return undefined;
  if (typeof preset === 'string') {
    const resolved = presets[preset];
    if (!resolved) throw new Error(`Unknown preset: ${preset}`);
    return resolved;
  }
  return preset;
};
