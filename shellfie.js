global.window = undefined;
const puppeteer = require('puppeteer');
const getConfig = require('./utils/config');
const path = require('path');
const fs = require('fs').promises;

async function shellfie(data, config) {
    try {
        if (!data || data.length === 0) {
            throw new Error('no data provided.\nshelffie needs a string || string[] to produce an image.')
        }
        const localPath = process.env.INIT_CWD || process.cwd();
        const { name, location, style, theme, ext, puppeteerArgs, viewport, mode } = getConfig(config, localPath);

        const browser = await puppeteer.launch({ args: puppeteerArgs });
        const page = await browser.newPage();

        await page.setViewport({ ...viewport, deviceScaleFactor: 2 });
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
        page.on('console', txt => console.log(txt.text()));
        // setup terminal
        await page.evaluate(({ options, lines, mode }) => {
            const term = new Terminal({ ...options });
            term.open(document.getElementById('terminal'));
            term.writeln('');

            const isArray = Array.isArray(lines);
            const length = isArray ? lines.length : lines.split('\n').length;
            const { rows, cols } = term;
            if (mode === 'default') {
                lines.forEach(line => {
                    line = line.replace(/\\x1.?\[/g, "\x1b[");
                    line = `${line}\x1b[0m`;
                    term.writeln(line);
                });
            } else {
                lines = lines.replace(/\n/g, '\r\n');
                lines = chunkArray(lines.split(' '), cols * 4);
                lines.forEach(line => {
                    line = line.join(' ');
                    line = line.replace(/\\x1.?\[/g, "\x1b[");
                    line = `${line}\x1b[0m`;
                    term.writeln(line);
                });
            }

            if (isArray && length > 5) {
                term.resize((Number(length) * 4), Number(length) + 3);
            } else {
                const rowsNumber = rows > length ? (length * 2) + 1 : rows;
                term.resize(cols - 8, mode === "default" ? rowsNumber : rows + 5);
            }


            function chunkArray(myArray, size) {
                var index = 0;
                var arrayLength = myArray.length;
                var tempArray = [];

                for (index = 0; index < arrayLength; index += size) {
                    myChunk = myArray.slice(index, index + size);
                    tempArray.push(myChunk);
                }

                return tempArray;
            }

        }, { lines, mode, options: style ? { theme, ...style } : { theme } });

        // inject styles
        await page.addStyleTag({ path: `${localModules}/xterm/css/xterm.css` })
        await page.addStyleTag({ path: `${path.resolve(__dirname, 'template/template.css')}` });

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
        console.error(new Error(`shellfie error: ${err.message}`))
        console.error(err.stack)
        throw err;
    }
}


module.exports = shellfie