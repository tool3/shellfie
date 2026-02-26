/**
 * Header and Footer demo
 *
 * Demonstrates structural shell customization:
 * - header: styles the title bar (background color, border)
 * - footer: adds a mirrored bar at the bottom
 *
 * Run: npx tsx examples/header-footer.ts
 */

import { writeFileSync } from 'fs';
import shellfie from '../src';

const content = `\x1b[32m✓\x1b[0m All tests passed
\x1b[32m✓\x1b[0m Build successful
\x1b[32m✓\x1b[0m Deployment complete`;

// Custom header background with footer bar
const svg = shellfie(content, {
  template: 'macos',
  title: 'CI/CD Pipeline',
  header: {
    backgroundColor: '#2d2d2d',  // Darker header background
    height: 30,
    border: true,
  },
  footer: {
    backgroundColor: '#2d2d2d',  // Matching footer
    borderColor: 'white',
    height: 30,
    border: true,
  },
});

writeFileSync('examples/svgs/header-footer.svg', svg);
console.log('✓ Created examples/svgs/header-footer.svg');
