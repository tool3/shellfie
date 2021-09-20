const shellfie = require('./');

(async () => {
const string = `
    [32m 11 passing[0m[90m (22ms)[0m
    [31m  1 failing[0m
    
    [0m  1) style
           built-in themes
             should create default theme:
    [0m[31m     Error: snapshots don't match!
          [0m[32mexpect: [0m[32m[0m[0m[32m[[0m[0m[32m3[0m[0m[32m5[0m[0m[32;4m;[0m[0m[32;4m5[0m[0m[32;4m;[0m[0m[32;4m5[0m[0m[32;4mm[0m[0m[32;4mP[0m[0m[32;4mU[0m[0m[32;4mR[0m[0m[32;4mP[0m[0m[32;4mL[0m[0m[32;4mE[0m[0m[32;4m [0m[0m[32;4m [0m[0m[32m█[0m[0m[32m█[0m[0m[32m█[0m[0m[32m█[0m[0m[32m█[0m[0m[32m█[0m[0m[32;4m█[0m[0m[32;4m█[0m[0m[32;4m█[0m[0m[32;4m█[0m[0m
          [0m[31mactual: [0m[31m[0m[0m[31m[[0m[0m[31m3[0m[0m[31m5[0m[0m[31;4mm[0m[0m[31;4mP[0m[0m[31;4mU[0m[0m[31;4mR[0m[0m[31;4mP[0m[0m[31;4mL[0m[0m[31;4mE[0m[0m[31;4m [0m[0m[31;4m [0m[0m[31;4m█[0m[0m[31;4m█[0m[0m[31;4m█[0m[0m[31;4m█[0m[0m[31m█[0m[0m[31m█[0m[0m[31m█[0m[0m[31m█[0m[0m[31m█[0m[0m[31m█[0m[0m[31;4m[0m[0m[31;4m[[0m[0m[31;4m0[0m[0m[31;4mm[0m[0m
          \u001b[35mPURPLE  ██████████[0m
          \u001b[35;5;219mPURPLE  ██████████[0m[0m[90m
          at error (/workspaces/experiments/snaptdout/index.js:40:11)
          at /workspaces/experiments/snaptdout/index.js:62:13
          at Array.forEach (<anonymous>)
          at validateSnapshot (/workspaces/experiments/snaptdout/index.js:44:18)
          at snap (/workspaces/experiments/snaptdout/index.js:146:19)
          at async Context.<anonymous> (index.test.js:41:7)
    [0m`

    await shellfie(string, {viewport: {width: 900}, mode: 'raw', puppeteerOptions: {headless: false}});
})()