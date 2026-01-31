// types/domains/chatbot.ts

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  imageUrl?: string // Add support for images in messages
}

export interface ChatRequest {
  query: string
  r_id: string
  session_id?: string
}

export interface ChatResponse {
  response?: string
  answer?: string
  image?: string // Add support for image URLs in response
  chart?: string
  img_json?: {
    chart_type: "trend" | "bar" | "pie"
    title: string
    x?: (string | number)[]
    y?: (string | number)[]
    labels?: (string | number)[]
    values?: (string | number)[]
  }
  graphjson?: {
    chart_type: "trend" | "bar" | "pie"
    title: string
    x?: (string | number)[]
    y?: (string | number)[]
    labels?: (string | number)[]
    values?: (string | number)[]
  }
  conversation_id?: string
  message_id?: string
  status?: "success" | "error"
  error?: string
  session_id?: string
  doc?: unknown
}

// Chatbot Chat List API
export interface ChatListItem {
  id: number
  session_id: string
  name: string
}

// Chatbot Chat Messages API
export interface ChatMessageItem {
  session_id: string
  answer: string
  is_sender: boolean
  upload_image_list?: string[]
  image?: string
}
