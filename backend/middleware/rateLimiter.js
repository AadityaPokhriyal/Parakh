const rateLimit = require("express-rate-limit");

/**
 * Global Rate Limiter
 * Applied across all /api/* routes to prevent general API flooding.
 */
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX, 10) || 100, // 100 requests per 15 minutes per IP
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable legacy `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many requests from this IP. Please try again after 15 minutes.",
      code: "RATE_LIMIT_EXCEEDED"
    });
  }
});

/**
 * Auth Rate Limiter
 * Applied specifically to authentication endpoints (/login, /register) to prevent brute-force attacks.
 */
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 10, // 10 attempts per 15 minutes per IP
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

module.exports = {
  globalLimiter,
  authLimiter
};

