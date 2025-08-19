import express from "express"
import { Message, Conversation, User } from "../../models/index.js"
import { authenticateToken } from "../middleware/auth.js"
import { Op } from "sequelize"

const router = express.Router()

// Store reference to io - will be set when server starts
let io = null

export const setSocketIO = (ioInstance) => {
    io = ioInstance
}

// Get messages for a conversation
router.get("/:conversationId", authenticateToken, async(req, res) => {
    try {
        const { conversationId } = req.params
        const currentUserId = req.user.id
        const { page = 1, limit = 50 } = req.query

        // Verify user has access to this conversation
        const conversation = await Conversation.findOne({
            where: {
                id: conversationId,
                [Op.or]: [{ user1_id: currentUserId }, { user2_id: currentUserId }],
            },
        })

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found or access denied" })
        }

        const offset = (Number.parseInt(page) - 1) * Number.parseInt(limit)

        const messages = await Message.findAndCountAll({
            where: { conversation_id: conversationId },
            include: [{
                model: User,
                as: "sender",
                attributes: ["id", "username", "avatar_url"],
            }, ],
            order: [
                ["created_at", "DESC"]
            ],
            limit: Number.parseInt(limit),
            offset,
        })

        // Reverse to show oldest first
        const reversedMessages = messages.rows.reverse()

        res.json({
            messages: reversedMessages,
            pagination: {
                page: Number.parseInt(page),
                limit: Number.parseInt(limit),
                total: messages.count,
                totalPages: Math.ceil(messages.count / Number.parseInt(limit)),
                hasMore: offset + messages.rows.length < messages.count,
            },
        })
    } catch (error) {
        console.error("Get messages error:", error)
        res.status(500).json({ message: "Failed to fetch messages" })
    }
})

// Send a message
router.post("/:conversationId", authenticateToken, async(req, res) => {
    try {
        const { conversationId } = req.params
        const { content, message_type = "text" } = req.body
        const currentUserId = req.user.id

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Message content is required" })
        }

        // Verify user has access to this conversation
        const conversation = await Conversation.findOne({
            where: {
                id: conversationId,
                [Op.or]: [{ user1_id: currentUserId }, { user2_id: currentUserId }],
            },
        })

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found or access denied" })
        }

        // Create message
        const message = await Message.create({
            conversation_id: conversationId,
            sender_id: currentUserId,
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

        // Broadcast message via socket to all users in the conversation
        if (io) {
            io.to(`conversation:${conversationId}`).emit("message:new", messageWithSender)
        }

        res.status(201).json({
            message: "Message sent successfully",
            data: messageWithSender,
        })
    } catch (error) {
        console.error("Send message error:", error)
        res.status(500).json({ message: "Failed to send message" })
    }
})

// Mark message as read
router.put("/:messageId/read", authenticateToken, async(req, res) => {
    try {
        const { messageId } = req.params
        const currentUserId = req.user.id

        const message = await Message.findByPk(messageId, {
            include: [{
                model: Conversation,
                as: "conversation",
                where: {
                    [Op.or]: [{ user1_id: currentUserId }, { user2_id: currentUserId }],
                },
            }, ],
        })

        if (!message) {
            return res.status(404).json({ message: "Message not found or access denied" })
        }

        // Only mark as read if current user is not the sender
        if (message.sender_id !== currentUserId) {
            await message.update({
                is_read: true,
                read_at: new Date(),
            })
        }

        res.json({ message: "Message marked as read" })
    } catch (error) {
        console.error("Mark message read error:", error)
        res.status(500).json({ message: "Failed to mark message as read" })
    }
})

// Mark all messages in conversation as read
router.put("/conversation/:conversationId/read", authenticateToken, async(req, res) => {
    try {
        const { conversationId } = req.params
        const currentUserId = req.user.id

        // Verify user has access to this conversation
        const conversation = await Conversation.findOne({
            where: {
                id: conversationId,
                [Op.or]: [{ user1_id: currentUserId }, { user2_id: currentUserId }],
            },
        })

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found or access denied" })
        }

        // Mark all unread messages as read (except own messages)
        await Message.update({
            is_read: true,
            read_at: new Date(),
        }, {
            where: {
                conversation_id: conversationId,
                sender_id: {
                    [Op.ne]: currentUserId },
                is_read: false,
            },
        }, )

        res.json({ message: "All messages marked as read" })
    } catch (error) {
        console.error("Mark conversation read error:", error)
        res.status(500).json({ message: "Failed to mark messages as read" })
    }
})

export default router