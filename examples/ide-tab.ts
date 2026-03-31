/**
 * IDE tab-style example
 *
 * Features demonstrated:
 * - Title style (tab-box) — IDE-like tab appearance
 * - Title alignment (left)
 * - Line numbers with custom start
 * - Language badge with explicit label
 * - Decorative overlays (corner decoration)
 * - Background with grid pattern
 *
 * Run: npx tsx examples/ide-tab.ts
 */

import shellfie, { themes } from '../src';
import { writeFileSync } from 'node:fs';

const code = `use std::collections::HashMap;

fn word_count(text: &str) -> HashMap<&str, usize> {
    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        let count = counts.entry(word).or_insert(0);
        *count += 1;
    }
    counts
}

fn main() {
    let text = "hello world hello rust world";
    let counts = word_count(text);
    for (word, count) in &counts {
        println!("{word}: {count}");
    }
}`;

// Corner circle overlay decoration
const cornerOverlay = `
  <circle cx="40" cy="40" r="80" fill="#ff006620" />
  <circle cx="40" cy="40" r="50" fill="#ff006610" />
`;

const svg = shellfie(code, {
  template: 'macos',
  theme: themes.oneDark,
  title: 'word_count.rs',
  titleAlignment: 'left',
  titleStyle: 'tab-box',
  language: 'rust',
  lineNumbers: { startFrom: 1, color: '#636d8366' },
  badge: { label: 'Rust' },
  background: {
    color: 'gradient(#1e2030, #2e3244:vertical)',
    padding: 40,
    pattern: {
      type: 'grid',
      color: '#ffffff06',
      size: 30,
    },
  },
  overlays: cornerOverlay,
});

writeFileSync('examples/svgs/ide-tab.svg', svg);
console.log('✓ Created examples/svgs/ide-tab.svg');
