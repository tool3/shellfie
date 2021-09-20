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
  const defaultViewport = { width: 700, height: 600 };
  const defaultTheme = { background: '#151515' };

  const options = {
    name: generateId(),
    location: `${localPath}/shellfies`,
    style: {},
    theme: defaultTheme,
    rendererType: 'dom',
    ext: 'png',
    puppeteerOptions: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
    viewport: defaultViewport,
    mode: 'default',
  };

  if (config) {
    const userConfig = Object.keys(config).reduce((acc, key) => {
      if (key in options) {
        acc[key] = typeof options[key] === 'object' ? Object.assign(options[key], config[key]) : config[key];
      }
      return acc;
    }, {});
    return Object.assign(options, userConfig);
  }

  return options;
}

module.exports = getConfig;
