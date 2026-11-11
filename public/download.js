import { mountCaptcha } from './captcha.js';
const query = new URLSearchParams(location.search);
const product = query.get('product') || 'browser';
const platform = query.get('platform') || 'macos';
const form = document.querySelector('#download-form');
const button = form.querySelector('button');
const status = document.querySelector('#download-status');
let captcha;
let submitting = false;
if (product !== 'browser' || platform !== 'macos') {
  document.querySelector('#download-title').textContent = 'This version is coming soon.';
  document.querySelector('#download-description').textContent = 'We are finishing release testing. Return to downloads for current availability.';
  status.textContent = 'Choose an available release from the downloads section.';
} else {
  mountCaptcha(document.querySelector('#download-captcha'), { action: 'download', cdata: 'browser-macos', onChange(token, message) { button.disabled = submitting || !token; if (token) status.classList.remove('error'); if (token || !status.classList.contains('error')) status.textContent = message; } })
    .then(widget => { captcha = widget; }).catch(error => { status.textContent = error.message; status.classList.add('error'); });
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  const token = captcha?.getToken();
  if (submitting || !token) { status.textContent = 'Please complete the human verification.'; return; }
  submitting = true; button.disabled = true; status.textContent = 'Checking verification…';
  let outcomeMessage = '';
  try {
    const response = await fetch('/api/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product, platform, captchaToken: token }), signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Download verification failed. Please try again.');
    const url = new URL(result.url);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || !url.pathname.startsWith('/alharthi8/yas-browser/releases/download/')) throw new Error('Download destination could not be confirmed.');
    outcomeMessage = 'Your download is starting from GitHub.';
    status.textContent = outcomeMessage;
    location.assign(url.href);
  } catch (error) { outcomeMessage = error.message || 'Please try again.'; status.textContent = outcomeMessage; status.classList.add('error'); }
  finally { submitting = false; button.disabled = true; captcha?.reset(); if (outcomeMessage) status.textContent = outcomeMessage; }
});
