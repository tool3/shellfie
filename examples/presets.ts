/**
 * Generate SVGs for all presets
 *
 * Run: npx tsx examples/presets.ts
 */

import shellfie from '../src';
import { writeFileSync, mkdirSync } from 'node:fs';

const code = `import { useState, useEffect } from 'react';
import { createConnection } from './chat.js';

function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234');

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => {
      connection.disconnect();
    };
  }, [serverUrl, roomId]);
  // ...
}
`;

const presetNames = [
  'browserbase',
  'clerk',
  'cloudflare',
  'elevenlabs',
  'firecrawl',
  'gemini',
  'mintlify',
  'nuxt',
  'openai',
  'prisma',
  'resend',
  'supabase',
  'tailwind',
  'triggerdev',
  'vercel',
] as const;

mkdirSync('examples/svgs/presets', { recursive: true });

for (const name of presetNames) {
  const svg = shellfie(code, { preset: name, language: 'typescript' });
  writeFileSync(`examples/svgs/presets/${name}.svg`, svg);
  console.log(`${name}.svg`);
}

console.log('\nAll preset examples generated!');
