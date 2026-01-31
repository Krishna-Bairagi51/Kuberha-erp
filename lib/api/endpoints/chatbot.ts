// src/lib/api/endpoints/chatbot.ts
import { postForm, post, get } from "../client"
import { getRetailerId } from "../helpers/chat"
import { extractImageUrls } from "../helpers/misc"
import { ensureAuthSession } from "../helpers/auth"
import { wrapAndThrow } from "../error"
import type { ChatRequest, ChatResponse, ChatListItem, ChatMessageItem } from "@/types/domains/chatbot"

// Chatbot base URL (kept separate from main BASE_URL)
const CHATBOT_BASE_URL = process.env.NEXT_PUBLIC_CHATBOT_URL || "https://api.chatbot.example.com"
const streamurl = `${CHATBOT_BASE_URL}/stream`

/**
 * sendMessage
 * - Preserves original return shape: { success: boolean; data?: ChatResponse; error?: string }
 * - Uses multipart/form-data with FormData (r_id, query, and optionally session_id)
 * - Uses client.postForm with expectJson:false to receive raw text (chat backend returns mixed formats)
 */
export async function sendMessage(
  message: string,
  conversationId?: string,
): Promise<{ success: boolean; data?: ChatResponse; error?: string }> {
  try {
    const user_type = typeof window !== "undefined" ? localStorage.getItem("user_type") : null
    const retailerId = getRetailerId()

    // Create FormData for multipart/form-data request
    const formData = new FormData()
    formData.append("r_id", retailerId || "")
    formData.append("query", message)
    formData.append("user_type", user_type || "")
    
    // Add session_id only if conversationId exists (for subsequent calls)
    if (conversationId) {
      formData.append("session_id", conversationId)
    }

    // We request raw text because chatbot backend sometimes returns plain text
    const responseText = await postForm<string>(streamurl, formData, { includeAuth: false, expectJson: false })

    if (!responseText || !responseText.toString().trim()) {
      return { success: false, error: "Empty response from chatbot server" }
    }

    const trimmed = responseText.toString().trim()
    const isLikelyJSON = trimmed.startsWith("{") || trimmed.startsWith("[")

    let data: ChatResponse

    if (isLikelyJSON) {
      try {
        const parsed = JSON.parse(trimmed) as any

        // normalize chart/img fields like original code
        const normalizedImgJson = parsed?.img_json ?? parsed?.graphjson ?? undefined
        const normalizedChart: string | undefined =
          parsed?.chart ?? (normalizedImgJson?.chart_type ? normalizedImgJson.chart_type : undefined)

        if (parsed.answer || parsed.response) {
          data = {
            response: parsed.answer || parsed.response,
            answer: parsed.answer,
            image: parsed.image,
            chart: normalizedChart,
            img_json: normalizedImgJson,
            ...parsed,
          }
        } else if (parsed.error) {
          return { success: false, error: parsed.error }
        } else {
          return { success: false, error: "Unexpected JSON response format" }
        }
      } catch (parseError: any) {
        return { success: false, error: "Invalid JSON response format" }
      }
    } else {
      data = {
        response: trimmed,
        status: "success",
      }
    }

    const responseText2 = data.response || data.answer || ""
    const { cleanText, imageUrls } = extractImageUrls(responseText2)

    return {
      success: true,
      data: {
        ...data,
        response: cleanText || responseText2,
        image: imageUrls.length > 0 ? imageUrls[0] : data.image,
      },
    }
  } catch (err: any) {
    if (err instanceof TypeError && typeof window !== "undefined" && err.message.includes("fetch")) {
      return { success: false, error: "Network error. Please check your internet connection." }
    }
    // client.post throws ApiError for network/server errors; preserve message shape
    return { success: false, error: err?.message ?? "Failed to send message to chatbot." }
  }
}

/**
 * startConversation
 * - Calls sendMessage('Hello') and returns same shape as legacy function.
 */
export async function startConversation(): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  try {
    const response = await sendMessage("Hello", undefined)
    if (response.success && response.data?.conversation_id) {
      return { success: true, conversationId: response.data.conversation_id }
    } else {
      return { success: false, error: response.error }
    }
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Failed to start conversation" }
  }
}

/**
 * getChatList
 * - Fetches the list of chat sessions for the current user
 * - Uses cookieSession to include session cookie; client will include access-token header if available.
 */
export async function getChatList(): Promise<{ success: boolean; data?: ChatListItem[]; error?: string }> {
  try {
    ensureAuthSession()
    
    const res = await get<{ message: { status_code: number; message: string; record: ChatListItem[] }; errors: string[]; status_code: number }>(
      "/get_chatlist_web",
      undefined,
      { cookieSession: true }
    )

    if (res.status_code === 200 && res.message?.record) {
      return { success: true, data: res.message.record }
    } else {
      return { success: false, error: res.message?.message || "Failed to fetch chat list" }
    }
  } catch (err: any) {
    if (err instanceof TypeError && typeof window !== "undefined" && err.message.includes("fetch")) {
      return { success: false, error: "Network error. Please check your internet connection." }
    }
    return { success: false, error: err?.message ?? "Failed to fetch chat list" }
  }
}

/**
 * getChatMessages
 * - Fetches chat messages for a specific session
 * - Uses cookieSession to include session cookie; client will include access-token header if available.
 */
export async function getChatMessages(sessionId: string): Promise<{ success: boolean; data?: ChatMessageItem[]; error?: string }> {
  try {
    ensureAuthSession()
    
    const res = await post<{ message: { status_code: number; message: string; record: ChatMessageItem[] }; errors: string[]; status_code: number }>(
      "/get_chat_web",
      { session_id: sessionId },
      { cookieSession: true, contentType: "text" }
    )

    if (res.status_code === 200 && res.message?.record) {
      return { success: true, data: res.message.record }
    } else {
      return { success: false, error: res.message?.message || "Failed to fetch chat messages" }
    }
  } catch (err: any) {
    if (err instanceof TypeError && typeof window !== "undefined" && err.message.includes("fetch")) {
      return { success: false, error: "Network error. Please check your internet connection." }
    }
    return { success: false, error: err?.message ?? "Failed to fetch chat messages" }
  }
}
