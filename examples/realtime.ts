// run git log --name-only --oneline to find recently edited files
/**
 * Realtime example
 *
 * Run: npx tsx examples/realtime.ts
 */

import { snaptty } from '../src';
import { writeFileSync } from 'node:fs';
import { exec } from 'child_process';
import { promisify } from 'util'

const execAsync = promisify(exec);

(async () => {
    const data = await execAsync("git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --color=always")
    const svg = snaptty(data.stdout, {
        template: 'macos',
        title: 'realtime',
    });

    writeFileSync('examples/svgs/realtime.svg', svg);
    console.log('✓ Created examples/svgs/realtime.svg');
})()

