export const CONSENT_VERSION = '2026-11-09-v1';

export function validateRegistration(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Please complete the registration form.' };
  if (body.website) return { bot: true };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@\x00-\x1f]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email)) return { error: 'Please enter a valid email address.' };
  if (body.consent !== true) return { error: 'Please agree to receive Yas product and beta updates.' };
  const choices = new Set(['mail', 'browser']);
  if (!Array.isArray(body.products) || body.products.length === 0 || body.products.length > 2 || body.products.some(p => !choices.has(p))) return { error: 'Choose at least one product.' };
  if (!['windows', 'macos', 'both'].includes(body.platform)) return { error: 'Choose your operating system.' };
  return { value: { email, products: [...new Set(body.products)], platform: body.platform, consentVersion: CONSENT_VERSION } };
}
