import { neon } from '@neondatabase/serverless';
import { createHmac } from 'node:crypto';
import { resolveMx } from 'node:dns/promises';
import { validateRegistration } from '../lib/registration.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use the registration form to sign up.' }); }
  const allowed = new Set([process.env.SITE_URL || 'https://yasapps.com', 'https://www.yasapps.com']);
  if (process.env.VERCEL_URL) allowed.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.NODE_ENV !== 'production') allowed.add('http://localhost:4173');
  if (req.headers.origin && !allowed.has(req.headers.origin)) return res.status(403).json({ error: 'Please register on yasapps.com.' });
  if (Number(req.headers['content-length'] || 0) > 4096) return res.status(413).json({ error: 'The registration is too large.' });
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { return res.status(400).json({ error: 'Please complete the registration form.' }); }
  const parsed = validateRegistration(body);
  if (parsed.bot) return res.status(200).json({ message: 'Your interest has been registered.' });
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  if (!process.env.DATABASE_URL || !process.env.RATE_LIMIT_SALT) return res.status(503).json({ error: 'Registration is temporarily unavailable. Please try again shortly.' });
  try {
    const sql = neon(process.env.DATABASE_URL);
    const ip = req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const hour = Math.floor(Date.now() / 3600000);
    const bucket = createHmac('sha256', process.env.RATE_LIMIT_SALT).update(`${String(ip).split(',')[0].trim()}:${hour}`).digest('hex');
    const limits = await sql`INSERT INTO registration_rate_limits (bucket, attempts, expires_at) VALUES (${bucket}, 1, now() + interval '2 hours') ON CONFLICT (bucket) DO UPDATE SET attempts = registration_rate_limits.attempts + 1 RETURNING attempts`;
    if (limits[0].attempts > 10) { res.setHeader('Retry-After', '3600'); return res.status(429).json({ error: 'Too many attempts. Please try again in an hour.' }); }
    const { email, products, platform, consentVersion } = parsed.value;
    let mx;
    try { mx = await resolveMx(email.split('@')[1]); } catch { return res.status(400).json({ error: 'That email domain could not be reached. Check the address and try again.' }); }
    if (!mx.some(record => record.exchange && record.exchange !== '.')) return res.status(400).json({ error: 'That domain does not appear to receive email. Please use another address.' });
    await sql`INSERT INTO registrations (email, products, platform, consent_version) VALUES (${email}, ${products}, ${platform}, ${consentVersion}) ON CONFLICT (email) DO UPDATE SET products = EXCLUDED.products, platform = EXCLUDED.platform, consent_version = EXCLUDED.consent_version, updated_at = now()`;
    return res.status(200).json({ message: 'You’re on the list. We’ll share news about your selected Yas apps.' });
  } catch {
    // Never log submitted addresses or database credentials.
    console.error('Yas registration storage request failed.');
    return res.status(503).json({ error: 'We couldn’t save your registration. Please try again shortly.' });
  }
}
