import axios from "axios"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

// Request interceptor to add auth token and debugging
api.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage if not already set in headers
    if (!config.headers.Authorization) {
      try {
        const authStorage = localStorage.getItem("auth-storage")
        if (authStorage) {
          const { state } = JSON.parse(authStorage)
          if (state?.token) {
            config.headers.Authorization = `Bearer ${state.token}`
          }
        }
      } catch (error) {
        console.warn("Failed to get auth token from storage:", error)
      }
    }
    
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error("[API] Request error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error("[API] Response error:", error.response?.data || error.message)

    // Handle common HTTP errors
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem("auth-storage")
      // Only redirect if we're not already on the login page
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = "/"
      }
    }

    return Promise.reject(error)
  },
)
