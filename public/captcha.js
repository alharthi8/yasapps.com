let scriptReady;
function loadScript() {
  if (window.turnstile) return Promise.resolve();
  if (!scriptReady) scriptReady = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timer = setTimeout(() => reject(new Error('Verification took too long to load. Please reload the page.')), 15000);
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => { clearTimeout(timer); resolve(); };
    script.onerror = () => { clearTimeout(timer); reject(new Error('Verification could not load. Please check your connection and reload.')); };
    document.head.append(script);
  });
  return scriptReady;
}

export async function mountCaptcha(container, { action, cdata, onChange }) {
  const response = await fetch('/api/captcha-config', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Verification is temporarily unavailable. Please try again shortly.');
  const { siteKey } = await response.json();
  if (typeof siteKey !== 'string' || !siteKey) throw new Error('Verification is temporarily unavailable.');
  await loadScript();
  await new Promise(resolve => window.turnstile.ready(resolve));
  let token = '';
  const change = (value, message) => { token = value; onChange(value, message); };
  const widget = window.turnstile.render(container, {
    sitekey: siteKey, action, ...(cdata ? { cData: cdata } : {}),
    theme: 'auto', size: container.clientWidth < 300 ? 'compact' : 'flexible',
    callback: value => change(value, 'Verification complete.'),
    'expired-callback': () => change('', 'Verification expired. Please verify again.'),
    'error-callback': () => change('', 'Verification could not finish. Please retry or reload the page.'),
  });
  return { getToken: () => token, reset() { change('', 'Please complete the human verification.'); window.turnstile.reset(widget); } };
}
