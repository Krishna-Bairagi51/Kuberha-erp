// Chat Feature Types
// ALL chat-related types consolidated here

// ============================================================================
// Message Types
// ============================================================================

export interface ChatMessage {
  id: string
  role: "assistant" | "user"
  content: string
  ts?: string
  quickReplies?: string[]
  status?: "sent" | "read"
  userAvatarUrl?: string
  imageUrl?: string
  animate?: boolean
  chartData?: {
    answer: string
    chart: string
    img_json: {
      chart_type: "trend" | "bar" | "pie"
      title: string
      x?: (string | number)[]
      y?: (string | number)[]
      labels?: (string | number)[]
      values?: (string | number)[]
    }
  }
}

export interface ChatThread {
  id: number
  session_id: string
  session_name: string
  name?: string
  messages?: Array<{
    role: string
    content: string
  }>
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ChatFullscreenProps {
  onSliderStateChange?: (isOpen: boolean) => void
}

export interface ChatbotWidgetProps {
  onSliderStateChange?: (isOpen: boolean) => void
}

export interface ChatSidebarProps {
  currentSessionId?: string
  onThreadSelect: (thread: ChatThread) => void
  onNewChat: () => void
  onClose?: () => void
}

export interface ChatMessageBubbleProps {
  message: ChatMessage
  onQuickReply?: (label: string) => void
  onRetry?: (content: string) => void
}

// ============================================================================
// Hook Types
// ============================================================================

export interface UseChatOptions {
  autoInitialize?: boolean
}

export interface UseChatReturn {
  messages: ChatMessage[]
  threads: ChatThread[]
  isLoading: boolean
  isLoadingThreads: boolean
  conversationId: string | undefined
  error: string | null
  sendMessage: (text: string) => Promise<void>
  loadThread: (thread: ChatThread) => Promise<void>
  startNewChat: () => void
  fetchThreads: () => Promise<void>
}

