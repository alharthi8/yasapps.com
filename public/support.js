import { withRequestDeadline } from './request-deadline.js';

const status = document.querySelector('#support-status');
const checkout = document.querySelector('#support-checkout');
async function loadSupport() {
  status.textContent = 'Checking card support availability…';
  try {
    const settings = await withRequestDeadline(8000, async signal => {
      const response = await fetch('/api/support', { cache: 'no-store', signal });
      if (!response.ok) return null;
      return await response.json();
    });
    if (!settings) throw new Error('Support settings unavailable');
    if (!settings.enabled) {
      status.textContent = settings.message || 'Card support is not open yet. You can support the community on GitHub below.';
      return;
    }
    if (!['test', 'live'].includes(settings.mode)) throw new Error('Invalid checkout mode');
    const url = new URL(settings.url);
    if (url.protocol !== 'https:' || url.hostname !== 'buy.stripe.com' || url.username || url.password || url.port || url.search || url.hash || !/^\/(test_)?[A-Za-z0-9]+$/.test(url.pathname) || (settings.mode === 'test') !== url.pathname.startsWith('/test_')) throw new Error('Invalid checkout link');
    status.textContent = settings.message;
    status.classList.toggle('test-mode', settings.mode === 'test');
    checkout.href = url.href;
    checkout.textContent = settings.mode === 'test' ? 'Try sandbox checkout ↗' : 'Support the community on Stripe ↗';
    checkout.hidden = false;
  } catch {
    status.textContent = 'We couldn’t check card support right now. Please refresh to try again, or contribute on GitHub below.';
  }
}
loadSupport();
