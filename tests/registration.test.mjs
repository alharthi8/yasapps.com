import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRegistration } from '../lib/registration.js';
const valid = { email: ' Person+yas@Example.com ', products: ['mail', 'browser'], platform: 'macos', consent: true };
test('normalizes email and preserves explicit preferences', () => { const r = validateRegistration(valid); assert.equal(r.value.email, 'person+yas@example.com'); assert.deepEqual(r.value.products, ['mail', 'browser']); });
test('requires consent rather than accepting truthy text', () => { assert.ok(validateRegistration({ ...valid, consent: 'true' }).error); assert.ok(validateRegistration({ ...valid, consent: false }).error); });
test('rejects malformed addresses, unknown products and platforms', () => { for (const email of ['x', 'a@b', 'a@b..com', 'a b@x.com', 'x\n@y.com']) assert.ok(validateRegistration({ ...valid, email }).error); assert.ok(validateRegistration({ ...valid, products: ['unknown'] }).error); assert.ok(validateRegistration({ ...valid, products: [] }).error); assert.ok(validateRegistration({ ...valid, platform: 'other' }).error); });
test('handles invalid payloads and honeypot', () => { for (const value of [null, [], 'text']) assert.ok(validateRegistration(value).error); assert.ok(validateRegistration({ ...valid, website: 'bot' }).bot); });
