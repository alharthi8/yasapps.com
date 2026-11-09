import { readFile, access } from 'node:fs/promises';
const html = await readFile('public/index.html', 'utf8');
for (const file of ['public/styles.css', 'public/app.js', 'public/privacy.html', 'public/downloads/SHA256SUMS.txt', 'public/assets/yasapps-symbol.svg']) await access(file);
if (html.includes('href="#"')) throw new Error('Placeholder links found.');
console.log('Yas Apps: static pages, assets, and installers ready.');
