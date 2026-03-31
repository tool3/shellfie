/**
 * Neon glow terminal example
 *
 * Features demonstrated:
 * - Gradient border (cyan to magenta)
 * - Neon glow effect
 * - Background opacity (frosted glass)
 * - Background with crosshatch pattern
 * - Title alignment (center)
 *
 * Run: npx tsx examples/neon-glow.ts
 */

import shellfie, { themes } from '../src';
import { writeFileSync } from 'node:fs';

const terminalOutput = `\x1b[1;36m❯\x1b[0m neofetch
\x1b[1;35m       _,met\$\$\$\$\$gg.\x1b[0m          \x1b[1;36muser\x1b[0m@\x1b[1;36mworkstation\x1b[0m
\x1b[1;35m    ,g\$\$\$\$\$\$\$\$\$\$\$\$\$\$P.\x1b[0m        \x1b[1;33mOS:\x1b[0m Debian 12
\x1b[1;35m  ,g\$\$P"     """Y\$\$.".\x1b[0m       \x1b[1;33mKernel:\x1b[0m 6.1.0-amd64
\x1b[1;35m ,\$\$P'              \`\$\$\$.\x1b[0m     \x1b[1;33mUptime:\x1b[0m 42 days
\x1b[1;35m',\$\$P       ,ggs.     \`\$\$b:\x1b[0m   \x1b[1;33mShell:\x1b[0m zsh 5.9
\x1b[1;35m d\$\$'     ,\$P"'   .    \$\$\$\x1b[0m    \x1b[1;33mMemory:\x1b[0m 4.2G / 16G
\x1b[1;35m \$\$P      d\$'     ,    \$\$P\x1b[0m    \x1b[1;33mCPU:\x1b[0m AMD Ryzen 9 5900X
\x1b[1;35m \$\$:      \$\$.   -    ,d\$\$'\x1b[0m    \x1b[1;33mGPU:\x1b[0m NVIDIA RTX 3080
\x1b[1;35m \$\$;      Y\$b._   _,d\$P'\x1b[0m     \x1b[1;33mDisk:\x1b[0m 120G / 500G (24%)
\x1b[1;35m Y\$\$.    \`.\`"Y\$\$\$\$P"'\x1b[0m
\x1b[1;35m \`\$\$b      "-.__\x1b[0m
\x1b[1;35m  \`Y\$\$\x1b[0m
\x1b[1;35m   \`Y\$\$.\x1b[0m
\x1b[1;35m     \`\$\$b.\x1b[0m
\x1b[1;35m       \`Y\$\$b.\x1b[0m
\x1b[1;35m          \`"Y\$b._\x1b[0m`;

const svg = shellfie(terminalOutput, {
  template: 'macos',
  theme: themes.synthwave84,
  title: 'System Info',
  borderColor: 'gradient(#00ffff, #ff00ff:horizontal)',
  glow: {
    color: '#00ffff',
    strength: 12,
    opacity: 0.5,
  },
  backgroundOpacity: 0.85,
  background: {
    color: 'gradient(#0a0a1a, #1a0a2e, #0a1a2e:diagonal)',
    padding: 50,
    pattern: {
      type: 'crosshatch',
      color: '#ffffff08',
      size: 24,
    },
  },
});

writeFileSync('examples/svgs/neon-glow.svg', svg);
console.log('✓ Created examples/svgs/neon-glow.svg');
