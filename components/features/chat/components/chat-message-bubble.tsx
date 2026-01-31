"use client"

import { cn } from "@/lib/utils"
import { CheckCheck, Download, ExternalLink, Copy, RotateCcw, Sparkles, User, FileText, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import ChatbotResponse from "@/components/ui/chatbot-response"
import { useState, useEffect } from "react"
import type { ChatMessage, ChatMessageBubbleProps } from '../types/chat.types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Markdown content renderer with proper styling
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-content prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Style headings
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-semibold mt-3 mb-2 text-gray-900" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-2 mb-1 text-gray-900" {...props} />,
          // Style paragraphs
          p: ({ node, ...props }) => <p className="leading-relaxed mb-2 text-gray-900" {...props} />,
          // Style lists
          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1 text-gray-900" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-900" {...props} />,
          li: ({ node, ...props }) => <li className="ml-4 text-gray-900" {...props} />,
          // Style code blocks
          code: ({ node, inline, ...props }: any) => {
            if (inline) {
              return (
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-900" {...props} />
              )
            }
            return (
              <code className="block bg-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto text-gray-900" {...props} />
            )
          },
          pre: ({ node, ...props }) => (
            <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-2" {...props} />
          ),
          // Style links
          a: ({ node, ...props }: any) => (
            <a
              className="text-[#005F73] hover:text-[#C2410C] underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          // Style blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2 text-gray-700" {...props} />
          ),
          // Style tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse border border-gray-300" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-gray-100" {...props} />,
          th: ({ node, ...props }) => (
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-gray-300 px-3 py-2 text-gray-900" {...props} />
          ),
          // Style horizontal rules
          hr: ({ node, ...props }) => <hr className="my-4 border-gray-300" {...props} />,
          // Style strong and emphasis
          strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-gray-900" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function TypingContent({ content }: { content: string }) {
  const [displayedText, setDisplayedText] = useState("")
  
  useEffect(() => {
    let i = 0
    const intervalId = setInterval(() => {
      setDisplayedText(content.slice(0, i + 1))
      i++
      if (i > content.length) {
        clearInterval(intervalId)
      }
    }, 10) 
    return () => clearInterval(intervalId)
  }, [content])

  // Check if content contains markdown syntax
  const hasMarkdown = /[#*_`\[\]]/.test(content) || content.includes('\n\n')
  
  if (hasMarkdown) {
    return <MarkdownContent content={displayedText} />
  }
  
  return <p className="whitespace-pre-wrap leading-relaxed mb-1">{displayedText}</p>
}

export function ChatMessageBubble({
  message,
  onQuickReply,
  onRetry,
}: ChatMessageBubbleProps) {
  const isUser = message.role === "user"
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
    }
  }

  const handleRetry = () => {
    if (onRetry && message.content) {
      onRetry(message.content)
    }
  }

  const handleImageDownload = (imageUrl: string) => {
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `chatbot-image-${Date.now()}.png`
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImageOpen = (imageUrl: string) => {
    window.open(imageUrl, "_blank")
  }

  // Helper to detect link content for styling (simplified detection)
  const isLink = message.content.match(/^https?:\/\//)

  return (
    <div className={cn("flex w-full gap-4", isUser ? "justify-end" : "justify-start")} role="listitem">
      {!isUser && (
        <div
          className="h-8 w-8 rounded-full bg-primary-400 text-white flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <Sparkles className="h-5 w-5" />
        </div>
      )}

      <div className={cn("max-w-[85%] sm:max-w-[75%]", isUser ? "min-w-[300px]" : "")}>
        {!isUser && message.chartData ? (
          <div className="space-y-2">
            <ChatbotResponse data={message.chartData} />
          </div>
        ) : (
          <div className="flex flex-col">
            <div
              className={cn(
                "relative text-sm shadow-sm overflow-hidden",
                isUser
                  ? "rounded-2xl rounded-tr-sm bg-[#F2D4C9] text-gray-900"
                  : "bg-white text-gray-900 rounded-2xl rounded-tl-sm border border-gray-200 p-4",
              )}
            >
              {/* User Message Special Styling for Links/Files mockup */}
              {isUser && (
                <>
                  <div className="px-4 py-3">
                     {message.content && (
                       (() => {
                         const hasMarkdown = /[#*_`\[\]]/.test(message.content) || message.content.includes('\n\n')
                         return hasMarkdown ? (
                           <MarkdownContent content={message.content} />
                         ) : (
                           <p className="whitespace-pre-wrap leading-relaxed break-words">{message.content}</p>
                         )
                       })()
                     )}
                  </div>
                </>
              )}

              {/* Assistant Message Standard Content */}
              {!isUser && (
                 <>
                   {message.animate ? (
                     <TypingContent content={message.content} />
                   ) : (
                     message.content && (() => {
                       const hasMarkdown = /[#*_`\[\]]/.test(message.content) || message.content.includes('\n\n')
                       return hasMarkdown ? (
                         <MarkdownContent content={message.content} />
                       ) : (
                         <p className="whitespace-pre-wrap leading-relaxed mb-1">{message.content}</p>
                       )
                     })()
                   )}
                 </>
              )}

              {/* Image Handling */}
              {message.imageUrl && (
                <div className={cn(isUser ? "px-4 pb-3" : "mt-3")}>
                  <div className="relative group">
                    <img
                      src={message.imageUrl || "/placeholder.svg"}
                      alt="Chatbot response image"
                      className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                      style={{ maxHeight: "300px", objectFit: "contain" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
                        onClick={() => handleImageOpen(message.imageUrl!)}
                        title="Open image in new tab"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
                        onClick={() => handleImageDownload(message.imageUrl!)}
                        title="Download image"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamp and Status */}
              {message.ts && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-[10px] select-none",
                    isUser ? "justify-end text-gray-600 px-4 pb-2" : "justify-end text-gray-400 mt-1",
                  )}
                >
                  <span>{message.ts}</span>
                  {isUser && (
                    <CheckCheck
                      className={cn("h-3.5 w-3.5", message.status === "read" ? "text-gray-800" : "text-gray-500")}
                    />
                  )}
                </div>
              )}
            </div>
            
            {/* Actions Row (Copy/Retry) */}
            <div className={cn("flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity", isUser ? "justify-end" : "justify-start")}>
                {/* Hidden by default, visible on hover ideally, but keeping visible for now to match functionality */}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="h-8 w-8 rounded-full bg-gray-900 text-white flex items-center justify-center shrink-0 overflow-hidden">
          {message.userAvatarUrl ? (
            <img src={message.userAvatarUrl || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-5 w-5" />
          )}
        </div>
      )}
    </div>
  )
}
