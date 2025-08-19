// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password validation (minimum 6 characters)
export const validatePassword = (password) => {
  return password && password.length >= 6
}

// Username validation (3-50 characters, alphanumeric and underscores)
export const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/
  return usernameRegex.test(username)
}

// Message content validation
export const validateMessageContent = (content) => {
  return content && content.trim().length > 0 && content.trim().length <= 5000
}

// Sanitize user input
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input
  return input.trim().replace(/[<>]/g, "")
}
