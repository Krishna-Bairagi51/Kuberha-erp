// Retailer ID Utilities
// Moved from lib/api/helpers/chat.ts

/**
 * Get retailer id (uid) from localStorage/sessionStorage safely.
 * Returns a string id or "default_retailer" when unavailable.
 */
export function getRetailerId(): string {
  if (typeof window === "undefined") return "default_retailer"

  // First try authData in localStorage
  try {
    const authData = localStorage.getItem("authData")
    if (authData) {
      try {
        const parsed = JSON.parse(authData)
        if (parsed && parsed.uid) return String(parsed.uid)
      } catch {
        // ignore parse error - fallthrough to sessionStorage
      }
    }
  } catch {
    // localStorage read failed - fall through
  }

  // Try to get uid directly from localStorage
  try {
    const uid = localStorage.getItem("uid")
    if (uid && uid !== "null" && uid !== "undefined") {
      return uid
    }
  } catch {
    // ignore error - fall through
  }

  try {
    const retailerId = sessionStorage.getItem("r_id")
    return retailerId || "default_retailer"
  } catch {
    return "default_retailer"
  }
}

/**
 * Build the keys used to store chatbot session info in localStorage.
 */
export function getChatbotSessionKeys(uid: string) {
  const safeUid = uid || "default_retailer"
  return {
    sessionKey: `chatbot:session:${safeUid}`,
    activeKey: `chatbotSessionActive:${safeUid}`,
  }
}

/**
 * Read stored chat session id from localStorage if present.
 */
export function getChatSessionId(): string | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const uid = getRetailerId()
    const { sessionKey } = getChatbotSessionKeys(uid)
    return localStorage.getItem(sessionKey) || undefined
  } catch {
    return undefined
  }
}

/**
 * Check whether a chatbot session is marked active.
 */
export function isChatbotSessionActive(): boolean {
  if (typeof window === "undefined") return false
  try {
    const uid = getRetailerId()
    const { activeKey } = getChatbotSessionKeys(uid)
    return localStorage.getItem(activeKey) === "true"
  } catch {
    return false
  }
}

/**
 * Persist retailer id in sessionStorage and set a default inactive flag for chatbot session.
 */
export function setRetailerId(retailerId: string): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem("r_id", retailerId)
  } catch {
    // ignore
  }

  try {
    const lastRetailer = localStorage.getItem("chatbot:lastRetailer")
    if (lastRetailer !== retailerId) {
      localStorage.setItem("chatbot:lastRetailer", retailerId)
      const { activeKey } = getChatbotSessionKeys(retailerId)
      localStorage.setItem(activeKey, "false")
    }
  } catch {
    // ignore
  }
}

