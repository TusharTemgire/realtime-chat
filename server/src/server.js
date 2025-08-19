import express from "express"
import http from "http"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import { Server } from "socket.io"
import { sequelize } from "../models/index.js"
import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/users.routes.js"
import conversationRoutes from "./routes/conversations.routes.js"
import messageRoutes, { setSocketIO } from "./routes/messages.routes.js"
import { initSockets } from "./sockets/index.js"

dotenv.config()

const app = express()
const server = http.createServer(app)

const FRONTEND = process.env.FRONTEND_URL || "http://localhost:3000"

// Security middleware
app.use(helmet())
app.use(
    cors({
        origin: "*", // Allow all origins
        credentials: true,
    }),
)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get("/", (req, res) => {
    res.json({
        message: "Chat API Server is running",
        timestamp: new Date().toISOString(),
        status: "healthy",
    })
})

// API routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/conversations", conversationRoutes)
app.use("/api/messages", messageRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err)
    res.status(err.status || 500).json({
        message: err.message || "Internal server error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    })
})

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({ message: "Route not found" })
})

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins
        methods: ["GET", "POST"],
        credentials: true,
    },
})

initSockets(io)

// Set socket IO reference for routes
setSocketIO(io)

// Make io available to routes
export { io }

// Start server
const PORT = process.env.PORT || 4000

async function startServer() {
    try {
        // Test database connection
        await sequelize.authenticate()
        console.log("✅ Database connection established successfully")

        // Sync database models
        await sequelize.sync({ alter: process.env.NODE_ENV === "development" })
        console.log("✅ Database models synchronized")

        // Start HTTP server
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`)
            console.log(`📡 Socket.IO server ready`)
            console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
        })
    } catch (error) {
        console.error("❌ Failed to start server:", error)
        process.exit(1)
    }
}

startServer()

// Graceful shutdown
process.on("SIGTERM", async() => {
    console.log("🔄 SIGTERM received, shutting down gracefully")
    server.close(() => {
        console.log("✅ Server closed")
        sequelize.close()
        process.exit(0)
    })
})