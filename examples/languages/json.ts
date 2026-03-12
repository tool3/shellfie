import shellfie, { themes } from '../../src';
import { writeFileSync } from 'node:fs';

const code = `{
  "name": "shellfie",
  "version": "2.0.0",
  "description": "Terminal screenshots as SVG",
  "keywords": ["terminal", "svg", "screenshot"],
  "author": {
    "name": "tool3",
    "email": "user@example.com"
  },
  "dependencies": {
    "typescript": "^5.0.0"
  },
  "config": {
    "port": 3000,
    "debug": true,
    "features": ["highlighting", "themes"]
  }
}
`;

const svg = shellfie(code, { theme: themes.githubDark });
writeFileSync('examples/svgs/languages/json.svg', svg);
console.log('Created examples/svgs/languages/json.svg');
