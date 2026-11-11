import { verifyCaptcha } from '../lib/captcha.js';
import { websiteDownloads } from '../lib/downloads.js';
import { parseBoundedJson } from '../lib/request-body.js';

export const config = { api: { bodyParser: { sizeLimit: '4kb' } } };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use the download verification page.' }); }
  const origins = new Set(['https://yasapps.com', 'https://www.yasapps.com']);
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL) origins.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.NODE_ENV !== 'production') { origins.add('http://localhost:4173'); origins.add('http://127.0.0.1:4173'); }
  if (req.headers.origin && !origins.has(req.headers.origin)) return res.status(403).json({ error: 'Please download from yasapps.com.' });
  if (Number(req.headers['content-length'] || 0) > 4096) return res.status(413).json({ error: 'Request too large.' });
  const parsed = parseBoundedJson(req.body, 4096);
  if (parsed.tooLarge) return res.status(413).json({ error: 'Request too large.' });
  if (parsed.invalid) return res.status(400).json({ error: 'Please use the download verification page.' });
  const body = parsed.value;
  if (!body || typeof body !== 'object' || Array.isArray(body) || !['browser', 'mail'].includes(body.product) || !['macos', 'windows'].includes(body.platform)) return res.status(400).json({ error: 'Choose an available Yas app download.' });
  const key = `${body.product}-${body.platform}`;
  const release = websiteDownloads[key];
  if (!release) return res.status(404).json({ error: 'This version is coming soon while testing continues.' });
  const verification = await verifyCaptcha(body.captchaToken, 'download', { cdata: key });
  if (!verification.ok) return res.status(verification.status).json({ error: verification.error });
  return res.status(200).json(release);
}
