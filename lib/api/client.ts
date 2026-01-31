/* client.ts
   Central HTTP client for the app. Exports:
   - ApiError (throw this for caller-friendly errors)
   - buildUrl(basePath, path, params)
   - get<T>(path, options)
   - post<T>(path, body, options)
   - postForm<T>(path, formData, options) // for multipart/form-data
   - resetUnauthorizedHandler() // for testing purposes
   
   Usage: import { get, post, ApiError } from 'lib/api'
   
   Features:
   - Automatic 401 handling: On any 401 Unauthorized response, the client will:
     * Clear all authentication data from localStorage
     * Show a user-friendly toast notification
     * Redirect to /login page
     * Prevent multiple simultaneous redirects (singleton pattern)
   - To skip auto-logout for specific endpoints, use skipAuthRedirect: true in options
*/

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://api.msme-dashboard.com"

const DEFAULT_TIMEOUT = 1800_000 // ms
 
/**
 * 401 Unauthorized Handler
 * Uses centralized auth redirect utility for consistent behavior
 */
class UnauthorizedHandler {
  /**
   * Handle 401 Unauthorized response
   * Uses centralized redirect utility for consistent behavior across the app
   */
  async handleUnauthorized(): Promise<void> {
    // Use centralized redirect utility
    // Full reload ensures all state is cleared when API calls fail
    const { redirectToLogin } = await import('@/lib/services/auth-redirect')
    await redirectToLogin({
      fullReload: true,
      message: 'Your session has expired. Please log in again.',
    })
  }

  /**
   * Reset the handler state (useful for testing or manual resets)
   * Note: The actual reset is handled by the centralized redirect utility
   */
  reset(): void {
    // Reset is handled by the centralized redirect utility
    // This method kept for backward compatibility
  }
}

// Singleton instance
const unauthorizedHandler = new UnauthorizedHandler()

export class ApiError extends Error {
  public status?: number
  public body?: unknown
  constructor(message: string, status?: number, body?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

type RequestOptions = {
  headers?: Record<string,string>
  timeoutMs?: number
  expectJson?: boolean // set false for endpoints that return plain text or empty body
  includeAuth?: boolean // default true for authenticated endpoints
  cookieSession?: boolean // include session cookie (if you want to attach)
  skipAuthRedirect?: boolean // set true to skip automatic logout/redirect on 401
}

function getStoredAccessToken(): string | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const stored = localStorage.getItem("accessToken") || localStorage.getItem("authData")
    if (!stored) return undefined
    // if authData json, try parse
    if (stored.startsWith("{")) {
      try {
        const parsed = JSON.parse(stored)
        return parsed?.access_token || parsed?.token || parsed?.accessToken
      } catch { return undefined }
    }
    return stored
  } catch {
    return undefined
  }
}

function getSessionIdCookie(): string | undefined {
  if (typeof window === "undefined") return undefined
  return localStorage.getItem("sessionId") || undefined
}

function buildUrl(path: string, params?: Record<string,string|number|undefined>) {
  const url = new URL(path.startsWith("http") ? path : `${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k,v]) => {
      if (v !== undefined && v !== null && `${v}` !== "") url.searchParams.set(k, `${v}`)
    })
  }
  return url.toString()
}

async function timeoutRace<T>(promise: Promise<T>, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  const timeout = new Promise<never>((_, rej) => {
    timer = setTimeout(() => rej(new Error("Request timeout")), ms)
  })
  try {
    return await Promise.race([promise, timeout]) as T
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function parseResponse(res: Response, expectJson: boolean) {
  const ct = res.headers.get("content-type") || ""
  if (!expectJson) {
    // caller expects plain text / blob / empty
    const text = await res.text()
    return text
  }
  if (ct.includes("application/json") || ct.includes("+json")) {
    try {
      return await res.json()
    } catch (err) {
      // malformed json but status could be ok -> throw clear error
      const txt = await res.text().catch(() => "")
      throw new ApiError("Invalid JSON response from server", res.status, txt)
    }
  }
  // content-type is not json but caller expected json: return text and let caller decide
  const raw = await res.text()
  try {
    return JSON.parse(raw)
  } catch {
    throw new ApiError("Expected JSON response but got non-JSON", res.status, raw)
  }
}

async function defaultFetch(path: string, init: RequestInit, opts: RequestOptions = {}) {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT
  const expectJson = opts.expectJson ?? true
  const skipAuthRedirect = opts.skipAuthRedirect ?? false

  try {
    const fetchPromise = fetch(path, init)
    const res = await timeoutRace(fetchPromise, timeoutMs)

    if (!res.ok) {
      // Handle 401 Unauthorized - logout and redirect
      if (res.status === 401 && !skipAuthRedirect) {
        // Handle unauthorized asynchronously (don't await to avoid blocking)
        unauthorizedHandler.handleUnauthorized().catch(() => {
        })
      }

      // try to parse error body if JSON, else text
      let body: unknown = undefined
      try { body = await parseResponse(res, expectJson) } catch (e) { body = await res.text().catch(() => undefined) }
      const msg = (body && typeof body === "object" && (body as any).message) ? (body as any).message : `HTTP ${res.status}`
      throw new ApiError(msg, res.status, body)
    }

    return await parseResponse(res, expectJson)
  } catch (err) {
    if (err instanceof ApiError) throw err
    // network/type errors
    if (err instanceof Error && err.message === "Request timeout") {
      throw new ApiError("Network timeout. Try again.", undefined, undefined)
    }
    if (err instanceof TypeError && typeof window !== "undefined" && err.message.includes("Failed to fetch")) {
      throw new ApiError("Network error. Check your connection.", undefined, undefined)
    }
    throw new ApiError(err instanceof Error ? err.message : "Unknown network error")
  }
}

/* build headers: content-type controlled outside (json, text/plain, multipart)
   includeAuth default: true (so endpoints won't have to manually read localStorage all the time)
*/
function buildHeaders(customHeaders?: Record<string,string>, includeAuth = true, cookieSession = false) {
  const headers: Record<string,string> = {
    Accept: "application/json",
    ...(customHeaders || {})
  }

  if (includeAuth) {
    const token = getStoredAccessToken()
    if (token) headers["access-token"] = token
  }

  if (cookieSession) {
    const sessionId = getSessionIdCookie()
    if (sessionId) {
      const existingCookie = headers["Cookie"] || ""
      headers["Cookie"] = (existingCookie ? existingCookie + "; " : "") + `frontend_lang=en_US; session_id=${sessionId}`
    }
  }

  return headers
}

/* Public helpers: get, post, postForm
   - typed generic T for response body
   - all functions throw ApiError on failure
*/
export async function get<T = any>(
  path: string,
  params?: Record<string,string|number|undefined>,
  options?: RequestOptions
): Promise<T> {
  const url = buildUrl(path, params)
  const headers = buildHeaders(options?.headers, options?.includeAuth ?? true, options?.cookieSession ?? false)
  const init: RequestInit = {
    method: "GET",
    headers,
    credentials: "omit", // we're controlling cookies via headers if needed
  }
  return defaultFetch(url, init, { ...options, expectJson: options?.expectJson ?? true })
}

export async function del<T = any>(
  path: string,
  params?: Record<string,string|number|undefined>,
  options?: RequestOptions
): Promise<T> {
  const url = buildUrl(path, params)
  const headers = buildHeaders(options?.headers, options?.includeAuth ?? true, options?.cookieSession ?? false)
  const init: RequestInit = {
    method: "DELETE",
    headers,
    credentials: "omit",
  }
  return defaultFetch(url, init, { ...options, expectJson: options?.expectJson ?? true })
}

export async function post<T = any>(
  path: string,
  body?: unknown,
  options?: RequestOptions & { contentType?: "json" | "text" }
): Promise<T> {
  const url = buildUrl(path)
  const contentType = options?.contentType ?? "json"
  const headers = buildHeaders({
    "Content-Type": contentType === "json" ? "application/json" : "text/plain",
    ...(options?.headers || {})
  }, options?.includeAuth ?? true, options?.cookieSession ?? false)

  const init: RequestInit = {
    method: "POST",
    headers,
    body: contentType === "json" ? JSON.stringify(body ?? {}) : (typeof body === "string" ? body : JSON.stringify(body ?? {})),
    credentials: "omit",
  }

  return defaultFetch(url, init, { ...options, expectJson: options?.expectJson ?? true })
}

/* For file uploads */
export async function postForm<T = any>(
  path: string,
  form: FormData,
  options?: RequestOptions
): Promise<T> {
  const url = buildUrl(path)
  // do NOT set Content-Type header; browser sets boundary for multipart
  const headers = buildHeaders({ ...(options?.headers || {}) }, options?.includeAuth ?? true, options?.cookieSession ?? false)
  const init: RequestInit = {
    method: "POST",
    headers,
    body: form,
    credentials: "omit",
  }
  return defaultFetch(url, init, { ...options, expectJson: options?.expectJson ?? true })
}

/* Optional small helper to call safe endpoints (return undefined instead of throwing)
   e.g. const data = await tryGet('/maybe', params)
*/
export async function tryGet<T = any>(...args: Parameters<typeof get>) {
  try { return await get<T>(...args) } catch (e) { return undefined }
}

/**
 * Reset the unauthorized handler state
 * Useful for testing or when you need to manually reset the redirect prevention
 * @internal
 */
export function resetUnauthorizedHandler(): void {
  unauthorizedHandler.reset()
}
