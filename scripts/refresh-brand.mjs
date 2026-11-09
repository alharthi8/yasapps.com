import fs from 'node:fs/promises';
let html=await fs.readFile('public/index.html','utf8');
html=html.replace('href="/assets/browser.svg"','href="/assets/yasapps-symbol.svg"');
html=html.replaceAll('<img src="/assets/browser.svg" width="34" height="34" alt="">','<img src="/assets/yasapps-symbol.svg" width="34" height="34" alt="">');
await fs.writeFile('public/index.html',html);
for(const file of ['privacy.html','performance.html']){const data=await fs.readFile(`public/${file}`,'utf8');await fs.writeFile(`public/${file}`,data.replace('href="/assets/browser.svg"','href="/assets/yasapps-symbol.svg"'));}
console.log('Parent identity applied; product symbols preserved.');
