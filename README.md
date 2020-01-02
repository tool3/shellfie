# shellfie 🤳🏽

beautiful progremattic terminal screenshots

# install
```bash
yarn add shellfie
```

# usage
```js
const data = [
    '\x1b[105mSHELLFIE\\x1b[0m🤳',
    '\x1b[38;5;225mthe easiest way',
    '\x1b[38;5;213mto create beautiful',
    '\x1b[38;5;14mCLI screenshots 📸',
    '\x1b[38;5;199mprogrammatically 🚀'
];
const options = {
    name: 'shellfie',
    style: {
        fontSize: 15,
        fontWeight: 'bold',
        fontFamily: 'Fira Code'
    },
    viewport: {
        width: 400,
        height: 300
    }
}
await shellfie(data, options);
```

outputs:
![](https://github.com/tool3/shellfied/blob/master/shellfies/shellfie.png?raw=true)


# data
**type**: `string[]` || `string`   
**description**: string data to output to the terminal

# options
**type**: `object`   
**description**: optional config for `shellfie`
### `name`
**type**: `string`   
**description**: name of image   

### `location`
**type**: `string`   
**description**: relative path to save your shellfies   

### `theme`
**type**: `object`   
**description**: optional theme style
#### `background`
**type**: `string`   
**description**: css color for terminal background   
**default**: `{ background: '#151515' }`
#### `forground`
**type**: `string`   
**description**: css color for any unformatted string provided in `data`

### style
**type**: `object`   
**description**: css properties for terminal output
#### fontSize
**type**: `number`   
**description**: font size
#### fontWeight
**type**: `string`   
**description**: font weight

#### fontFamily
**type**: `string`   
**description**: font family

### viewport
**type**: `object`   
**description**: viewport of terminal   
**default**: `{ width: 700, height: 600 }`
#### width
**type**: `number`   
**description**: viewport width

#### height
**type**: `number`   
**description**: viewport height

### puppeteerArgs
**type**: `string[]`   
**description**: optional puppteer args    
**default**: `['--no-sandbox', '--disable-setuid-sandbox']`

### mode
**type**: `string`   
**description**: can allow raw string input. for example: `yarn test --colors > help.txt`, then copy the text and provide it to `shellfie` with this option set to `raw`.   
**default**: `default`