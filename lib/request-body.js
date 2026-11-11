// Check actual UTF-8 bytes: Content-Length can be absent or inaccurate.
export function parseBoundedJson(body, maxBytes) {
  try {
    const source = Buffer.isBuffer(body) ? body.toString('utf8') : typeof body === 'string' ? body : JSON.stringify(body);
    if (typeof source !== 'string') return { invalid: true };
    if (Buffer.byteLength(source, 'utf8') > maxBytes) return { tooLarge: true };
    const value = JSON.parse(source);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { invalid: true };
    return { value };
  } catch {
    return { invalid: true };
  }
}
