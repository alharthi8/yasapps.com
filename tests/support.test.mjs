import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import Stripe from 'stripe';
import { supportConfiguration, supportEventSummary } from '../lib/support.js';
import webhook from '../api/stripe-webhook.js';

const testLink = 'https://buy.stripe.com/test_eVq6oJ0CUbUU07pfmT1ck00';
const linkId = 'plink_1UagcQQURZVeJIpYCFRIwQPS';
const settings = { STRIPE_SUPPORT_ENABLED: 'true', STRIPE_SUPPORT_MODE: 'test', STRIPE_SUPPORT_URL: testLink, STRIPE_SUPPORT_PAYMENT_LINK_ID: linkId };
const secret = 'whsec_unit_test_fixture_only';
const event = { id: 'evt_test_fixture', type: 'checkout.session.completed', livemode: false, data: { object: { mode: 'payment', payment_link: linkId, payment_status: 'paid' } } };

test('support checkout stays closed until configured and never exposes a sandbox link in production', () => {
  assert.equal(supportConfiguration({}).enabled, false);
  assert.equal(supportConfiguration(settings).url, testLink);
  assert.equal(supportConfiguration({ ...settings, VERCEL_ENV: 'production' }).enabled, false);
  assert.equal(supportConfiguration({ ...settings, NODE_ENV: 'production' }).enabled, false);
  assert.equal(supportConfiguration({ ...settings, VERCEL_ENV: 'preview', NODE_ENV: 'production' }).mode, 'test');
  assert.equal(supportConfiguration({ ...settings, STRIPE_SUPPORT_MODE: 'live', STRIPE_SUPPORT_URL: testLink.replace('test_', '') }).enabled, false);
});

test('only a correctly paired Stripe link and mode can be published', () => {
  for (const url of ['https://buy.stripe.com.attacker.test/test_abc', 'http://buy.stripe.com/test_abc', 'https://u:p@buy.stripe.com/test_abc', 'https://buy.stripe.com:444/test_abc', `${testLink}?redirect=evil`, 'https://buy.stripe.com/liveabc']) {
    assert.equal(supportConfiguration({ ...settings, STRIPE_SUPPORT_URL: url }).enabled, false, url);
  }
  const live = supportConfiguration({ ...settings, VERCEL_ENV: 'production', STRIPE_SUPPORT_MODE: 'live', STRIPE_SUPPORT_URL: testLink.replace('test_', ''), STRIPE_WEBHOOK_SECRET: secret });
  assert.equal(live.mode, 'live');
  assert.ok(!JSON.stringify(live).includes(secret));
});

test('event summary ignores other links, environments and subscriptions; unpaid checkout remains pending', () => {
  assert.equal(supportEventSummary(event, settings).status, 'paid');
  assert.equal(supportEventSummary({ ...event, livemode: true }, settings), null);
  assert.equal(supportEventSummary({ ...event, type: 'customer.subscription.updated' }, settings), null);
  const session = event.data.object;
  assert.equal(supportEventSummary({ ...event, data: { object: { ...session, payment_link: 'plink_other' } } }, settings), null);
  assert.equal(supportEventSummary({ ...event, data: { object: { ...session, payment_status: 'unpaid' } } }, settings).status, 'pending');
  assert.equal(supportEventSummary({ ...event, type: 'checkout.session.async_payment_failed' }, settings).status, 'failed');
});

async function deliver(payload, signature, headers = {}) {
  const req = Readable.from([Buffer.from(payload)]);
  req.method = 'POST'; req.headers = { 'stripe-signature': signature, ...headers };
  const res = { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await webhook(req, res);
  return res;
}

test('webhook verifies raw bytes, rejects tampering and stale signatures, and safely acknowledges duplicates', async t => {
  const names = ['STRIPE_WEBHOOK_SECRET', 'STRIPE_SUPPORT_MODE', 'STRIPE_SUPPORT_PAYMENT_LINK_ID'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  Object.assign(process.env, { STRIPE_WEBHOOK_SECRET: secret, STRIPE_SUPPORT_MODE: 'test', STRIPE_SUPPORT_PAYMENT_LINK_ID: linkId });
  t.after(() => { for (const name of names) { if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name]; } });
  const log = t.mock.method(console, 'info', () => {});
  const payload = JSON.stringify(event);
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  assert.equal((await deliver(payload, signature)).code, 200);
  assert.equal((await deliver(payload, signature)).code, 200);
  assert.equal(log.mock.calls[0].arguments[1].status, 'paid');
  assert.equal((await deliver(payload + ' ', signature)).code, 400);
  const stale = Stripe.webhooks.generateTestHeaderString({ payload, secret, timestamp: Math.floor(Date.now() / 1000) - 600 });
  assert.equal((await deliver(payload, stale)).code, 400);
  assert.equal((await deliver(payload, undefined)).code, 400);
  assert.equal((await deliver('x'.repeat(262145), signature)).code, 413);
  assert.equal((await deliver(payload, signature, { 'content-length': '262145' })).code, 413);
  delete process.env.STRIPE_WEBHOOK_SECRET;
  assert.equal((await deliver(payload, signature)).code, 503);
});
