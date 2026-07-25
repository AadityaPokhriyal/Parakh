const express = require("express");
const multer = require("multer");
const evaluationController = require("../controllers/evaluationController");
const authMiddleware = require("../middleware/authMiddleware");
const { aiLimiter } = require("../middleware/rateLimiter");
const router = express.Router();

// Configure multer for in-memory storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max file size
  }
});

// All evaluation routes require authentication
router.use(authMiddleware);

// POST /api/evaluations/upload-answers
// Expects 'files' array and 'question_paper_id' text field
router.post(
  "/upload-answers",
  aiLimiter,
  upload.array("files", 15),
  evaluationController.uploadAnswers
);

// GET /api/evaluations/paper/:examPaperId
router.get(
  "/paper/:examPaperId",
  evaluationController.getEvaluations
);

// DELETE /api/evaluations/:id
router.delete(
  "/:id",
  evaluationController.deleteEvaluation
);

module.exports = router;
