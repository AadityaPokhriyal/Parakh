const rateLimit = require("express-rate-limit");

/**
 * Auth Rate Limiter
 * Applied specifically to authentication endpoints (/login, /register) to prevent brute-force attacks.
 */
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 15, // 15 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many authentication attempts from this IP. Please try again after 15 minutes.",
      code: "AUTH_RATE_LIMIT_EXCEEDED"
    });
  }
});

/**
 * AI & Heavy Operations Rate Limiter
 * Applied to resource-intensive AI endpoints (PDF upload, rubric generation, answer evaluations)
 * to prevent Gemini API quota depletion and server overload.
 */
const aiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_AI_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AI_MAX, 10) || 20, // 20 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many AI processing requests from this IP. Please try again after 15 minutes.",
      code: "AI_RATE_LIMIT_EXCEEDED"
    });
  }
});

module.exports = {
  authLimiter,
  aiLimiter
};


