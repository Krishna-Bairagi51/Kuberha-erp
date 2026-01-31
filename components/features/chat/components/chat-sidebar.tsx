"use client"

import { Button } from "@/components/ui/button"
import { Plus, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChatList } from '../hooks/use-chat-list'
import type { ChatSidebarProps } from '../types/chat.types'

export function ChatSidebar({ currentSessionId, onThreadSelect, onNewChat, onClose }: ChatSidebarProps) {
  const { data: threads = [], isLoading, error } = useChatList()

  return (
    <div className="w-64 bg-white order-r border-gray-200 flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-4 flex items-center gap-2 flex-shrink-0">
        <Button
          onClick={onNewChat}
          className="flex-1 bg-[#C2410C] text-white hover:bg-[#9A3412] flex items-center justify-center gap-2 rounded-full"
        >
          New Chat
          <Plus className="h-4 w-4" />
        </Button>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 rounded-full border border-gray-200 bg-white hover:text-secondary-900 text-[#005F73]"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Threads List */}
      <div className="flex-1 bg-white overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 font-urbanist font-medium">
            <Loader2 className="h-8 w-8 animate-spin text-[#C2410C]" />
            <p>Loading threads...</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 font-urbanist font-medium">
            No previous chats
          </div>
        ) : (
          <div className="pb-4">
            <div className="px-4 py-2 flex items-center justify-between bg-white border-b border-gray-200">
              <div className="text-lg font-semibold text-gray-900">Chat History</div>
              <span className="text-sm font-medium text-gray-600">{threads.length} Total</span>
            </div>
            <div>
              {threads.map((thread) => (
                <button
                  key={thread.session_id}
                  onClick={() => onThreadSelect(thread)}
                  className={cn(
                    "w-full text-left px-4 py-4 hover:bg-gray-200/50 transition-colors relative font-urbanist font-medium",
                    "flex items-start gap-3 group border-b border-gray-200/50 last:border-0 text-gray-900",
                    currentSessionId === thread.session_id && "bg-[#FFF5F2] hover:bg-[#FFF5F2]"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium line-clamp-2",
                      currentSessionId === thread.session_id ? "text-gray-900" : "text-gray-700"
                    )}>
                      {thread.session_name}
                    </p>
                  </div>
                  {currentSessionId === thread.session_id && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#C2410C]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}