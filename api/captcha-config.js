import { captchaConfiguration } from '../lib/captcha.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Use GET.' }); }
  const keys = captchaConfiguration();
  if (!keys) return res.status(503).json({ error: 'Human verification is temporarily unavailable.' });
  return res.status(200).json({ siteKey: keys.siteKey });
}
