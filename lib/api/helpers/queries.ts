/**
 * Query string builders and small object utilities
 */

/**
 * Remove undefined/null values from an object (shallow).
 * Useful for building request bodies or query param objects.
 */
export function compactObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Partial<T> = {}
  for (const k of Object.keys(obj) as Array<keyof T>) {
    const v = obj[k]
    if (v === undefined || v === null) continue
    out[k] = v
  }
  return out
}

/**
 * Convert a simple object of query params into a query-string-friendly object.
 * The client.buildUrl already accepts an object, but sometimes we want to transform names.
 * This returns a new object with all values stringified (skipping empty/undefined).
 */
export function buildQueryParams(params?: Record<string, string | number | boolean | undefined | null>) {
  if (!params) return undefined
  const out: Record<string, string> = {}
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return
    out[k] = typeof v === "boolean" ? (v ? "1" : "0") : String(v)
  })
  return out
}

/**
 * Build a cookie header value for endpoints that require session cookies.
 * Accepts a map of cookie key -> value and returns a single header string.
 *
 * Example:
 *   buildCookieHeader({ frontend_lang: 'en_US', session_id: 'abc' })
 *   -> "frontend_lang=en_US; session_id=abc"
 */
export function buildCookieHeader(cookies?: Record<string, string | undefined | null>) {
  if (!cookies) return undefined
  const parts: string[] = []
  for (const [k, v] of Object.entries(cookies)) {
    if (v === undefined || v === null || v === "") continue
    parts.push(`${k}=${v}`)
  }
  return parts.length ? parts.join("; ") : undefined
}

/**
 * Small utility to convert camelCase keys to snake_case (shallow).
 * Some APIs expect snake_case in the body. Use only when needed.
 */
export function toSnakeCaseShallow<T extends Record<string, any>>(obj: T): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    const snake = k.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase())
    out[snake] = v
  }
  return out
}

/**
 * Default pagination helper. Returns the common shape we pass to buildQueryParams.
 * Keeps endpoint code readable:
 *   const q = defaultPagination(page, pageSize)
 *   const params = buildQueryParams({ ...q, search })
 */
export function defaultPagination(page?: number, pageSize?: number) {
  const p = Math.max(1, Math.floor(page ?? 1))
  const size = Math.max(1, Math.floor(pageSize ?? 10))
  return { page: p, limit: size }
}
