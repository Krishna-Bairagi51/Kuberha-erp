// Chat Feature Exports

// Components
export { default as ChatFullscreen } from './components/chat-fullscreen'
export { default as ChatbotWidget } from './components/chatbot-widget'
export { ChatSidebar } from './components/chat-sidebar'
export { ChatMessageBubble } from './components/chat-message-bubble'
export { default as KuberBotIcon } from './components/kuberbot-icon'

// Hooks
export { useChat } from './hooks/use-chat'
export { useChatList, useSendChatMessage, useRefreshChatList } from './hooks/use-chat-list'

// Services
export { chatService } from './services/chat.service'

// Utils
export { chatStorage } from './utils/chat-storage'
export { getRetailerId, setRetailerId, getChatSessionId, isChatbotSessionActive, getChatbotSessionKeys } from './utils/retailer-id'

// Types are imported directly from the types file, not re-exported here
// Usage: import type { ChatMessage, ChatThread } from '@/components/features/chat/types/chat.types'

