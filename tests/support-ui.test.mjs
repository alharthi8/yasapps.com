import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = (await readFile(new URL('../public/support.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\r?\n/, '').replace(/loadSupport\(\);\s*$/, '');

async function show(settings, response = {}) {
  const status = { textContent: '', classList: { toggle() {} } };
  const checkout = { hidden: true };
  const context = vm.createContext({
    URL, document: { querySelector: selector => selector === '#support-status' ? status : checkout },
    withRequestDeadline: async (_, operation) => operation(undefined),
    fetch: async () => ({ ok: true, json: async () => settings, ...response }),
  });
  await vm.runInContext(source + '\nloadSupport()', context);
  return { status, checkout };
}

test('support page explains unavailable checkout without creating a payment link', async () => {
  const view = await show({ enabled: false, message: 'Waiting for payment account activation.' });
  assert.equal(view.status.textContent, 'Waiting for payment account activation.');
  assert.equal(view.checkout.hidden, true);
  assert.equal(view.checkout.href, undefined);
});

test('support page shows actionable errors for outages and malformed settings', async () => {
  for (const [settings, response] of [[null, {}], [{}, { ok: false }], [null, { json: async () => { throw new Error('invalid JSON'); } }]]) {
    const view = await show(settings, response);
    assert.match(view.status.textContent, /refresh to try again/);
    assert.equal(view.checkout.hidden, true);
  }
});

test('support checkout opens only the correctly paired Stripe destination', async () => {
  for (const url of ['https://buy.stripe.com.attacker.test/a', 'https://u:p@buy.stripe.com/a', 'https://buy.stripe.com/a?redirect=bad', 'https://buy.stripe.com/test_abc']) {
    assert.equal((await show({ enabled: true, mode: 'live', url })).checkout.hidden, true);
  }
  const live = await show({ enabled: true, mode: 'live', url: 'https://buy.stripe.com/abc', message: 'Choose your amount.' });
  assert.equal(live.checkout.hidden, false);
  assert.equal(live.checkout.href, 'https://buy.stripe.com/abc');
  assert.match(live.checkout.textContent, /Support the community/);
  const sandbox = await show({ enabled: true, mode: 'test', url: 'https://buy.stripe.com/test_abc', message: 'Sandbox only.' });
  assert.match(sandbox.checkout.textContent, /sandbox/);
});
