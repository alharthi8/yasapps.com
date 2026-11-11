import { readFile, access } from 'node:fs/promises';
const html = await readFile('public/index.html', 'utf8');
for (const file of ['public/styles.css', 'public/app.js', 'public/privacy.html', 'public/macos.html', 'public/downloads/SHA256SUMS.txt', 'public/assets/yasapps-symbol.svg']) await access(file);
if (html.includes('href="#"')) throw new Error('Placeholder links found.');
console.log('Yas Apps: static pages, assets, and installers ready.');
for (const file of ['public/support.html', 'public/support.css', 'public/support.js', 'api/support.js', 'api/stripe-webhook.js']) await access(file);
for (const file of ['public/captcha.js', 'public/download.html', 'public/download.js', 'api/captcha-config.js', 'api/download.js']) await access(file);
if (!html.includes('id="registration-captcha"')) throw new Error('Registration verification widget missing.');
for (const file of ['public/index.html', 'public/macos.html']) {
  if ((await readFile(file, 'utf8')).includes('/releases/download/')) throw new Error(`Direct download bypass in ${file}`);
}
