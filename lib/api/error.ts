// src/lib/api/error.ts
import { ApiError } from "./client"

export type NormalizedError = {
  message: string
  status?: number
  body?: unknown
  isNetwork?: boolean
  isTimeout?: boolean
}

/** Convert any thrown error into a small UI-friendly shape (for toast/UI). */
export function normalizeError(err: unknown): NormalizedError {
  if (err instanceof ApiError) {
    const m = err.message || "API Error"
    return {
      message: m,
      status: err.status,
      body: err.body,
      isNetwork:
        typeof m === "string" &&
        (m.includes("Network") || m.includes("fetch") || err.status === 0),
      isTimeout: typeof m === "string" && m.toLowerCase().includes("timeout"),
    }
  }

  if (err instanceof Error) {
    const msg = err.message || "Unknown error"
    return {
      message:
        msg.includes("Failed to fetch") || msg.includes("Network")
          ? "Network error. Check your connection."
          : msg,
      isNetwork: msg.includes("Failed to fetch") || msg.includes("Network"),
      isTimeout: msg.toLowerCase().includes("timeout"),
    }
  }

  return { message: "Unknown error" }
}

/** Options controlling legacyReturn output shape. */
export type LegacyOpts = {
  /** if true returns seller-style { status_code, message, record } when fallbackRecord provided */
  sellerStyle?: boolean
  /** key to use for message in legacy object: "message" or "error" */
  messageKey?: "message" | "error"
}

/** Convert anything into ApiError and throw it (canonical thrown error). */
export function wrapAndThrow(err: unknown): never {
  if (err instanceof ApiError) throw err

  if (err instanceof Error) {
    const anyErr = err as any
    const status = typeof anyErr.status === "number" ? anyErr.status : undefined
    const body = anyErr.body !== undefined ? anyErr.body : undefined
    throw new ApiError(err.message || "Unknown API error", status, body)
  }

  if (typeof err === "object" && err !== null) {
    const e = err as any
    const msg = typeof e.message === "string" ? e.message : String(e ?? "Unknown API error")
    const status = typeof e.status === "number" ? e.status : undefined
    const body = e.body !== undefined ? e.body : undefined
    throw new ApiError(msg, status, body)
  }

  throw new ApiError(String(err ?? "Unknown API error"), undefined, undefined)
}
