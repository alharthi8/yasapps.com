import test from 'node:test';
import assert from 'node:assert/strict';
import { BROWSER_RELEASES, PIPELINE_PRODUCTS } from '../public/releases.js';
import { websiteDownloads } from '../lib/downloads.js';
import { validateRegistration } from '../lib/registration.js';

test('advertised platform availability matches the API download allowlist', () => {
  for (const [platform, release] of Object.entries(BROWSER_RELEASES)) {
    assert.equal(Boolean(websiteDownloads[`browser-${platform}`]), release.available, platform);
    if (release.available) assert.ok(websiteDownloads[`browser-${platform}`].url.includes(`/v${release.version}/`));
  }
  assert.deepEqual(Object.keys(websiteDownloads), ['browser-windows']);
  assert.deepEqual(PIPELINE_PRODUCTS.map(product => product.name), ['Yas Mail', 'Yas Connect', 'Yas Agent']);
});

test('each pipeline signup preference is accepted without silently changing the selected products', () => {
  const base = { email: 'supporter@example.test', platform: 'both', consent: true };
  for (const { id } of PIPELINE_PRODUCTS) assert.deepEqual(validateRegistration({ ...base, products: [id] }).value.products, [id]);
  const all = ['browser', 'mail', 'connect', 'agent'];
  assert.deepEqual(validateRegistration({ ...base, products: all }).value.products, all);
  assert.ok(validateRegistration({ ...base, products: [...all, 'unexpected'] }).error);
});
