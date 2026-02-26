// run git log --name-only --oneline to find recently edited files
/**
 * Realtime example
 *
 * Run: npx tsx examples/realtime.ts
 */

import shellfie from '../src';
import { writeFileSync } from 'node:fs';
import { exec } from 'child_process';
import { promisify } from 'util'

const execAsync = promisify(exec);

(async () => {
    const data = await execAsync("git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --color=always")
    const svg = shellfie(data.stdout, {
        template: 'macos',
        title: 'git log',
    });

    writeFileSync('examples/svgs/git-log.svg', svg);
    console.log('✓ Created examples/svgs/git-log.svg');
})()

