import shellfie, { themes } from '../../src';
import { writeFileSync } from 'node:fs';

const code = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shellfie Demo</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="main-header">
        <h1>Welcome to Shellfie</h1>
        <nav id="main-nav">
            <a href="#features">Features</a>
            <a href="#docs">Documentation</a>
        </nav>
    </header>
    <main>
        <section id="features">
            <h2>Features</h2>
            <p>Terminal screenshots as beautiful SVGs.</p>
        </section>
    </main>
</body>
</html>
`;

const svg = shellfie(code, { theme: themes.githubDark });
writeFileSync('examples/svgs/languages/html.svg', svg);
console.log('Created examples/svgs/languages/html.svg');
