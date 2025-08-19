"use client"

import { useEffect } from "react"
import { useChatStore } from "@/lib/stores/chat-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import ChatSidebar from "./chat-sidebar"
import ChatWindow from "./chat-window"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ChatApp() {
  const { token } = useAuthStore()
  const { connectSocket, fetchUsers, fetchConversations, error, clearError } = useChatStore()

  useEffect(() => {
    if (token) {
      connectSocket(token)
      fetchUsers()
      fetchConversations()
    }

    return () => {
      // Cleanup on unmount
    }
  }, [token, connectSocket, fetchUsers, fetchConversations])

  return (
    <div className="h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-sidebar">
        <ChatSidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertDescription className="flex items-center justify-between">
              {error}
              <button onClick={clearError} className="text-destructive-foreground hover:underline text-sm">
                Dismiss
              </button>
            </AlertDescription>
          </Alert>
        )}
        <ChatWindow />
      </div>
    </div>
  )
}
