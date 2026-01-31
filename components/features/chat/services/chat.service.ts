// Chat Feature Service
// Consolidated API calls for chat management

import { sendMessage, getChatList, getChatMessages } from '@/lib/api/endpoints/chatbot'
import type { ChatListItem, ChatMessageItem } from '@/types/domains/chatbot'

// ============================================================================
// Chat APIs
// ============================================================================

/**
 * Send a message to the chatbot
 */
export async function sendChatMessage(
  message: string,
  conversationId?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    return await sendMessage(message, conversationId)
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to send message' }
  }
}

/**
 * Get list of chat conversations
 */
export async function getChatConversations(): Promise<{ success: boolean; data?: ChatListItem[]; error?: string }> {
  try {
    return await getChatList()
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch chat list' }
  }
}

/**
 * Get messages for a specific conversation
 */
export async function getConversationMessages(
  sessionId: string
): Promise<{ success: boolean; data?: ChatMessageItem[]; error?: string }> {
  try {
    return await getChatMessages(sessionId)
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch messages' }
  }
}

// ============================================================================
// Export all as chatService object
// ============================================================================

export const chatService = {
  sendMessage: sendChatMessage,
  getChatList: getChatConversations,
  getChatMessages: getConversationMessages,
}

