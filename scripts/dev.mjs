import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import register from '../api/register.js';
import privacy from '../api/privacy.js';
import support from '../api/support.js';
import stripeWebhook from '../api/stripe-webhook.js';
import captchaConfig from '../api/captcha-config.js';
import download from '../api/download.js';
const root = resolve('public');
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain', '.exe': 'application/octet-stream' };
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:4173');
  res.status = code => { res.statusCode = code; return res; };
  res.json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
  if (url.pathname === '/api/support') return support(req, res);
  if (url.pathname === '/api/captcha-config') return captchaConfig(req, res);
  if (url.pathname === '/api/stripe-webhook') return stripeWebhook(req, res);
  if (['/api/register', '/api/privacy', '/api/download'].includes(url.pathname)) {
    let content = ''; for await (const part of req) { content += part; if (content.length > 4096) { res.writeHead(413); return res.end(); } }
    req.body = content;
    res.status = code => { res.statusCode = code; return res; };
    res.json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
    return ({ '/api/register': register, '/api/privacy': privacy, '/api/download': download }[url.pathname])(req, res);
  }
  try {
    const target = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!target.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
    const data = await readFile(target);
    res.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream' }); res.end(data);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Page not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Local: http://localhost:${port}`));
