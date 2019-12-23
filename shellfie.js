global.window = undefined;
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const { Terminal } = require('xterm');
const { FitAddon } = require('xterm-addon-fit');

const defaultpuppeteerArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
const defaultTheme = { background: '#151515' };
const defaultViewport = { width: 800, height: 600 };

async function shellfie(data, { name, location, style, theme = defaultTheme, ext = 'png', puppeteerArgs = defaultpuppeteerArgs, viewport = defaultViewport }) {
    try {
        // validateInput(snapshot);
        const localPath = process.env.INIT_CWD;
        const browser = await puppeteer.launch({ args: puppeteerArgs, });
        const page = await browser.newPage();
        const viewportSize = { width: viewport.width || defaultViewport.width, height: viewport.height || defaultViewport.height }

        await page.setViewport({ ...viewportSize, deviceScaleFactor: 2 });
        // read html template
        const templatePath = path.join(__dirname + '/template/template.html');
        let html = await fs.readFile(templatePath, 'utf-8');
        const lines = Array.isArray(data) ? data : data.split('\n');

        // inject js scripts
        const localModules = path.join(__dirname, 'node_modules')
        await page.addScriptTag({ path: `${localModules}/xterm-addon-fit/lib/xterm-addon-fit.js` });
        await page.addScriptTag({ path: `${localModules}/xterm/lib/xterm.js` });

        // set page html
        await page.setContent(html);
        await page.waitForSelector('.main');

        await page.evaluate(({ options, lines }) => {
            // const fit = new FitAddon();
            const term = new Terminal({ ...options, convertEol: true, allowProposedApi: true, logLevel: 'debug' });
            // term.loadAddon(fit)
            term.open(document.getElementById('terminal'));
            lines.forEach(line => term.writeln(line));
            // fit.fit();
        }, { lines, options: style ? { theme, ...style } : { theme } })

        // inject styles
        await page.addStyleTag({ path: `${localModules}/xterm/css/xterm.css` })
        await page.addStyleTag({ path: `${path.resolve(__dirname, 'template/template.css')}` });

        // crop image   
        const clip = await (await page.$(".main")).boundingBox()

        // create shellfies dir
        const pngsDir = location ? path.resolve(location) : `${localPath}/shellfies`;
        const exists = await fs.access(pngsDir).then(() => 1).catch(() => 0);
        if (!exists) await fs.mkdir(pngsDir);

        // take screenshot
        await page.screenshot({ path: `${pngsDir}/${name}.${ext}`, clip, omitBackground: true, type: ext });
        await browser.close();
    } catch (err) {
        console.error(new Error(`shellfie error: ${err.message}`))
        throw err;
    }
}

module.exports = shellfie