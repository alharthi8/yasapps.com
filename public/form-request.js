export async function submitFormJson(url, body) {
  let response;
  try {
    response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(25000)
    });
  } catch (error) {
    throw new Error(error.name === 'TimeoutError' || error.name === 'AbortError'
      ? 'The request took too long. Please try again.'
      : 'Please check your connection and try again.');
  }
  const fallback = 'We couldn’t confirm your submission. Please try again shortly.';
  let data;
  try { data = await response.json(); } catch { throw new Error(fallback); }
  const validText = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 500;
  if (!response.ok) throw new Error(validText(data?.error) ? data.error : fallback);
  if (!validText(data?.message)) throw new Error(fallback);
  return data;
}
