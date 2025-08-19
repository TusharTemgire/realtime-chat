"use client"

import { useEffect, useRef } from "react"
import { useChatStore } from "@/lib/stores/chat-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import MessageBubble from "./message-bubble"
import TypingIndicator from "./typing-indicator"

export default function MessageList() {
  const { user } = useAuthStore()
  const { messages, typingUsers, currentConversation } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (!currentConversation) return null

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground">
              Start the conversation with {currentConversation.partner.username}
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} isOwn={message.sender_id === user?.id} />
          ))}

          {typingUsers.size > 0 && <TypingIndicator username={currentConversation.partner.username} />}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
