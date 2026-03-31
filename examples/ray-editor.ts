/**
 * Ray.so-style editor example
 *
 * Features demonstrated:
 * - Line numbers
 * - Language badge (auto-detected)
 * - Title alignment (left)
 * - Title style (tab-underline)
 * - Background with dots pattern
 *
 * Run: npx tsx examples/ray-editor.ts
 */

import shellfie, { themes } from '../src';
import { writeFileSync } from 'node:fs';

const code = `interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

async function getUser(id: string): Promise<User> {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new Error('User not found');
  return res.json();
}

const user = await getUser('123');
console.log(user.name);`;

const svg = shellfie(code, {
  template: 'macos',
  theme: themes.tokyoNight,
  controls: false,
  title: 'user-service.ts',
  titleAlignment: 'left',
  titleStyle: 'tab-underline',
  language: 'typescript',
  lineNumbers: true,
  badge: true,
  background: {
    color: 'gradient(#1a1b2e, #2d1b69:diagonal)',
    padding: 40,
    pattern: 'dots',
  },
});

writeFileSync('examples/svgs/ray-editor.svg', svg);
console.log('✓ Created examples/svgs/ray-editor.svg');
