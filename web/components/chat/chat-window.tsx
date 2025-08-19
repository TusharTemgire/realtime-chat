"use client"

import { useChatStore } from "@/lib/stores/chat-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import MessageList from "./message-list"
import MessageInput from "./message-input"
import { MessageCircle } from "lucide-react"

export default function ChatWindow() {
  const { user } = useAuthStore()
  const { currentConversation, isConnected } = useChatStore()

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="bg-muted rounded-full p-6 w-fit mx-auto">
            <MessageCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Welcome to ChatApp</h3>
            <p className="text-muted-foreground">Select a conversation or start a new chat to begin messaging</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentConversation.partner.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{currentConversation.partner.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              {currentConversation.partner.is_online && (
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-card-foreground">{currentConversation.partner.username}</h2>
              <p className="text-sm text-muted-foreground">
                {currentConversation.partner.is_online ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive">Disconnected</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageList />

      {/* Message Input */}
      <MessageInput />
    </div>
  )
}
