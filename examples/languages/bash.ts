import shellfie from '../../src';
import { writeFileSync } from 'node:fs';

const code = `#!/bin/bash

# Variables and command substitution
NAME="World"
DATE=$(date +%Y-%m-%d)

# Function definition
greet() {
    echo "Hello, $1!"
}

# Conditional and loop
if [ -f "$HOME/.bashrc" ]; then
    source "$HOME/.bashrc"
fi

for i in {1..5}; do
    greet "User $i"
done | grep -v "User 3"
`;

const svg = shellfie(code, { language: 'auto'});
writeFileSync('examples/svgs/languages/bash.svg', svg);
console.log('Created examples/svgs/languages/bash.svg');
