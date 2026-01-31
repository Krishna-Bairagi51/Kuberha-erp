// React Query hook for chat list with optimistic updates
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getChatList, sendMessage } from '@/lib/api/endpoints/chatbot'
import { queryKeys } from '@/lib/query/query-client'
import type { ChatListItem } from '@/types/domains/chatbot'
import type { ChatThread } from '../types/chat.types'

/**
 * Hook to fetch chat list with React Query
 * Includes automatic refetching and caching
 */
export function useChatList() {
  return useQuery({
    queryKey: queryKeys.chat.list(),
    queryFn: async () => {
      const result = await getChatList()
      if (result.success && result.data) {
        // Map ChatListItem to ChatThread format and sort by id descending
        const mappedThreads: ChatThread[] = result.data.map((item: ChatListItem) => ({
          id: item.id,
          session_id: item.session_id,
          session_name: item.name,
          name: item.name,
          messages: [],
        }))
        mappedThreads.sort((a, b) => b.id - a.id)
        return mappedThreads
      }
      throw new Error(result.error || 'Failed to fetch chat list')
    },
    staleTime: 30 * 1000, // 30 seconds - chat list should be relatively fresh
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

/**
 * Hook to send a message with optimistic chat list updates
 * When a new conversation is created, it optimistically adds it to the chat list
 */
export function useSendChatMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ message, conversationId }: { message: string; conversationId?: string }) => {
      return await sendMessage(message, conversationId)
    },
    onMutate: async ({ conversationId, message }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.chat.list() })

      // Snapshot the previous value
      const previousChatList = queryClient.getQueryData<ChatThread[]>(queryKeys.chat.list())

      // If this is a new conversation (no conversationId), optimistically add it to the list
      if (!conversationId && previousChatList) {
        // Use the first 50 characters of the message as the thread name
        const threadName = message ? message.substring(0, 50).trim() || 'New Chat' : 'New Chat'
        const optimisticThread: ChatThread = {
          id: Date.now(), // Temporary ID
          session_id: `temp-${Date.now()}`, // Temporary session ID
          session_name: threadName,
          name: threadName,
          messages: [],
        }

        // Optimistically update the chat list
        queryClient.setQueryData<ChatThread[]>(queryKeys.chat.list(), (old = []) => {
          // Check if thread already exists to avoid duplicates
          const exists = old.some(thread => thread.session_id === optimisticThread.session_id)
          if (exists) return old
          return [optimisticThread, ...old]
        })
      }

      return { previousChatList }
    },
    onSuccess: async (data, variables, context) => {
      // If we got a conversation_id back, update the optimistic thread
      if (data.success && data.data?.conversation_id && !variables.conversationId) {
        const conversationId = data.data.conversation_id
        const previousChatList = queryClient.getQueryData<ChatThread[]>(queryKeys.chat.list())
        
        if (previousChatList && conversationId) {
          // Find the temporary thread and update it with real data
          const updatedList = previousChatList.map(thread => {
            if (thread.session_id.startsWith('temp-')) {
              return {
                ...thread,
                session_id: conversationId,
                session_name: variables.message.substring(0, 50) || 'New Chat',
                name: variables.message.substring(0, 50) || 'New Chat',
              }
            }
            return thread
          })

          queryClient.setQueryData<ChatThread[]>(queryKeys.chat.list(), updatedList)
        }

        // Refetch to get the actual data from server
        await queryClient.invalidateQueries({ queryKey: queryKeys.chat.list() })
      } else if (variables.conversationId) {
        // For existing conversations, just update the thread name if needed
        // and invalidate to refresh the list
        await queryClient.invalidateQueries({ queryKey: queryKeys.chat.list() })
      }
    },
    onError: (err, variables, context) => {
      // Rollback to previous chat list on error
      if (context?.previousChatList) {
        queryClient.setQueryData<ChatThread[]>(queryKeys.chat.list(), context.previousChatList)
      }
    },
    onSettled: () => {
      // Always refetch after mutation to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.list() })
    },
  })
}

/**
 * Hook to invalidate and refetch chat list
 * Useful for manual refresh
 */
export function useRefreshChatList() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.chat.list() })
  }
}

