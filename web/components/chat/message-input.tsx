"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useChatStore } from "@/lib/stores/chat-store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"

export default function MessageInput() {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const { sendMessage, startTyping, stopTyping, currentConversation } = useChatStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const handleSend = async () => {
    if (!message.trim() || !currentConversation) return

    await sendMessage(message.trim())
    setMessage("")

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (value: string) => {
    setMessage(value)

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true)
      startTyping()
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false)
        stopTyping()
      }
    }, 1000)
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  if (!currentConversation) return null

  return (
    <div className="p-4 border-t border-border bg-card">
      <div className="flex gap-3 items-end">
        <Textarea
          ref={textareaRef}
          placeholder="Type a message..."
          value={message}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 min-h-[40px] max-h-32 resize-none"
          rows={1}
        />
        <Button onClick={handleSend} disabled={!message.trim()} size="sm" className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
