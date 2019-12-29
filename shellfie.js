global.window = undefined;
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const { Terminal } = require('xterm');

function generateId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let result = '';

    for (var i = 0; i < 7; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return `shellfie_${result}`;
}

const defaultpuppeteerArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
const defaultTheme = { background: '#151515' };
const defaultViewport = { width: 700, height: 600 };
const localPath = process.env.INIT_CWD || process.cwd();
const defaultOptions = {
    name: generateId(),
    location: `${localPath}/shellfies`,
    style: {},
    theme: defaultTheme,
    ext: 'png',
    puppeteerArgs: defaultpuppeteerArgs,
    viewport: defaultViewport,
    mode: 'default'
};

async function shellfie(data, config) {
    try {
        if (!data || data.length === 0) {
            throw new Error('no data provided.\nshelffie needs a string || string[] to produce an image.')
        }
        
        Object.assign(defaultOptions, config);
        const { name, location, style, theme, ext, puppeteerArgs, viewport, mode } = defaultOptions;
        
        const viewportSize = { width: viewport.width || defaultViewport.width, height: viewport.height || defaultViewport.height }
        const puppeteerArguments = { args: puppeteerArgs ? [...defaultpuppeteerArgs, ...puppeteerArgs] : defaultpuppeteerArgs };
        const browser = await puppeteer.launch(puppeteerArguments);
        const page = await browser.newPage();

        await page.setViewport({ ...viewportSize, deviceScaleFactor: 2 });
        // read html template
        const templatePath = path.join(__dirname + '/template/template.html');
        let html = await fs.readFile(templatePath, 'utf-8');
        const lines = (Array.isArray(data) || mode === 'raw') ? data : data.split('\n');

        // inject js scripts
        const localModules = path.join(localPath, 'node_modules')
        await page.addScriptTag({ path: `${localModules}/xterm/lib/xterm.js` });
        
        // set page html
        await page.setContent(html);
        await page.waitForSelector('.main');
        page.on('console', txt => txt.text());
        // setup terminal
        await page.evaluate(({ options, lines, mode}) => {
            const term = new Terminal({ ...options });
            term.open(document.getElementById('terminal'));
            term.writeln('');
            if (mode === 'default') {
                lines.forEach(line => {
                    line = line.replace(/\\x1.?\[/g, "\x1b[");
                    line = `${line}\x1b[0m`;
                    term.writeln(line);
                });
            } else {
                lines = lines.replace(/\n/g, '\r\n');
                term.write(lines);
            }

            if (Array.isArray(lines) && lines.length > 5) {
                term.resize((Number(lines.length) * 4), Number(lines.length) + 3);
            } else {
                const { rows, cols } = term;
                term.resize(cols - 10, rows)
            }

        }, { lines, mode, options: style ? { theme, ...style } : { theme } });
        
        // inject styles
        await page.addStyleTag({ path: `${localModules}/xterm/css/xterm.css` })
        await page.addStyleTag({ path: `${path.resolve(__dirname, 'template/template.css')}` });

        // crop image   
        const clip = await (await page.$(".main")).boundingBox()

        // create shellfies dir
        const pngsDir = path.resolve(location);
        const exists = await fs.access(pngsDir).then(() => 1).catch(() => 0);
        if (!exists) await fs.mkdir(pngsDir);

        // take screenshot
        await page.screenshot({ path: `${pngsDir}/${name}.${ext}`, clip, omitBackground: true, type: ext });
        await browser.close();
    } catch (err) {
        console.error(new Error(`shellfie error: ${err.message}`))
        console.error(err.stack)
        throw err;
    }
}

module.exports = shellfie