import { test } from 'node:test';
import assert from 'node:assert/strict';
import register from '../api/register.js';
import privacy from '../api/privacy.js';
import { parseBoundedJson } from '../lib/request-body.js';

async function request(handler, body, headers = {}, method = 'POST') {
  const response = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(value) { this.body = value; } };
  await handler({ method, headers, body }, response);
  return response;
}

for (const [name, handler, limit] of [['registration', register, 4096], ['privacy', privacy, 2048]]) {
  test(`${name} enforces real payload bytes with absent or inaccurate Content-Length`, async () => {
    const body = { website: '🧪'.repeat(limit / 4) };
    for (const encoded of [body, JSON.stringify(body), Buffer.from(JSON.stringify(body))]) {
      for (const headers of [{}, { 'content-length': '1' }]) assert.equal((await request(handler, encoded, headers)).code, 413);
    }
  });
  test(`${name} rejects malformed JSON and non-object payloads before storage`, async () => {
    for (const body of [undefined, null, [], 42, '"string"', '{', 'null', '[]']) assert.equal((await request(handler, body)).code, 400);
  });
  test(`${name} blocks cross-origin submissions and unsupported methods`, async () => {
    assert.equal((await request(handler, { website: 'bot' }, { origin: 'https://untrusted.example' })).code, 403);
    const response = await request(handler, undefined, {}, 'GET');
    assert.equal(response.code, 405);
    assert.equal(response.headers.Allow, 'POST');
    assert.equal(response.headers['Cache-Control'], 'no-store');
    assert.equal((await request(handler, { website: 'bot' })).code, 200);
  });
}

test('body admission measures UTF-8 at the exact boundary', () => {
  const source = JSON.stringify({ website: '🧪' });
  const bytes = Buffer.byteLength(source);
  assert.deepEqual(parseBoundedJson(source, bytes).value, { website: '🧪' });
  assert.equal(parseBoundedJson(source, bytes - 1).tooLarge, true);
});
