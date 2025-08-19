import express from "express"
import { User } from "../../models/index.js"
import { authenticateToken } from "../middleware/auth.js"
import { Op } from "sequelize"

const router = express.Router()

// Get all users (for chat partner selection)
router.get("/", authenticateToken, async(req, res) => {
    try {
        const currentUserId = req.user.id

        const users = await User.findAll({
            where: {
                id: {
                    [Op.ne]: currentUserId }, // Exclude current user
            },
            attributes: ["id", "username", "email", "avatar_url", "is_online", "last_seen"],
            order: [
                ["is_online", "DESC"],
                ["username", "ASC"],
            ],
        })

        res.json({
            users,
            total: users.length,
        })
    } catch (error) {
        console.error("Get users error:", error)
        res.status(500).json({ message: "Failed to fetch users" })
    }
})

// Get user profile
router.get("/profile", authenticateToken, async(req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ["id", "username", "email", "avatar_url", "is_online", "last_seen", "created_at"],
        })

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        res.json({ user })
    } catch (error) {
        console.error("Get profile error:", error)
        res.status(500).json({ message: "Failed to fetch profile" })
    }
})

// Get specific user by ID
router.get("/:id", authenticateToken, async(req, res) => {
    try {
        const { id } = req.params

        const user = await User.findByPk(id, {
            attributes: ["id", "username", "email", "avatar_url", "is_online", "last_seen"],
        })

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        res.json({ user })
    } catch (error) {
        console.error("Get user error:", error)
        res.status(500).json({ message: "Failed to fetch user" })
    }
})

// Update user profile
router.put("/profile", authenticateToken, async(req, res) => {
    try {
        const { username, avatar_url } = req.body
        const userId = req.user.id

        const updateData = {}
        if (username) updateData.username = username
        if (avatar_url !== undefined) updateData.avatar_url = avatar_url

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No valid fields to update" })
        }

        // Check if username is already taken (if updating username)
        if (username) {
            const existingUser = await User.findOne({
                where: {
                    username,
                    id: { $ne: userId },
                },
            })

            if (existingUser) {
                return res.status(409).json({ message: "Username already taken" })
            }
        }

        await User.update(updateData, { where: { id: userId } })

        const updatedUser = await User.findByPk(userId, {
            attributes: ["id", "username", "email", "avatar_url", "is_online", "last_seen"],
        })

        res.json({
            message: "Profile updated successfully",
            user: updatedUser,
        })
    } catch (error) {
        console.error("Update profile error:", error)
        res.status(500).json({ message: "Failed to update profile" })
    }
})

export default router