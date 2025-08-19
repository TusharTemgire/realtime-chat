"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Message {
  id: number
  conversation_id: number
  sender_id: number
  content: string
  message_type: string
  is_read: boolean
  read_at?: string
  created_at: string
  sender: {
    id: number
    username: string
    avatar_url?: string
  }
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className={cn("flex gap-3 max-w-[80%]", isOwn ? "ml-auto flex-row-reverse" : "mr-auto")}>
      {!isOwn && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={message.sender.avatar_url || "/placeholder.svg"} />
          <AvatarFallback className="text-xs">{message.sender.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
        {!isOwn && <span className="text-xs text-muted-foreground font-medium">{message.sender.username}</span>}

        <div
          className={cn(
            "rounded-2xl px-4 py-2 max-w-full break-words",
            isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-muted-foreground rounded-bl-md",
          )}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>

        <div
          className={cn(
            "flex items-center gap-1 text-xs text-muted-foreground",
            isOwn ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span>{formatTime(message.created_at)}</span>
          {isOwn && message.is_read && <span className="text-primary">✓✓</span>}
        </div>
      </div>
    </div>
  )
}
