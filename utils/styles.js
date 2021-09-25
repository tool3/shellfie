function processLine(key, value) {
    const [word] = key.match(/(^[a-z]|[A-Z0-9])[a-z]*/);
    if (key !== word) key = `${word}-${key.replace(word, '').toLowerCase()}`;
    return `${key}: ${value};`
}

function stringifyStyle(style) {
  return Object.keys(style)
    .map((rule) => processLine(rule, style[rule]))
    .join(' ');
}

function getStyle(className, style) {
  return `${className}{ ${stringifyStyle(style)} }`;
}

function getStyles(style) {
  return Object.keys(style)
    .map((key) => {
        if (typeof style[key] === "object") {
            return getStyle(key, style[key]);
        } else {
            return processLine(key, style[key]);
        }
    })
    .join('');
}

module.exports = { stringifyStyle, getStyles, getStyle };