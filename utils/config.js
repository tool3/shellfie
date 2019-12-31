
function generateId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let result = '';

    for (var i = 0; i < 7; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return `shellfie_${result}`;
}


function getConfig(config, localPath) {
    const defaultpuppeteerArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
    const defaultViewport = { width: 700, height: 600 };
    const defaultTheme = { background: '#151515' };
    
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

    Object.assign(defaultOptions, config);

    if (config.puppeteerArgs) {
        defaultOptions.puppeteerArgs = { args: config.puppeteerArgs ? [...defaultpuppeteerArgs, ...puppeteerArgs] : defaultpuppeteerArgs };
    }

    if (config.viewport) {
        defaultOptions.viewport = { width: config.viewport.width || defaultViewport.width, height: config.viewport.height || defaultViewport.height };
    }
    
    return defaultOptions;
}

module.exports = getConfig;