// AbortController also works in browsers without AbortSignal.timeout(). Keep
// the timer through response-body parsing and release it on every outcome.
export async function withRequestDeadline(milliseconds, operation) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), milliseconds);
  try { return await operation(controller.signal); }
  finally { clearTimeout(timer); }
}
