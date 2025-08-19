import express from "express"
import { Conversation, User, Message } from "../../models/index.js"
import { authenticateToken } from "../middleware/auth.js"
import { Op } from "sequelize"

const router = express.Router()

// Get or create conversation between two users
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { partnerId } = req.body
    const currentUserId = req.user.id

    if (!partnerId) {
      return res.status(400).json({ message: "Partner ID is required" })
    }

    if (Number.parseInt(partnerId) === currentUserId) {
      return res.status(400).json({ message: "Cannot create conversation with yourself" })
    }

    // Check if partner exists
    const partner = await User.findByPk(partnerId)
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" })
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      where: {
        [Op.or]: [
          { user1_id: currentUserId, user2_id: partnerId },
          { user1_id: partnerId, user2_id: currentUserId },
        ],
      },
    })

    // Create new conversation if it doesn't exist
    if (!conversation) {
      conversation = await Conversation.create({
        user1_id: Math.min(currentUserId, partnerId),
        user2_id: Math.max(currentUserId, partnerId),
      })
    }

    // Get conversation with partner info
    const conversationWithPartner = await Conversation.findByPk(conversation.id, {
      include: [
        {
          model: User,
          as: "user1",
          attributes: ["id", "username", "email", "avatar_url", "is_online", "last_seen"],
        },
        {
          model: User,
          as: "user2",
          attributes: ["id", "username", "email", "avatar_url", "is_online", "last_seen"],
        },
      ],
    })

    res.json({
      conversation: conversationWithPartner,
      partner:
        conversationWithPartner.user1_id === currentUserId
          ? conversationWithPartner.user2
          : conversationWithPartner.user1,
    })
  } catch (error) {
    console.error("Create/get conversation error:", error)
    res.status(500).json({ message: "Failed to create or get conversation" })
  }
})

// Get all conversations for current user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id

    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [{ user1_id: currentUserId }, { user2_id: currentUserId }],
      },
      include: [
        {
          model: Message,
          as: "messages",
          limit: 1,
          order: [["created_at", "DESC"]],
          required: false,
        },
      ],
      order: [["updated_at", "DESC"]],
    })

    // Get partner info for each conversation
    const conversationsWithPartners = await Promise.all(
      conversations.map(async (conv) => {
        const partnerId = conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id
        const partner = await User.findByPk(partnerId, {
          attributes: ["id", "username", "email", "avatar_url", "is_online", "last_seen"],
        })

        return {
          id: conv.id,
          partner,
          lastMessage: conv.messages[0] || null,
          updated_at: conv.updated_at,
          created_at: conv.created_at,
        }
      }),
    )

    res.json({
      conversations: conversationsWithPartners,
      total: conversationsWithPartners.length,
    })
  } catch (error) {
    console.error("Get conversations error:", error)
    res.status(500).json({ message: "Failed to fetch conversations" })
  }
})

// Get specific conversation
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const currentUserId = req.user.id

    const conversation = await Conversation.findOne({
      where: {
        id,
        [Op.or]: [{ user1_id: currentUserId }, { user2_id: currentUserId }],
      },
    })

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found or access denied" })
    }

    // Get partner info
    const partnerId = conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id
    const partner = await User.findByPk(partnerId, {
      attributes: ["id", "username", "email", "avatar_url", "is_online", "last_seen"],
    })

    res.json({
      conversation: {
        id: conversation.id,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
      },
      partner,
    })
  } catch (error) {
    console.error("Get conversation error:", error)
    res.status(500).json({ message: "Failed to fetch conversation" })
  }
})

export default router
