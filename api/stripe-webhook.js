import Stripe from 'stripe';
import { supportEventSummary } from '../lib/support.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use POST.' }); }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret?.startsWith('whsec_')) return res.status(503).json({ error: 'Payment events are not configured.' });
  if (Number(req.headers['content-length']) > 262144) return res.status(413).json({ error: 'Payload too large.' });
  const parts = []; let size = 0;
  try {
    for await (const part of req) {
      const bytes = Buffer.isBuffer(part) ? part : Buffer.from(part);
      size += bytes.length;
      if (size > 262144) return res.status(413).json({ error: 'Payload too large.' });
      parts.push(bytes);
    }
  } catch { return res.status(400).json({ error: 'Invalid request.' }); }
  let event;
  try { event = Stripe.webhooks.constructEvent(Buffer.concat(parts), req.headers['stripe-signature'], secret); }
  catch { return res.status(400).json({ error: 'Invalid payment event signature.' }); }
  const summary = supportEventSummary(event);
  if (summary) console.info('Yas support payment event', summary);
  // Repeated deliveries are safe: no access, mailing consent, or other customer state is changed here.
  return res.status(200).json({ received: true });
}
