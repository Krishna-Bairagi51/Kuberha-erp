"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Menu, MessageSquare, Mic, Send, Paperclip, ArrowRight, PlusCircle } from "lucide-react"
import { ChatMessageBubble } from "./chat-message-bubble"
import { ChatSidebar } from "./chat-sidebar"
import type { ChatMessage, ChatThread } from '../types/chat.types'
import { cn } from "@/lib/utils"
import { setRetailerId } from '../utils/retailer-id'
import { getUid, getAuthData } from "@/lib/api/helpers/auth"
import { useSendChatMessage } from '../hooks/use-chat-list'
import { chatService } from '../services/chat.service'
import type { ChatMessageItem } from '@/types/domains/chatbot'
import PageHeader from "@/components/shared/layout/page-header"

export default function ChatFullscreen() {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [activeLoadingConversationId, setActiveLoadingConversationId] = useState<string | undefined>()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userName, setUserName] = useState<string>("")

  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Use React Query mutation for sending messages with optimistic updates
  const sendMessageMutation = useSendChatMessage()

  useEffect(() => {
    inputRef.current?.focus()
    const authData = getAuthData()
    if (authData?.name) {
      setUserName(authData.name)
    }
  }, [])

  // Scroll to bottom when messages change or when loading state changes
  useEffect(() => {
    if (messages.length > 0 || isLoading) {
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }, [messages, isLoading])

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

  function pushUser(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: text, status: "read" },
    ])
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
        animate: true,
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
        setTimeout(() => {
          inputRef.current?.focus()
        }, 50)
      }
    }
  }

  function send() {
    const text = input.trim()
    if (!text || isLoading) return

    setInput("")
    pushUser(text)

    sendMessageToChatbot(text)
  }

  function startNewChat() {
    setMessages([])
    setConversationId(undefined)
    // Reset loading state when starting new chat
    setIsLoading(false)
    setActiveLoadingConversationId(undefined)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  async function loadThread(thread: ChatThread) {
    setConversationId(thread.session_id)
    // Reset loading state when switching chats
    setIsLoading(true)
    setActiveLoadingConversationId(thread.session_id)
    setMessages([]) // Clear messages while loading

    try {
      const result = await chatService.getChatMessages(thread.session_id)
      
      if (result.success && result.data) {
        // Map API response to ChatMessage format
        const convertedMessages: ChatMessage[] = result.data.map((record: ChatMessageItem, idx: number) => ({
          id: `${record.is_sender ? "user" : "assistant"}-${thread.session_id}-${idx}`,
          role: record.is_sender ? "user" : "assistant",
          content: record.answer,
          status: record.is_sender ? "read" : undefined,
          imageUrl: record.is_sender 
            ? (record.upload_image_list && record.upload_image_list.length > 0 ? record.upload_image_list[0] : undefined)
            : record.image || undefined,
        }))
        setMessages(convertedMessages)
      } else {
        setMessages([])
      }
    } catch (error) {
      setMessages([])
    } finally {
      setIsLoading(false)
      setActiveLoadingConversationId(undefined)
      setTimeout(() => {
        inputRef.current?.focus()
        // Scroll to bottom after loading thread
        endRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }

  function handleRetry(content: string) {
    if (isLoading) return
    pushUser(content)
    sendMessageToChatbot(content)
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {sidebarOpen && (
        <ChatSidebar 
          currentSessionId={conversationId} 
          onThreadSelect={loadThread} 
          onNewChat={startNewChat}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-gray-50 relative">
        {/* Gradient Background */}
        <div 
          className="absolute inset-0 pointer-events-none mix-blend-multiply"
          style={{
            background: 'radial-gradient(circle at center, rgba(245, 183, 177, 0.3) 0%, rgba(255, 255, 255, 0) 70%)'
          }}
        />

        {/* Header - Fixed at top */}
        <PageHeader 
          title="Casa CarigarAI"
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          menuIcon={<div className="flex items-center justify-center w-10 h-10 rounded-full border border-[#1F2937] text-[#1F2937]"><MessageSquare className="w-5 h-5" /></div>}
          onNewChat={!sidebarOpen ? startNewChat : undefined}
        />

        {/* Messages area - Scrollable middle section */}
        <div className="flex-1 overflow-hidden relative z-10">
          <div className="h-full overflow-y-auto px-6 py-6 space-y-4 mt-[120px]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 -mt-20">
                <div className="space-y-2">
                  <h2 className="h4 font-spectral font-medium text-gray-800 text-4xl">Hey <span className="text-secondary-900 italic">{userName || "there"}</span></h2>
                  <p className="h4 font-spectral font-medium text-gray-900 text-4xl">What can I help you with today?</p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-3 max-w-3xl">
                  {[
                    "What are my MTD sales",
                    "Which orders are in transit", 
                    "What orders are pending for QC",
                    "What are top selling items in the last year"
                  ].map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(suggestion)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-[#005F73] hover:text-[#005F73] transition-all shadow-sm"
                    >
                      {suggestion}
                      <PlusCircle className="w-3.5 h-3.5 text-[#005F73]" />
                    </button>
                  ))}
                </div>

                <div className="w-full max-w-2xl px-4">
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
                        className="w-full h-full bg-transparent border-0 focus:ring-0 resize-none text-base p-0 placeholder:text-gray-500 focus:outline-none"
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
                
                <div className="flex flex-wrap justify-center gap-3 max-w-3xl">
                  {[
                    "Finance & Accounting",
                    "QC Status",
                    "Delivery Status", 
                    "Orders Incoming"
                  ].map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(suggestion)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-[#005F73] hover:text-[#005F73] transition-all shadow-sm"
                    >
                      {suggestion}
                      <PlusCircle className="w-3.5 h-3.5 text-[#005F73]" />
                    </button>
                  ))}
                </div>
                
                <div className="w-full text-center mt-[300px] pb-4">
                  <p className="text-xs text-gray-400">Powered by Kuberha AI</p>
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
                        <span className="text-sm text-gray-500">Casa CarigarAI is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </>
            )}
          </div>
        </div>

        {/* Input area - Fixed at bottom */}
        {messages.length > 0 && (
          <div className="flex-shrink-0 px-6 pb-4">
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
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base flex-1"
                autoFocus
              />
              
              <div className="flex items-center gap-2 mr-1">
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
            <div className="text-center mt-2">
              <p className="text-xs text-gray-400">Powered by Kuberha AI</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
