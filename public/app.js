const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
menu?.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); nav.classList.toggle('open', open); });
nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation'); }));

function setPlatform(platform) {
  document.querySelectorAll('[data-platform]').forEach(button => { const selected = button.dataset.platform === platform; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); });
  document.querySelectorAll('.windows-download').forEach(a => a.hidden = platform !== 'windows');
  document.querySelectorAll('.mac-download').forEach(a => a.hidden = platform !== 'macos');
  document.querySelectorAll('.release-meta').forEach(meta => { const card = meta.closest('[data-download-card]').dataset.downloadCard; meta.children[0].textContent = platform === 'macos' ? 'In the roadmap' : card === 'browser' ? 'v0.4.5 preview' : 'v0.3.0 preview'; meta.children[1].textContent = platform === 'macos' ? 'macOS · Not yet available' : card === 'browser' ? 'Windows x64 · 7.1 MB' : 'Windows x64 · 4.7 MB'; });
}
document.querySelectorAll('[data-platform]').forEach(button => button.addEventListener('click', () => setPlatform(button.dataset.platform)));
document.querySelectorAll('[data-select-product]').forEach(a => a.addEventListener('click', () => { setPlatform('windows'); document.querySelectorAll('[data-download-card]').forEach(card => card.classList.toggle('highlight', card.dataset.downloadCard === a.dataset.selectProduct)); }));
document.querySelectorAll('[data-register-product]').forEach(a => a.addEventListener('click', () => { document.querySelector('#platform').value = 'macos'; document.querySelectorAll('[name=product]').forEach(input => input.checked = input.value === a.dataset.registerProduct); }));

function openDialog(id) { const dialog = document.getElementById(id); if (dialog instanceof HTMLDialogElement && !dialog.open) dialog.showModal(); }
document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => openDialog(button.dataset.dialog)));
document.querySelectorAll('a[href="#browser-details"],a[href="#mail-details"]').forEach(a => a.addEventListener('click', event => { event.preventDefault(); openDialog(a.hash.slice(1)); }));
document.querySelectorAll('dialog').forEach(dialog => { dialog.querySelector('.close-dialog')?.addEventListener('click', () => dialog.close()); dialog.addEventListener('click', event => { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); }); });

const form = document.querySelector('#registration-form');
form?.addEventListener('submit', async event => {
  event.preventDefault();
  const status = document.querySelector('#form-status');
  const products = [...form.querySelectorAll('[name=product]:checked')].map(input => input.value);
  status.classList.remove('error');
  if (!products.length) { status.textContent = 'Choose at least one Yas app.'; status.classList.add('error'); form.querySelector('[name=product]').focus(); return; }
  const button = form.querySelector('button[type=submit]');
  button.disabled = true; button.textContent = 'Saving your place…'; status.textContent = '';
  try {
    const response = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email.value, products, platform: form.platform.value, consent: form.consent.checked, website: form.website.value }), signal: AbortSignal.timeout(25000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Registration could not be saved. Please try again.');
    status.textContent = data.message; form.email.value = ''; form.consent.checked = false;
  } catch (error) { status.textContent = error.name === 'TimeoutError' ? 'The request took too long. Please try again.' : error.message || 'Please check your connection and try again.'; status.classList.add('error'); }
  finally { button.disabled = false; button.textContent = 'Keep me in the loop ↗'; }
});
