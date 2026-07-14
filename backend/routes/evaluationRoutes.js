const express = require("express");
const multer = require("multer");
const evaluationController = require("../controllers/evaluationController");
const router = express.Router();

// Configure multer for in-memory storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max file size
  }
});

// POST /api/evaluations/upload-answers
// Expects 'files' array and 'question_paper_id' text field
router.post(
  "/upload-answers",
  upload.array("files", 15),
  evaluationController.uploadAnswers
);

// GET /api/evaluations/paper/:examPaperId
router.get(
  "/paper/:examPaperId",
  evaluationController.getEvaluations
);

module.exports = router;
