"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useChatStore } from "@/lib/stores/chat-store"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, token, initializeAuth } = useAuthStore()
  const { connectSocket } = useChatStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (user && token) {
      connectSocket(token)
    }
  }, [user, token, connectSocket])

  return <>{children}</>
}
