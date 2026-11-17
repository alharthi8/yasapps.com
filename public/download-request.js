import { submitFormJson } from './form-request.js';

export function confirmedDownloadUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'github.com' && !url.port &&
      !url.username && !url.password && !url.search && !url.hash &&
      /^\/alharthi8\/yas-browser\/releases\/download\/[^/]+\/[^/]+$/.test(url.pathname)
      ? url.href : null;
  } catch { return null; }
}

export async function requestDownload(body) {
  const result = await submitFormJson('/api/download', body, {
    timeoutMs: 15000,
    failureMessage: 'We couldn’t confirm your download. Please try again shortly.',
    validateSuccess: data => Boolean(confirmedDownloadUrl(data?.url))
  });
  return confirmedDownloadUrl(result.url);
}
