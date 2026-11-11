import { test } from 'node:test';
import assert from 'node:assert/strict';
import { submitFormJson } from '../public/form-request.js';

test('form requests submit once and preserve the server confirmation', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), { email: 'synthetic@example.test' });
    assert.ok(options.signal instanceof AbortSignal);
    return new Response(JSON.stringify({ message: 'Saved.' }));
  });
  assert.equal((await submitFormJson('/api/register', { email: 'synthetic@example.test' })).message, 'Saved.');
  assert.equal(fetch.mock.callCount(), 1);
});

test('HTML outages and malformed confirmations show plain retry guidance', async t => {
  const fetch = t.mock.method(globalThis, 'fetch');
  for (const response of [new Response('<html>Bad gateway</html>', { status: 502 }), new Response('{}'), new Response('{"message":null}'), new Response('null'), new Response('{"error":42}', {status: 429})]) {
    fetch.mock.mockImplementation(async () => response);
    await assert.rejects(submitFormJson('/api/privacy', {}), /couldn’t confirm your submission/);
  }
});

test('validation, offline, and timeout errors remain actionable without retries', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response('{"error":"Please try again in an hour."}', { status: 429 }));
  await assert.rejects(submitFormJson('/api/privacy', {}), /try again in an hour/);
  fetch.mock.mockImplementation(async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(submitFormJson('/api/register', {}), /check your connection/);
  fetch.mock.mockImplementation(async () => { throw new DOMException('Internal detail', 'TimeoutError'); });
  await assert.rejects(submitFormJson('/api/register', {}), /took too long/);
  assert.equal(fetch.mock.callCount(), 3);
});
