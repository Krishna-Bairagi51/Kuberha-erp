/**
 * Small retry helper for transient operations. Retries fn up to attempts times with delayMs between tries.
 * fn should throw on failure. Returns the resolved value or rethrows last error.
 *
 * Use sparingly for idempotent GETs or requests that may transiently fail.
 */
export async function retry<T>(fn: () => Promise<T>, attempts = 2, delayMs = 400): Promise<T> {
  let lastErr: any
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs))
      }
    }
  }
  throw lastErr
}
