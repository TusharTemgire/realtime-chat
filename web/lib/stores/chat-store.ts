import { create } from "zustand"
import { socket } from "@/lib/socket"
import { api } from "@/lib/api"

// Helper function to make authenticated API requests using axios
const apiRequest = async (endpoint: string, options: { method?: string; data?: any } = {}) => {
  const { method = "GET", data } = options
  
  const response = await api.request({
    url: endpoint,
    method,
    data,
  })

  return response.data
}

interface User {
  id: number
  username: string
  email: string
  avatar_url?: string
  is_online: boolean
  last_seen: string
}

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

interface Conversation {
  id: number
  partner: User
  lastMessage?: Message
  updated_at: string
  created_at: string
}

interface ChatState {
  users: User[]
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  typingUsers: Set<number>
  isConnected: boolean
  isLoading: boolean
  error: string | null
  token: string | null

  // Actions
  setToken: (token: string | null) => void
  fetchUsers: () => Promise<void>
  fetchConversations: () => Promise<void>
  openConversation: (partnerId: number) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  markAsRead: (messageId: number) => Promise<void>
  startTyping: () => void
  stopTyping: () => void
  connectSocket: (token: string) => void
  disconnectSocket: () => void
  clearError: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  users: [],
  conversations: [],
  currentConversation: null,
  messages: [],
  typingUsers: new Set(),
  isConnected: false,
  isLoading: false,
  error: null,
  token: null,

  setToken: (token: string | null) => {
    set({ token })
  },

  fetchUsers: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await apiRequest("/users")
      set({ users: data.users, isLoading: false })
    } catch (error: any) {
      const message = error.message || "Failed to fetch users"
      set({ error: message, isLoading: false })
    }
  },

  fetchConversations: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await apiRequest("/conversations")
      set({ conversations: data.conversations, isLoading: false })
    } catch (error: any) {
      const message = error.message || "Failed to fetch conversations"
      set({ error: message, isLoading: false })
    }
  },

  openConversation: async (partnerId: number) => {
    set({ isLoading: true, error: null })
    try {
      // Create or get conversation
      const convData = await apiRequest("/conversations", {
        method: "POST",
        data: { partnerId },
      })
      
      const { conversation, partner } = convData

      const newConversation = {
        id: conversation.id,
        partner,
        updated_at: conversation.updated_at,
        created_at: conversation.created_at,
      }

      // Fetch messages for this conversation
      const messagesData = await apiRequest(`/messages/${conversation.id}`)

      set({
        currentConversation: newConversation,
        messages: messagesData.messages,
        isLoading: false,
      })

      // Join conversation room via socket
      if (socket.connected) {
        socket.emit("conversation:join", { conversationId: conversation.id })
      }
    } catch (error: any) {
      const message = error.message || "Failed to open conversation"
      set({ error: message, isLoading: false })
    }
  },

  sendMessage: async (content: string) => {
    const { currentConversation } = get()
    if (!currentConversation || !content.trim()) return

    try {
      // Send message via API
      const response = await api.post(`/messages/${currentConversation.id}`, {
        content: content.trim(),
        message_type: "text",
      })

      // The message will be added via socket event when server broadcasts it
      // No need to add optimistically since socket handles real-time updates
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to send message"
      set({ error: message })
    }
  },

  markAsRead: async (messageId: number) => {
    const { currentConversation } = get()
    if (!currentConversation) return

    try {
      await api.put(`/messages/${messageId}/read`)

      // Update message in local state
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true, read_at: new Date().toISOString() } : msg,
        ),
      }))
    } catch (error: any) {
      console.error("Failed to mark message as read:", error)
    }
  },

  startTyping: () => {
    const { currentConversation } = get()
    if (!currentConversation || !socket.connected) return

    socket.emit("typing:start", { conversationId: currentConversation.id })
  },

  stopTyping: () => {
    const { currentConversation } = get()
    if (!currentConversation || !socket.connected) return

    socket.emit("typing:stop", { conversationId: currentConversation.id })
  },

  connectSocket: (token: string) => {
    socket.auth = { token }
    socket.connect()

    socket.on("connect", () => {
      set({ isConnected: true })
    })

    socket.on("disconnect", () => {
      set({ isConnected: false })
    })

    socket.on("message:new", (message: Message) => {
      set((state) => ({
        messages: [...state.messages.filter((m) => m.id !== message.id), message],
      }))
    })

    socket.on("typing:start", ({ userId }: { userId: number }) => {
      set((state) => ({
        typingUsers: new Set([...state.typingUsers, userId]),
      }))
    })

    socket.on("typing:stop", ({ userId }: { userId: number }) => {
      set((state) => {
        const newTypingUsers = new Set(state.typingUsers)
        newTypingUsers.delete(userId)
        return { typingUsers: newTypingUsers }
      })
    })

    socket.on("user:online", ({ userId }: { userId: number }) => {
      set((state) => ({
        users: state.users.map((user) => (user.id === userId ? { ...user, is_online: true } : user)),
      }))
    })

    socket.on("user:offline", ({ userId }: { userId: number }) => {
      set((state) => ({
        users: state.users.map((user) => (user.id === userId ? { ...user, is_online: false } : user)),
      }))
    })
  },

  disconnectSocket: () => {
    socket.disconnect()
    set({ isConnected: false, typingUsers: new Set() })
  },

  clearError: () => set({ error: null }),
}))
