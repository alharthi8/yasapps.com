import { mountCaptcha } from './captcha.js';
import { requestDownload } from './download-request.js';
import { BROWSER_RELEASES } from './releases.js';
const query = new URLSearchParams(location.search);
const product = query.get('product') || 'browser';
const platform = query.get('platform') || 'windows';
const form = document.querySelector('#download-form');
const button = form.querySelector('button');
const status = document.querySelector('#download-status');
let captcha;
let submitting = false;
const release = BROWSER_RELEASES[platform];
if (product !== 'browser' || !release?.available) {
  const names = { mail: 'Yas Mail', connect: 'Yas Connect', agent: 'Yas Agent' };
  document.querySelector('#download-title').textContent = product === 'browser' && platform === 'macos' ? 'Yas Browser for macOS is coming soon.' : `${names[product] || 'This version'} is coming soon.`;
  document.querySelector('#download-description').textContent = 'Yas Browser for Windows is available now. macOS and the other Yas products are coming soon.';
  form.hidden = true;
  document.querySelectorAll('[data-available-only]').forEach(element => { element.hidden = true; });
  status.textContent = 'Choose an available release from the downloads section.';
} else {
  document.querySelector('#download-title').textContent = 'Yas Browser for Windows';
  document.querySelector('#download-description').textContent = `Version ${release.version} · ${release.platformLabel}. Free desktop preview. The installer is not publisher-signed.`;
  button.textContent = 'Download for Windows ↓';
  mountCaptcha(document.querySelector('#download-captcha'), { action: 'download', cdata: `browser-${platform}`, onChange(token, message) { button.disabled = submitting || !token; if (token) status.classList.remove('error'); if (token || !status.classList.contains('error')) status.textContent = message; } })
    .then(widget => { captcha = widget; }).catch(error => { status.textContent = error.message; status.classList.add('error'); });
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  const token = captcha?.getToken();
  if (submitting || !token) { status.textContent = 'Please complete the human verification.'; return; }
  submitting = true; button.disabled = true; status.textContent = 'Checking verification…';
  let outcomeMessage = '';
  try {
    const url = await requestDownload({ product, platform, captchaToken: token });
    outcomeMessage = 'Your download is starting from GitHub.';
    status.textContent = outcomeMessage;
    location.assign(url);
  } catch (error) { outcomeMessage = error.message || 'Please try again.'; status.textContent = outcomeMessage; status.classList.add('error'); }
  finally { submitting = false; button.disabled = true; captcha?.reset(); if (outcomeMessage) status.textContent = outcomeMessage; }
});
