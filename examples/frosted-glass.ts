/**
 * Frosted glass effect example
 *
 * Features demonstrated:
 * - Background opacity (frosted glass effect)
 * - Gradient border
 * - Glow effect (subtle)
 * - Diagonal stripes pattern
 * - Language badge (auto-detected)
 * - Line numbers
 * - Title alignment (right)
 * - Decorative overlays (gradient circles)
 *
 * Run: npx tsx examples/frosted-glass.ts
 */

import shellfie, { themes } from '../src';
import { writeFileSync } from 'node:fs';

const code = `from dataclasses import dataclass
from typing import Optional

@dataclass
class Config:
    host: str = "localhost"
    port: int = 8080
    debug: bool = False
    workers: Optional[int] = None

    def url(self) -> str:
        return f"http://{self.host}:{self.port}"

config = Config(host="0.0.0.0", debug=True)
print(f"Server: {config.url()}")`;

// Decorative gradient circles
const decorativeOverlays = [
  '<circle cx="90%" cy="20%" r="120" fill="url(#bg-gradient)" opacity="0.15"/>',
  '<circle cx="10%" cy="80%" r="80" fill="url(#bg-gradient)" opacity="0.1"/>',
];

const svg = shellfie(code, {
  template: 'macos',
  theme: themes.catppuccinMocha,
  title: 'config.py',
  titleAlignment: 'right',
  language: 'python',
  lineNumbers: true,
  badge: true,
  backgroundOpacity: 0.9,
  borderColor: 'gradient(#cba6f7, #f38ba8, #fab387:horizontal)',
  glow: {
    color: '#cba6f7',
    strength: 6,
    opacity: 0.3,
  },
  background: {
    color: 'gradient(#1e1e2e, #313244, #1e1e2e:diagonal)',
    padding: 45,
    pattern: 'diagonal-stripes',
  },
  overlays: decorativeOverlays,
});

writeFileSync('examples/svgs/frosted-glass.svg', svg);
console.log('✓ Created examples/svgs/frosted-glass.svg');
