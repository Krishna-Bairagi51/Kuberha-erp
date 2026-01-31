// Chat Storage Utilities
// Moved from lib/api/helpers/chat.ts

import type { ChatMessage } from '../types/chat.types'

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

