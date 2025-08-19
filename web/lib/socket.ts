import { io } from "socket.io-client"

export const socket = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000", {
  autoConnect: false,
  transports: ["websocket", "polling"],
  withCredentials: true,
})

// Debug socket events
socket.on("connect", () => {
  console.log("[Socket] Connected:", socket.id)
})

socket.on("disconnect", (reason) => {
  console.log("[Socket] Disconnected:", reason)
})

socket.on("connect_error", (error) => {
  console.error("[Socket] Connection error:", error)
})
