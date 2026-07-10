const express = require("express");
const multer = require("multer");
const examController = require("../controllers/examController");
const validateFileType= require("../middleware/validateFile");
const router = express.Router();

// Configure multer for in-memory PDF storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max file size
  }
});

// POST /api/exams/upload-paper
router.post("/upload-paper", upload.array("files",15), validateFileType, examController.uploadPaper);

// POST /api/exams/generate-rubric
router.post("/generate-rubric", examController.generateRubric);

module.exports = router;
