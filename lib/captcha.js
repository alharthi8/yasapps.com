export function captchaConfiguration(env = process.env) {
  const siteKey = env.TURNSTILE_SITE_KEY?.trim();
  const secretKey = env.TURNSTILE_SECRET_KEY?.trim();
  if (!siteKey || !secretKey) return null;
  const production = env.VERCEL_ENV === 'production' || env.NODE_ENV === 'production';
  if (production && [siteKey, secretKey].some(key => /^[123]x0000/.test(key))) return null;
  return { siteKey, secretKey };
}

export async function verifyCaptcha(token, action, { env = process.env, fetcher = fetch, cdata } = {}) {
  const keys = captchaConfiguration(env);
  if (!keys) return { ok: false, status: 503, error: 'Verification is temporarily unavailable. Please try again shortly.' };
  if (typeof token !== 'string' || !token || token.length > 2048) return { ok: false, status: 400, error: 'Please complete the human verification and try again.' };
  try {
    const response = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: keys.secretKey, response: token }), signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('Verification service unavailable');
    const result = await response.json();
    const hosts = new Set(['yasapps.com', 'www.yasapps.com']);
    if (env.VERCEL_ENV === 'preview' && env.VERCEL_URL) hosts.add(env.VERCEL_URL);
    if (result.success !== true || !hosts.has(result.hostname) || result.action !== action || (cdata !== undefined && result.cdata !== cdata)) {
      return { ok: false, status: 403, error: 'Verification expired or could not be confirmed. Please verify again.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 503, error: 'Verification could not be reached. Please try again shortly.' };
  }
}
