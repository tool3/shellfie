import gradient from 'gradient-string';
import shellfie from '../src';
import { writeFileSync } from 'node:fs';

const logo = `
███████╗██╗  ██╗███████╗██╗     ██╗     ███████╗██╗███████╗
██╔════╝██║  ██║██╔════╝██║     ██║     ██╔════╝██║██╔════╝
███████╗███████║█████╗  ██║     ██║     █████╗  ██║█████╗  
╚════██║██╔══██║██╔══╝  ██║     ██║     ██╔══╝  ██║██╔══╝  
███████║██║  ██║███████╗███████╗███████╗██║     ██║███████╗
╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝╚═╝     ╚═╝╚══════╝

       create beautiful terminal screenshots in seconds
`


const svg = shellfie(gradient.teen.multiline(logo), {
  template: 'macos',
  title: 'shellfie',
  footer: {
    backgroundColor: '#1e1e1e',
    border: true,
  }
});

writeFileSync('examples/svgs/logo.svg', svg);
console.log('✓ Created examples/svgs/logo.svg');