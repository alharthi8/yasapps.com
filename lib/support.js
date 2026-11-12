export function supportConfiguration(env = process.env) {
  const unavailable = { enabled: false, message: 'One-time card support is coming soon. For now, help shape Yas with ideas, issues, or code on GitHub.' };
  if (env.STRIPE_SUPPORT_ENABLED !== 'true') return unavailable;
  const mode = env.STRIPE_SUPPORT_MODE;
  if (!['test', 'live'].includes(mode)) return unavailable;
  const production = env.VERCEL_ENV === 'production' || (!env.VERCEL_ENV && env.NODE_ENV === 'production');
  if (production && mode !== 'live') return unavailable;
  if (mode === 'live' && !env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')) return unavailable;
  let url;
  try { url = new URL(env.STRIPE_SUPPORT_URL); } catch { return unavailable; }
  if (url.protocol !== 'https:' || url.hostname !== 'buy.stripe.com' || url.port || url.username || url.password || url.search || url.hash) return unavailable;
  if (!/^\/(test_)?[A-Za-z0-9]+$/.test(url.pathname)) return unavailable;
  if ((mode === 'test') !== url.pathname.startsWith('/test_')) return unavailable;
  if (!/^plink_[A-Za-z0-9]+$/.test(env.STRIPE_SUPPORT_PAYMENT_LINK_ID || '')) return unavailable;
  return { enabled: true, mode, url: url.href, message: mode === 'test' ? 'Sandbox checkout. Use Stripe test details only; no real money moves.' : 'Choose a one-time amount on Stripe’s secure checkout.' };
}

export function supportEventSummary(event, env = process.env) {
  const accepted = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed']);
  if (!accepted.has(event.type)) return null;
  const session = event.data?.object;
  if (!['test', 'live'].includes(env.STRIPE_SUPPORT_MODE) || event.livemode !== (env.STRIPE_SUPPORT_MODE === 'live')) return null;
  if (!env.STRIPE_SUPPORT_PAYMENT_LINK_ID || session?.payment_link !== env.STRIPE_SUPPORT_PAYMENT_LINK_ID || session.mode !== 'payment') return null;
  const status = event.type === 'checkout.session.async_payment_failed' ? 'failed' : session.payment_status === 'paid' ? 'paid' : 'pending';
  // A delivery summary only: Stripe retains the payment record. No customer data or fulfillment side effects.
  return { eventId: event.id, type: event.type, status, livemode: event.livemode };
}
