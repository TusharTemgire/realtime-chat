import jwt from "jsonwebtoken"
import { User } from "../../models/index.js"

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(" ")[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: "Access token required" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Verify user still exists
    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "username", "email", "is_online", "last_seen"],
    })

    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" })
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" })
    }

    console.error("Auth middleware error:", error)
    res.status(500).json({ message: "Authentication error" })
  }
}

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(" ")[1]

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findByPk(decoded.id, {
        attributes: ["id", "username", "email", "is_online", "last_seen"],
      })
      req.user = user
    }

    next()
  } catch (error) {
    // Continue without authentication for optional auth
    next()
  }
}
