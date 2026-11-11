import test from 'node:test';
import assert from 'node:assert/strict';
import { captchaConfiguration, verifyCaptcha } from '../lib/captcha.js';
import download from '../api/download.js';
import register from '../api/register.js';
import captchaConfig from '../api/captcha-config.js';

const env = { TURNSTILE_SITE_KEY: 'site_key_fixture', TURNSTILE_SECRET_KEY: 'secret_key_fixture' };
const success = { success: true, hostname: 'yasapps.com', action: 'download', cdata: 'browser-macos' };
const provider = data => async (url, options) => {
  assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  assert.equal(options.method, 'POST');
  assert.equal(JSON.parse(options.body).secret, env.TURNSTILE_SECRET_KEY);
  return { ok: true, json: async () => data };
};

test('CAPTCHA requires both keys and rejects official dummy credentials in production', () => {
  assert.equal(captchaConfiguration({}), null);
  assert.equal(captchaConfiguration({ TURNSTILE_SITE_KEY: 'site' }), null);
  assert.equal(captchaConfiguration({ ...env, NODE_ENV: 'production', TURNSTILE_SITE_KEY: '1x00000000000000000000AA' }), null);
});

test('missing and oversized tokens never reach the verification provider', async () => {
  const fetcher = () => { throw new Error('Should not call provider'); };
  for (const token of [undefined, '', {}, 'x'.repeat(2049)]) {
    assert.equal((await verifyCaptcha(token, 'register', { env, fetcher })).status, 400);
  }
  assert.equal((await verifyCaptcha('token', 'register', { env: {}, fetcher })).status, 503);
});

test('CAPTCHA binds successful tokens to the website, form action and selected download', async () => {
  const options = { env, fetcher: provider(success), cdata: 'browser-macos' };
  assert.deepEqual(await verifyCaptcha('token', 'download', options), { ok: true });
  for (const invalid of [{ ...success, success: false }, { ...success, success: 'true' }, { ...success, hostname: 'attacker.example' }, { ...success, action: 'register' }, { ...success, cdata: 'mail-windows' }, { ...success, action: undefined }]) {
    assert.equal((await verifyCaptcha('token', 'download', { ...options, fetcher: provider(invalid) })).status, 403);
  }
});

test('a rejected, expired or unreachable provider never opens the gate', async () => {
  for (const result of [{ success: false, 'error-codes': ['invalid-input-response'] }, { success: false, 'error-codes': ['timeout-or-duplicate'] }]) {
    assert.equal((await verifyCaptcha('token', 'download', { env, fetcher: provider(result) })).status, 403);
  }
  assert.equal((await verifyCaptcha('token', 'download', { env, fetcher: async () => { throw new Error('offline'); } })).status, 503);
  assert.equal((await verifyCaptcha('token', 'download', { env, fetcher: async () => ({ ok: false }) })).status, 503);
});

function response() { return { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
test('download and registration APIs enforce CAPTCHA even when JavaScript is bypassed', async t => {
  const previous = Object.fromEntries(Object.keys(env).map(name => [name, process.env[name]]));
  Object.assign(process.env, env);
  t.after(() => { for (const [name, value] of Object.entries(previous)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; } });
  let configuration = response(); captchaConfig({ method: 'GET' }, configuration);
  assert.deepEqual(configuration.body, { siteKey: env.TURNSTILE_SITE_KEY });
  const req = { method: 'POST', headers: { origin: 'https://yasapps.com' }, body: { product: 'browser', platform: 'macos' } };
  let res = response(); await download(req, res);
  assert.equal(res.code, 400); assert.equal(res.body.url, undefined);
  res = response(); await download({ ...req, method: 'GET' }, res); assert.equal(res.code, 405);
  res = response(); await download({ ...req, body: { product: 'browser', platform: 'windows' } }, res); assert.equal(res.code, 404);
  res = response(); await download({ ...req, headers: { origin: 'https://attacker.example' } }, res); assert.equal(res.code, 403);
  res = response(); await download({ ...req, body: JSON.stringify({ ...req.body, captchaToken: 'x'.repeat(5000) }) }, res); assert.equal(res.code, 413);
  res = response();
  await register({ ...req, body: { email: 'captcha-check@example.invalid', products: ['browser'], platform: 'macos', consent: true } }, res);
  assert.equal(res.code, 400); assert.match(res.body.error, /human verification/);
});

test('only a verified, purpose-bound token returns the pinned available release', async t => {
  const previous = Object.fromEntries(Object.keys(env).map(name => [name, process.env[name]]));
  Object.assign(process.env, env);
  t.after(() => { for (const [name, value] of Object.entries(previous)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; } });
  t.mock.method(globalThis, 'fetch', provider(success));
  const res = response();
  await download({ method: 'POST', headers: {}, body: { product: 'browser', platform: 'macos', captchaToken: 'test_token' } }, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.filename, 'Yas-Browser-0.4.7-macOS-Apple-Silicon-preview.zip');
  assert.match(res.body.url, /^https:\/\/github\.com\/alharthi8\/yas-browser\/releases\/download\/macos-v0\.4\.7\//);
});
