const status = document.querySelector('#support-status');
const checkout = document.querySelector('#support-checkout');
async function loadSupport() {
  try {
    const response = await fetch('/api/support', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) return;
    const settings = await response.json();
    if (!settings.enabled || !['test', 'live'].includes(settings.mode)) return;
    const url = new URL(settings.url);
    if (url.protocol !== 'https:' || url.hostname !== 'buy.stripe.com') return;
    status.textContent = settings.message;
    status.classList.toggle('test-mode', settings.mode === 'test');
    checkout.href = url.href;
    checkout.textContent = settings.mode === 'test' ? 'Try sandbox checkout ↗' : 'Continue to Stripe ↗';
    checkout.hidden = false;
  } catch { /* Keep the honest coming-soon state if configuration cannot be reached. */ }
}
loadSupport();
