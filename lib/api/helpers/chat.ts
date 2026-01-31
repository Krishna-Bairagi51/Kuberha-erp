/**
 * @deprecated Chatbot session keys and storage helpers
 * 
 * MIGRATION GUIDE:
 * - Use chat utilities from '@/components/features/chat/utils/retailer-id'
 * - Use chat storage from '@/components/features/chat/utils/chat-storage'
 * - Use chat service from '@/components/features/chat/services/chat.service'
 * 
 * This file is kept for backward compatibility but will be removed in a future version.
 */

import type { ChatMessage } from "@/components/features/chat/types/chat.types"

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

const CHAT_STORAGE_KEY = "kuberbot_messages"
const CONVERSATION_ID_KEY = "kuberbot_conversation_id"

/**
 * Chat storage utility for managing chat messages and conversation IDs in sessionStorage.
 */
export const chatStorage = {
  // Save messages to session storage
  saveMessages: (messages: ChatMessage[]): void => {
    if (typeof window === "undefined") return
    try {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
    } catch (error) {
    }
  },

  // Load messages from session storage
  loadMessages: (): ChatMessage[] => {
    if (typeof window === "undefined") return []
    try {
      const stored = sessionStorage.getItem(CHAT_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
    }

    // Return default welcome message if no stored messages
    return [
      {
        id: "a-0",
        role: "assistant",
        content:
          "Hi there! 👋 I'm KuberhaBot, here to help you with billing, purchases, inventory, and more. How can I assist you today?",
        ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]
  },

  // Save conversation ID
  saveConversationId: (conversationId: string): void => {
    if (typeof window === "undefined") return
    try {
      sessionStorage.setItem(CONVERSATION_ID_KEY, conversationId)
    } catch (error) {
    }
  },

  // Load conversation ID
  loadConversationId: (): string | undefined => {
    if (typeof window === "undefined") return undefined
    try {
      return sessionStorage.getItem(CONVERSATION_ID_KEY) || undefined
    } catch (error) {
      return undefined
    }
  },

  // Clear all chat data
  clearChat: (): void => {
    if (typeof window === "undefined") return
    try {
      sessionStorage.removeItem(CHAT_STORAGE_KEY)
      sessionStorage.removeItem(CONVERSATION_ID_KEY)
    } catch (error) {
    }
  },
}
