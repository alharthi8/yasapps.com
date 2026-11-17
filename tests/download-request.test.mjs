import { test } from 'node:test';
import assert from 'node:assert/strict';
import { confirmedDownloadUrl, requestDownload } from '../public/download-request.js';
const release = 'https://github.com/alharthi8/yas-browser/releases/download/v0.4.9/Yas-0.4.9-Setup-x64.exe';
test('download destination accepts release assets and rejects malformed or alternate destinations', () => {
  assert.equal(confirmedDownloadUrl(release), release);
  for (const value of [null, {}, '/relative', 'javascript:alert(1)', release.replace('https:', 'http:'), release.replace('github.com','github.com.evil.test'), release.replace('github.com','github.com:8443'), release.replace('github.com','user:secret@github.com'), release+'?redirect=other',release+'#other',release.replace('/download/', '/download-extra/'), 'https://github.com/alharthi8/yas-browser/releases/download/']) assert.equal(confirmedDownloadUrl(value), null, String(value));
});
test('download request validates confirmation and sends exactly one verification request', async t => {
  const fetch=t.mock.method(globalThis,'fetch',async (url,options)=>{
    assert.equal(url,'/api/download');assert.equal(options.method,'POST');assert.deepEqual(JSON.parse(options.body),{product:'browser',platform:'windows',captchaToken:'synthetic'});assert.ok(options.signal instanceof AbortSignal);
    return new Response(JSON.stringify({url:release}));
  });
  assert.equal(await requestDownload({product:'browser',platform:'windows',captchaToken:'synthetic'}),release);assert.equal(fetch.mock.callCount(),1);
});
test('HTML failures and malformed download successes provide retry guidance',async t=>{
  const fetch=t.mock.method(globalThis,'fetch');
  for(const response of [new Response('<html>upstream failed</html>',{status:502}),new Response('null'),new Response('{}'),new Response(JSON.stringify({url:'https://evil.test/payload'})),new Response('{"error":{}}',{status:503})]) {
    fetch.mock.mockImplementation(async()=>response);await assert.rejects(requestDownload({}),/confirm your download.*try again/);
  }
});
test('download connection, timeout and server errors remain actionable without automatic retries',async t=>{
  const fetch=t.mock.method(globalThis,'fetch',async()=>{throw new TypeError('Failed to fetch')});
  await assert.rejects(requestDownload({}),/check your connection/);
  fetch.mock.mockImplementation(async()=>{throw new DOMException('internal','TimeoutError')});await assert.rejects(requestDownload({}),/took too long/);
  fetch.mock.mockImplementation(async()=>new Response('{"error":"Please complete verification again."}',{status:400}));await assert.rejects(requestDownload({}),/complete verification again/);assert.equal(fetch.mock.callCount(),3);
});
