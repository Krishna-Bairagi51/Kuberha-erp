// Chat Feature Hook
// Custom hooks for chat data management

import { useState, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { chatService } from '../services/chat.service'
import { setRetailerId } from '../utils/retailer-id'
import { getUid } from '@/lib/api/helpers/auth'
import { useChatList } from './use-chat-list'
import { queryKeys } from '@/lib/query/query-client'
import type { ChatMessage, ChatThread, UseChatOptions, UseChatReturn } from '../types/chat.types'
import type { ChatMessageItem } from '@/types/domains/chatbot'

// ============================================================================
// useChat Hook
// ============================================================================

/**
 * Custom hook for chat functionality
 * 
 * @example
 * ```tsx
 * const { messages, sendMessage, loadThread } = useChat()
 * ```
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { autoInitialize = true } = options
  const queryClient = useQueryClient()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  
  // Use React Query hook for chat list
  const { data: threads = [], isLoading: isLoadingThreads } = useChatList()

  // Initialize retailer ID
  useEffect(() => {
    if (autoInitialize) {
      const uid = getUid()
      if (uid) {
        setRetailerId(String(uid))
      } else {
        const existingRetailerId = typeof window !== "undefined" ? sessionStorage.getItem("r_id") : null
        if (!existingRetailerId) {
          setRetailerId("default_retailer")
        }
      }
    }
  }, [autoInitialize])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const currentConversationId = conversationId
    setIsLoading(true)
    setError(null)

    // Add user message immediately
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: text, status: "read" },
    ])

    try {
      const response = await chatService.sendMessage(text, currentConversationId)

      if (response.success && response.data) {
        if (response.data.session_id && !conversationId) {
          setConversationId(response.data.session_id)
        }

        const assistantMessage: ChatMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: response.data.response || response.data.answer || "",
          imageUrl: response.data.image,
          animate: true,
        }

        if (response.data.img_json) {
          assistantMessage.chartData = {
            answer: response.data.answer || response.data.response || "",
            chart: response.data.chart || "chart",
            img_json: response.data.img_json,
          }
        }

        setMessages((prev) => [...prev, assistantMessage])
      } else {
        setError(response.error || "Failed to send message")
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: `Sorry, I encountered an error: ${response.error || "Unknown error occurred"}`,
          },
        ])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message")
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, isLoading])

  const loadThread = useCallback(async (thread: ChatThread) => {
    setConversationId(thread.session_id)
    setIsLoading(true)
    setError(null)
    setMessages([])

    try {
      const result = await chatService.getChatMessages(thread.session_id)

      if (result.success && result.data) {
        const loadedMessages: ChatMessage[] = result.data.map((record: ChatMessageItem, idx: number) => ({
          id: `${record.is_sender ? "user" : "assistant"}-${thread.session_id}-${idx}`,
          role: record.is_sender ? "user" : "assistant",
          content: record.answer,
          status: record.is_sender ? "read" : undefined,
          imageUrl: record.is_sender
            ? (record.upload_image_list && record.upload_image_list.length > 0 ? record.upload_image_list[0] : undefined)
            : record.image || undefined,
        }))
        setMessages(loadedMessages)
      } else {
        setError(result.error || "Failed to load messages")
        setMessages([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages")
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const startNewChat = useCallback(() => {
    setMessages([])
    setConversationId(undefined)
    setIsLoading(false)
    setError(null)
  }, [])

  const fetchThreads = useCallback(async () => {
    // Chat list is now managed by React Query
    // Invalidate the cache to trigger a refetch
    await queryClient.invalidateQueries({ queryKey: queryKeys.chat.list() })
  }, [queryClient])

  return {
    messages,
    threads,
    isLoading,
    isLoadingThreads,
    conversationId,
    error,
    sendMessage,
    loadThread,
    startNewChat,
    fetchThreads,
  }
}

