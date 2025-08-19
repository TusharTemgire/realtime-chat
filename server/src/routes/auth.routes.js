import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { User } from "../../models/index.js"
import { validateEmail, validatePassword, validateUsername } from "../utils/validators.js"
import { Op } from "sequelize"

const router = express.Router()

// Register new user
router.post("/register", async(req, res) => {
    try {
        const { username, email, password } = req.body

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Username, email, and password are required" })
        }

        if (!validateUsername(username)) {
            return res.status(400).json({ message: "Username must be 3-50 characters, alphanumeric and underscores only" })
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ message: "Please provide a valid email address" })
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" })
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ email }, { username }],
            },
        })

        if (existingUser) {
            const field = existingUser.email === email ? "email" : "username"
            return res.status(409).json({ message: `User with this ${field} already exists` })
        }

        // Hash password
        const saltRounds = 12
        const password_hash = await bcrypt.hash(password, saltRounds)

        // Create user
        const user = await User.create({
            username,
            email,
            password_hash,
        })

        // Generate JWT token
        const token = jwt.sign({
                id: user.id,
                username: user.username,
                email: user.email,
            },
            process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
        )

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_online: user.is_online,
                created_at: user.created_at,
            },
        })
    } catch (error) {
        console.error("Registration error:", error)
        res.status(500).json({ message: "Registration failed" })
    }
})

// Login user
router.post("/login", async(req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" })
        }

        // Find user by email
        const user = await User.findOne({ where: { email } })

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" })
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash)

        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid email or password" })
        }

        // Update user online status
        await user.update({
            is_online: true,
            last_seen: new Date(),
        })

        // Generate JWT token
        const token = jwt.sign({
                id: user.id,
                username: user.username,
                email: user.email,
            },
            process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
        )

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_online: user.is_online,
                last_seen: user.last_seen,
            },
        })
    } catch (error) {
        console.error("Login error:", error)
        res.status(500).json({ message: "Login failed" })
    }
})

// Logout user
router.post("/logout", async(req, res) => {
    try {
        const authHeader = req.headers.authorization
        const token = authHeader && authHeader.split(" ")[1]

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            await User.update({ is_online: false, last_seen: new Date() }, { where: { id: decoded.id } })
        }

        res.json({ message: "Logout successful" })
    } catch (error) {
        // Even if token verification fails, we still return success for logout
        res.json({ message: "Logout successful" })
    }
})

export default router