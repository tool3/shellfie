const puppeteer = require('puppeteer');
const getConfig = require('./utils/config');
const path = require('path');
const fs = require('fs').promises;
const { getStyles } = require('./utils/styles');

async function shellfie(data, config) {
    try {
        if (!data || data.length === 0) {
            throw new Error('no data provided.\nshelffie needs a string || string[] to produce an image.')
        }
        const localPath = process.env.INIT_CWD || process.cwd();
        const { name, location, style, theme, ext, puppeteerOptions, viewport, mode, rendererType } = getConfig(config, localPath);
        const browser = await puppeteer.launch(puppeteerOptions);
        const page = await browser.newPage();

        await page.setViewport({ ...viewport, deviceScaleFactor: 4 });
        // read html template
        const templatePath = __dirname + '/template/template.html';
        let html = await fs.readFile(templatePath, 'utf-8');
        const lines = (Array.isArray(data) || mode === 'raw') ? data : data.split('\n');

        // inject js scripts
        await page.addScriptTag({ path: require.resolve('xterm/lib/xterm.js') });
        await page.addScriptTag({ path: require.resolve('xterm-addon-fit/lib/xterm-addon-fit.js') });

        // set page html
        await page.setContent(html);
        await page.waitForSelector('.main');
        page.on('console', txt => console.log(txt.text()));
        
        // setup terminal
        await page.evaluate(({ options, lines, mode, viewport }) => {
            const fit = new FitAddon.FitAddon();
            const term = new Terminal({ ...options });
            term.open(document.getElementById('terminal'));
            term.loadAddon(fit);
            term.writeln('');
            
            if (mode === 'default') {
                lines.forEach(line => {
                    line = line.replace(/\\x1.?\[/g, "\x1b[");
                    line = `${line}\x1b[0m`;
                    term.writeln(line);
                });
            } else {
                if (Array.isArray(lines)) {
                    lines = lines.length > 1 ? lines : lines[0]
                }
                lines = lines.replace(/\n/g, '\r\n');
                term.write(lines.trim());
            }
            const height = viewport.height - 60;
            document.querySelector('.xterm-screen').style.width = `${viewport.width}px`;
            document.querySelector('.xterm-screen').style.height = `${height}px`;
            fit.fit();

        }, { lines, mode, options: { theme, rendererType }, viewport });
        
        await page.evaluate((theme) => document.querySelector('.terminal').style.background = theme.background, theme);
        const templateStyle = __dirname + '/template/template.css';

        // inject user style
        if (style) {
            const styles = getStyles(style);
            const className = rendererType === 'dom' ? '.terminal.xterm' : 'canvas';
            const content = `${className} {${styles}}`
            await page.addStyleTag({content})
        }

        // inject styles
        await page.addStyleTag({ path: templateStyle });
        await page.addStyleTag({ path: `${localPath}/node_modules/xterm/css/xterm.css` });
        


        await page.evaluateHandle('document.fonts.ready');
        
        // crop image   
        const clip = await (await page.$(".main")).boundingBox();
        clip.height = Math.min(clip.height, page.viewport().height);
        clip.width = Math.min(clip.width, page.viewport().width);

        await page.evaluate((height) => document.querySelector('.main').style.height = height, clip.height);

        // create shellfies dir
        const pngsDir = path.resolve(location);
        const exists = await fs.access(pngsDir).then(() => 1).catch(() => 0);
        if (!exists) await fs.mkdir(pngsDir);

        // take screenshot
        await page.screenshot({ path: `${pngsDir}/${name}.${ext}`, clip, omitBackground: true, type: ext });
        await browser.close();
    } catch (err) {
        console.error(new Error(`\x1b[32mshellfie error: ${err.message}\x1b[0m`))
        console.error(err.stack)
        throw err;
    }
}


module.exports = shellfie