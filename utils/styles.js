function processLine(key, value) {
    const words = key.split(/(?=[A-Z])/);
    if (words.length > 1) {
      key = words.map(word => word.toLowerCase()).join('-')
    }
    
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