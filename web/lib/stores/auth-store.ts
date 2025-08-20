import { create } from "zustand"
import { persist } from "zustand/middleware"
import { api } from "../api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

// Helper function to make API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
    ...options,
  }

  const response = await fetch(url, config)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`)
  }

  return data
}

interface User {
  id: number
  username: string
  email: string
  avatar_url?: string
  is_online: boolean
  last_seen: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  initializeAuth: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          })

          const { token, user } = data
          // Set the token in axios defaults for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          set({ user, token, isLoading: false })
        } catch (error: any) {
          const message = error.message || "Login failed"
          set({ error: message, isLoading: false })
          throw new Error(message)
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const data = await apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify({ username, email, password }),
          })

          const { token, user } = data
          // Set the token in axios defaults for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          set({ user, token, isLoading: false })
        } catch (error: any) {
          const message = error.message || "Registration failed"
          set({ error: message, isLoading: false })
          throw new Error(message)
        }
      },

      logout: async () => {
        const { token } = get()

        try {
          if (token) {
            await apiRequest("/auth/logout", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
          }
        } catch (error) {
          console.error("Logout error:", error)
        } finally {
          // Clear auth data and remove token from axios defaults
          delete api.defaults.headers.common['Authorization']
          set({ user: null, token: null, error: null })
        }
      },

      initializeAuth: () => {
        // Set up the axios token if we have one in storage
        const state = get()
        if (state.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    },
  ),
)
