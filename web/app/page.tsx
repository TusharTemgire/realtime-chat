"use client"

import { useAuthStore } from "@/lib/stores/auth-store"
import AuthPage from "@/components/auth/auth-page"
import ChatApp from "@/components/chat/chat-app"

export default function HomePage() {
  const { user, token } = useAuthStore()

  if (!token || !user) {
    return <AuthPage />
  }

  return <ChatApp />
}
