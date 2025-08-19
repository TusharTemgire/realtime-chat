import jwt from "jsonwebtoken"
import { User, Conversation, Message, TypingIndicator } from "../../models/index.js"
import { Op } from "sequelize"
// import io from "socket.io" // Declare the io variable

const connectedUsers = new Map() // userId -> socketId

export function initSockets(io) {
    // Socket authentication middleware
    io.use(async(socket, next) => {
        try {
            const token = socket.handshake.auth.token

            if (!token) {
                return next(new Error("Authentication token required"))
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET)

            // Verify user exists
            const user = await User.findByPk(decoded.id, {
                attributes: ["id", "username", "email", "is_online"],
            })

            if (!user) {
                return next(new Error("User not found"))
            }

            socket.userId = user.id
            socket.user = user
            next()
        } catch (error) {
            console.error("Socket authentication error:", error)
            next(new Error("Authentication failed"))
        }
    })

    io.on("connection", async(socket) => {
        const userId = socket.userId
        console.log(`User ${userId} connected with socket ${socket.id}`)

        // Store connection
        connectedUsers.set(userId, socket.id)

        // Update user online status
        await User.update({ is_online: true, last_seen: new Date() }, { where: { id: userId } })

        // Broadcast user online status to all clients
        socket.broadcast.emit("user:online", { userId, is_online: true })

        // Join user to their conversation rooms
        socket.on("conversation:join", async(data) => {
            try {
                const { conversationId } = data

                // Verify user has access to this conversation
                const conversation = await Conversation.findOne({
                    where: {
                        id: conversationId,
                        [Op.or]: [{ user1_id: userId }, { user2_id: userId }],
                    },
                })

                if (conversation) {
                    socket.join(`conversation:${conversationId}`)
                    console.log(`User ${userId} joined conversation ${conversationId}`)
                }
            } catch (error) {
                console.error("Join conversation error:", error)
            }
        })

        // Handle typing indicators
        socket.on("typing:start", async(data) => {
            try {
                const { conversationId } = data

                // Verify access to conversation
                const conversation = await Conversation.findOne({
                    where: {
                        id: conversationId,
                        [Op.or]: [{ user1_id: userId }, { user2_id: userId }],
                    },
                })

                if (conversation) {
                    // Update typing indicator in database
                    await TypingIndicator.upsert({
                        conversation_id: conversationId,
                        user_id: userId,
                        is_typing: true,
                    })

                    // Broadcast to other users in the conversation
                    socket.to(`conversation:${conversationId}`).emit("typing:start", {
                        conversationId,
                        userId,
                        username: socket.user.username,
                    })
                }
            } catch (error) {
                console.error("Typing start error:", error)
            }
        })

        socket.on("typing:stop", async(data) => {
            try {
                const { conversationId } = data

                // Update typing indicator in database
                await TypingIndicator.update({ is_typing: false }, {
                    where: {
                        conversation_id: conversationId,
                        user_id: userId,
                    },
                }, )

                // Broadcast to other users in the conversation
                socket.to(`conversation:${conversationId}`).emit("typing:stop", {
                    conversationId,
                    userId,
                })
            } catch (error) {
                console.error("Typing stop error:", error)
            }
        })

        // Handle new messages
        socket.on("message:send", async(data) => {
            try {
                const { conversationId, content, message_type = "text" } = data

                if (!content || !content.trim()) {
                    return socket.emit("error", { message: "Message content is required" })
                }

                // Verify user has access to this conversation
                const conversation = await Conversation.findOne({
                    where: {
                        id: conversationId,
                        [Op.or]: [{ user1_id: userId }, { user2_id: userId }],
                    },
                })

                if (!conversation) {
                    return socket.emit("error", { message: "Conversation not found" })
                }

                // Create message
                const message = await Message.create({
                    conversation_id: conversationId,
                    sender_id: userId,
                    content: content.trim(),
                    message_type,
                })

                // Update conversation timestamp
                await conversation.update({ updated_at: new Date() })

                // Get message with sender info
                const messageWithSender = await Message.findByPk(message.id, {
                    include: [{
                        model: User,
                        as: "sender",
                        attributes: ["id", "username", "avatar_url"],
                    }, ],
                })

                // Broadcast message to all users in the conversation
                io.to(`conversation:${conversationId}`).emit("message:new", messageWithSender)

                // Stop typing indicator for sender
                await TypingIndicator.update({ is_typing: false }, {
                    where: {
                        conversation_id: conversationId,
                        user_id: userId,
                    },
                }, )

                socket.to(`conversation:${conversationId}`).emit("typing:stop", {
                    conversationId,
                    userId,
                })
            } catch (error) {
                console.error("Send message error:", error)
                socket.emit("error", { message: "Failed to send message" })
            }
        })

        // Handle message read receipts
        socket.on("message:read", async(data) => {
            try {
                const { messageId, conversationId } = data

                const message = await Message.findByPk(messageId, {
                    include: [{
                        model: Conversation,
                        as: "conversation",
                        where: {
                            [Op.or]: [{ user1_id: userId }, { user2_id: userId }],
                        },
                    }, ],
                })

                if (message && message.sender_id !== userId) {
                    await message.update({
                        is_read: true,
                        read_at: new Date(),
                    })

                    // Broadcast read receipt to conversation
                    socket.to(`conversation:${conversationId}`).emit("message:read", {
                        messageId,
                        readBy: userId,
                        readAt: new Date(),
                    })
                }
            } catch (error) {
                console.error("Message read error:", error)
            }
        })

        // Handle disconnection
        socket.on("disconnect", async() => {
            console.log(`User ${userId} disconnected`)

            // Remove from connected users
            connectedUsers.delete(userId)

            // Update user offline status
            await User.update({ is_online: false, last_seen: new Date() }, { where: { id: userId } })

            // Clear typing indicators
            await TypingIndicator.update({ is_typing: false }, { where: { user_id: userId } })

            // Broadcast user offline status
            socket.broadcast.emit("user:offline", { userId, is_online: false })
        })

        // Handle errors
        socket.on("error", (error) => {
            console.error(`Socket error for user ${userId}:`, error)
        })
    })

    // Handle server errors
    io.on("error", (error) => {
        console.error("Socket.IO server error:", error)
    })

    console.log("✅ Socket.IO initialized successfully")
}

// Helper function to get online users
export function getOnlineUsers() {
    return Array.from(connectedUsers.keys())
}

// Helper function to emit to specific user
export function emitToUser(userId, event, data) {
    const socketId = connectedUsers.get(userId)
    if (socketId) {
        io.to(socketId).emit(event, data)
        return true
    }
    return false
}