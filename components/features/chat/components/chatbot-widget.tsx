"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Maximize2, X, Plus, MessageSquare, ChevronLeft, Menu, Paperclip, Send, PlusCircle } from "lucide-react"
import { ChatMessageBubble } from "./chat-message-bubble"
import KuberBotIcon from "./kuberbot-icon"
import type { ChatMessage } from '../types/chat.types'
import { cn } from "@/lib/utils"
import { setRetailerId } from '../utils/retailer-id'
import { getUid, getAuthData } from "@/lib/api/helpers/auth"
import { useRouter } from "next/navigation"
import { useChatList, useSendChatMessage } from '../hooks/use-chat-list'
import { chatService } from '../services/chat.service'
import type { ChatMessageItem } from '@/types/domains/chatbot'

import type { ChatThread } from '../types/chat.types'

export default function ChatbotWidget() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [activeLoadingConversationId, setActiveLoadingConversationId] = useState<string | undefined>()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showThreads, setShowThreads] = useState(false)
  const [userName, setUserName] = useState<string>("")
  const router = useRouter()
  
  // Use React Query hook for chat list
  const { data: threads = [], isLoading: isLoadingThreads } = useChatList()
  
  // Use React Query mutation for sending messages with optimistic updates
  const sendMessageMutation = useSendChatMessage()

  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    const authData = getAuthData()
    if (authData?.name) {
      setUserName(authData.name)
    }
  }, [])

  useEffect(() => {
    const uid = getUid()
    if (uid) {
      setRetailerId(String(uid))
    } else {
      const existingRetailerId = typeof window !== "undefined" ? sessionStorage.getItem("r_id") : null
      if (!existingRetailerId) {
        setRetailerId("default_retailer")
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const activeTab = urlParams.get("tab")
      if (activeTab === "kuber-bot") {
        setOpen(false)
        return
      }
    }
  }, [])


  async function loadThread(thread: ChatThread) {
    setConversationId(thread.session_id)
    setShowThreads(false)
    setIsLoading(true)
    setActiveLoadingConversationId(thread.session_id)
    setMessages([]) // Clear messages while loading

    try {
      const result = await chatService.getChatMessages(thread.session_id)
      
      if (result.success && result.data) {
        // Map API response to ChatMessage format
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
        // Start with empty messages if API call fails
        setMessages([])
      }
    } catch (error) {
      setMessages([])
    } finally {
      setIsLoading(false)
      setActiveLoadingConversationId(undefined)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  function pushUser(text: string) {
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: text, status: "read" }])
  }

  function pushAssistant(text: string, imageUrl?: string, chartData?: any) {
    setMessages((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: text,
        imageUrl: imageUrl,
        chartData: chartData,
      },
    ])
  }

  async function sendMessageToChatbot(message: string) {
    const currentConversationId = conversationId
    setIsLoading(true)
    setActiveLoadingConversationId(currentConversationId)

    try {
      const response = await sendMessageMutation.mutateAsync({ 
        message, 
        conversationId: currentConversationId 
      })

      // Only process response if this is still the active conversation
      if (currentConversationId === conversationId || (!conversationId && currentConversationId === undefined)) {
        if (response.success && response.data) {
          if (response.data.session_id && !conversationId) {
            setConversationId(response.data.session_id)
            setActiveLoadingConversationId(response.data.session_id)
          }

          if (response.data.img_json) {
            const chartData = {
              answer: response.data.answer || response.data.response || "",
              chart: response.data.chart || "chart",
              img_json: response.data.img_json,
            }

            pushAssistant(response.data.answer || response.data.response || "", response.data.image, chartData)
          } else {
            pushAssistant(response.data.response || response.data.answer || "", response.data.image)
          }
        } else {
          pushAssistant(`Sorry, I encountered an error: ${response.error || "Unknown error occurred"}`)
        }
      }
    } catch (error) {
      // Only show error if this is still the active conversation
      if (currentConversationId === conversationId || (!conversationId && currentConversationId === undefined)) {
        pushAssistant("Sorry, something went wrong. Please try again.")
      }
    } finally {
      // Only clear loading if this is still the active conversation
      if (currentConversationId === conversationId || (!conversationId && currentConversationId === undefined)) {
        setIsLoading(false)
        setActiveLoadingConversationId(undefined)
      }
    }
  }

  function handleNewChat() {
    setMessages([])
    setConversationId(undefined)
    setInput("")
    setShowThreads(false)
    // Reset loading state when starting new chat
    setIsLoading(false)
    setActiveLoadingConversationId(undefined)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function send() {
    const text = input.trim()
    if (!text || isLoading) return

    setInput("")
    pushUser(text)

    sendMessageToChatbot(text)

    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [messages])

  function handleRetry(content: string) {
    if (isLoading) return
    pushUser(content)
    sendMessageToChatbot(content)
  }

  return (
    <>
      <div className="fixed bottom-6 right-4 md:right-6 z-50">
        <button
          type="button"
          aria-label={open ? "Close Casa Carigar AI" : "Open Casa Carigar AI"}
          onClick={() => {
            setOpen((v) => {
              const newState = !v
              if (newState) {
                // Focus input when opening
                setTimeout(() => inputRef.current?.focus(), 300)
              }
              return newState
            })
          }}
          className="relative inline-flex"
        >
          <KuberBotIcon />
        </button>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-[100] transition-all duration-300 ease-in-out",
          open ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 bg-white transition-all duration-300 ease-in-out",
            open ? "bg-opacity-50" : "bg-opacity-0"
          )}
          onClick={() => setOpen(false)}
        />

        {/* Sliding Panel */}
        <div
          className={cn(
            "fixed right-0 top-0 h-full w-full md:w-[600px] bg-gray-50 shadow-2xl z-[101] transform transition-all duration-300 ease-in-out",
            open ? "translate-x-0" : "translate-x-full"
          )}
          role="dialog"
          aria-label="Casa Carigar AI window"
        >
          <div className="h-full flex flex-col bg-gray-50 relative">
            {/* Gradient Background - consistent with chat-fullscreen */}
            <div 
              className="absolute inset-0 pointer-events-none mix-blend-multiply z-0"
              style={{
                background: 'radial-gradient(circle at center, rgba(245, 183, 177, 0.3) 0%, rgba(255, 255, 255, 0) 70%)'
              }}
            />

            {/* Header - consistent with PageHeader style */}
            <div className="w-full bg-white border-b border-gray-200 px-[28px] py-[19px] h-[81px] flex items-center justify-between shrink-0 relative z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowThreads(!showThreads)} 
                  className="p-0 bg-transparent border-none outline-none cursor-pointer hover:opacity-80 transition-opacity"
                  aria-label="Toggle menu"
                >
                  {showThreads ? <ChevronLeft className="h-6 w-6 text-gray-600" /> : <Menu className="h-6 w-6 text-gray-600" />}
                </button>
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-semibold text-gray-800 font-urbanist">Casa CarigarAI</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleNewChat} 
                  variant="outline"
                  className="flex items-center gap-2 h-9 bg-[#C2410C] text-white hover:bg-[#9A3412] rounded-full hover:text-white border-none"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline font-urbanist font-medium">New Chat</span>
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col z-10">
            {showThreads ? (
              <div className="flex-1 overflow-y-auto bg-white/80 backdrop-blur-sm">
                {isLoadingThreads ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500 font-urbanist">Loading chat history...</div>
                  </div>
                ) : threads.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500 font-urbanist">No previous chats</div>
                  </div>
                ) : (
                  <div className="divide-y">
                    {threads.map((thread) => (
                      <button
                        key={thread.session_id}
                        onClick={() => loadThread(thread)}
                        className="w-full text-left px-6 py-4 hover:bg-gray-50/80 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate font-urbanist" title={thread.name}>
                              {thread.name}
                            </div>
                            {/* <div className="text-sm text-gray-500 mt-1 font-urbanist">
                              {thread.messages ? `${thread.messages.length} messages` : "Chat"}
                            </div> */}
                          </div>
                          <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 max-h-[calc(100vh-190px)]">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 -mt-10">
                      <div className="space-y-2">
                        <h2 className="h4 font-spectral font-medium text-gray-800 text-3xl md:text-4xl">
                          Hey <span className="text-[#004D5C] italic">{userName || "there"}</span>
                        </h2>
                        <p className="h4 font-spectral font-medium text-gray-900 text-3xl md:text-4xl">
                          What can I help you with today?
                        </p>
                      </div>
                      
                      <div className="w-full max-w-xl px-4">
                        <div className="rounded-3xl border border-gray-200 bg-[#FAF5F5] shadow-sm p-4 flex flex-col gap-4 h-[130px]">
                          <div className="flex items-start gap-3 flex-1 overflow-hidden">
                            <Paperclip className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                            <textarea
                              ref={inputRef as any}
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              placeholder="Ask anything about your business"
                              disabled={isLoading}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault()
                                  send()
                                }
                              }}
                              className="w-full h-full bg-transparent border-0 focus:ring-0 resize-none text-base p-0 placeholder:text-gray-500 focus:outline-none font-urbanist"
                              autoFocus
                            />
                          </div>
                          <div className="flex justify-end items-center gap-3">
                            <Button
                              onClick={send}
                              disabled={isLoading || !input.trim()}
                              className={cn(
                                "bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-full w-8 h-8 p-0 flex items-center justify-center",
                                (isLoading || !input.trim()) && "opacity-50 cursor-not-allowed",
                              )}
                            >
                              {isLoading ? <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> : <Send className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-center gap-3 max-w-xl">
                        {[
                          "What are my MTD sales",
                          "Which orders are in transit", 
                          "What orders are pending for QC",
                          "What are top selling items"
                        ].map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setInput(suggestion)
                              // setTimeout(() => inputRef.current?.focus(), 0)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-[#005F73] hover:text-[#005F73] transition-all shadow-sm font-urbanist"
                          >
                            {suggestion}
                            <PlusCircle className="w-3.5 h-3.5 text-[#005F73]" />
                          </button>
                        ))}
                      </div>
                      
                      <div className="w-full text-center mt-6 pb-2">
                        <p className="text-xs text-gray-400 font-urbanist">Powered by Kuberha AI</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((m) => (
                        <ChatMessageBubble key={m.id} message={m} onRetry={handleRetry} />
                      ))}

                      {isLoading && (activeLoadingConversationId === conversationId || (activeLoadingConversationId === undefined && conversationId === undefined)) && (
                        <div className="flex justify-start">
                          <div className="bg-white rounded-2xl px-4 py-2 shadow-sm border border-gray-200 max-w-[80%]">
                            <div className="flex items-center gap-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div
                                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-500 font-urbanist">Casa CarigarAI is typing...</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={endRef} />
                    </>
                  )}
                </div>

                {/* Bottom Input Bar - Only show when there are messages */}
                {messages.length > 0 && (
                  <div className="px-6 pb-4 backdrop-blur-sm">
                    <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-3 flex items-center gap-3 h-[54px]">
                      <Paperclip className="w-5 h-5 text-gray-400 ml-2" />
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask anything about your business"
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            send()
                          }
                        }}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-urbanist flex-1 text-base"
                      />

                      <Button
                        onClick={send}
                        disabled={isLoading || !input.trim()}
                        className={cn(
                          "bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-full w-8 h-8 p-0 flex items-center justify-center",
                          (isLoading || !input.trim()) && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        {isLoading ? <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="text-center mt-2">
                      <p className="text-xs text-gray-400 font-urbanist">Powered by Kuberha AI</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


