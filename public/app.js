const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
menu?.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); nav.classList.toggle('open', open); });
nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation'); }));

let currentPlatform = /Mac/i.test(navigator.platform) ? "macos" : "windows";
function setPlatform(platform) {
  currentPlatform = platform;
  document.querySelectorAll('[data-platform]').forEach(button => { const selected = button.dataset.platform === platform; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); });
  document.querySelectorAll('.windows-download').forEach(a => a.hidden = platform !== 'windows');
  document.querySelectorAll('.mac-download').forEach(a => a.hidden = platform !== 'macos');
  document.querySelectorAll('[data-platform-note]').forEach(note => note.hidden = note.dataset.platformNote !== platform);
  document.querySelectorAll('[data-release-details]').forEach(button => {button.dataset.dialog = button.dataset.releaseDetails + (platform === 'macos' ? '-mac-details' : '-details'); button.textContent=button.dataset.releaseDetails==='browser'&&platform==='macos'?'Preview details':'Testing details';});
  document.querySelectorAll('.release-meta').forEach(meta => { const available=meta.closest('[data-download-card]').dataset.downloadCard==='browser'&&platform==='macos';meta.children[0].textContent=available?'v0.4.7 · Experimental':'Coming soon';meta.children[1].textContent=available?'Apple Silicon · Not notarized':(platform==='macos'?'macOS':'Windows')+' · Testing in progress'; });
}
setPlatform(currentPlatform);
document.querySelectorAll('[data-platform]').forEach(button => button.addEventListener('click', () => setPlatform(button.dataset.platform)));
document.querySelectorAll('[data-select-product]').forEach(a => a.addEventListener('click', () => { setPlatform(currentPlatform); document.querySelectorAll('[data-download-card]').forEach(card => card.classList.toggle('highlight', card.dataset.downloadCard === a.dataset.selectProduct)); }));
document.querySelectorAll('[data-register-product]').forEach(a => a.addEventListener('click', () => { document.querySelector('#platform').value = currentPlatform; document.querySelectorAll('[name=product]').forEach(input => input.checked = input.value === a.dataset.registerProduct); }));

function openDialog(id) { const dialog = document.getElementById(id); if (dialog instanceof HTMLDialogElement && !dialog.open) dialog.showModal(); }
document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => openDialog(button.dataset.dialog)));
document.querySelectorAll('a[href="#browser-details"],a[href="#mail-details"]').forEach(a => a.addEventListener('click', event => { event.preventDefault(); openDialog(a.hash.slice(1)); }));
document.querySelectorAll('dialog').forEach(dialog => { dialog.querySelector('.close-dialog')?.addEventListener('click', () => dialog.close()); dialog.addEventListener('click', event => { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); }); });

document.querySelectorAll('dialog a[href="#register"]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  const dialog = link.closest('dialog');
  const product = dialog.id.startsWith('browser') ? 'browser' : 'mail';
  document.querySelectorAll('[name=product]').forEach(input => input.checked = input.value === product);
  document.querySelector('#platform').value = currentPlatform;
  dialog.close();
  location.hash = 'register';
  document.querySelector('#email').focus({ preventScroll: true });
}));

const form = document.querySelector('#registration-form');
let registrationCaptcha;
let registrationSubmitting = false;
if (form) {
  const submit = form.querySelector('button[type=submit]');
  const verificationStatus = document.querySelector('#registration-captcha-status');
  submit.disabled = true;
  import('/captcha.js').then(({ mountCaptcha }) => mountCaptcha(document.querySelector('#registration-captcha'), {
    action: 'register',
    onChange(token, message) { submit.disabled = registrationSubmitting || !token; verificationStatus.textContent = message; },
  })).then(widget => { registrationCaptcha = widget; })
    .catch(error => { verificationStatus.textContent = error.message; verificationStatus.classList.add('error'); });
}
form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (registrationSubmitting) return;
  const status = document.querySelector('#form-status');
  const products = [...form.querySelectorAll('[name=product]:checked')].map(input => input.value);
  status.classList.remove('error');
  if (!products.length) { status.textContent = 'Choose at least one Yas app.'; status.classList.add('error'); form.querySelector('[name=product]').focus(); return; }
  const captchaToken = registrationCaptcha?.getToken();
  if (!captchaToken) { status.textContent = 'Please complete the human verification.'; status.classList.add('error'); return; }
  const button = form.querySelector('button[type=submit]');
  registrationSubmitting = true;
  button.disabled = true; button.textContent = 'Saving your place…'; status.textContent = '';
  try {
    const { submitFormJson } = await import('/form-request.js');
    const data = await submitFormJson('/api/register', { email: form.email.value, products, platform: form.platform.value, consent: form.consent.checked, website: form.website.value, captchaToken });
    status.textContent = data.message; form.email.value = ''; form.consent.checked = false;
  } catch (error) { status.textContent = error.name === 'TimeoutError' ? 'The request took too long. Please try again.' : error.message || 'Please check your connection and try again.'; status.classList.add('error'); }
  finally { registrationSubmitting = false; button.disabled = true; button.textContent = 'Keep me in the loop ↗'; registrationCaptcha.reset(); }
});
