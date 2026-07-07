const express = require("express");
const multer = require("multer");
const examController = require("../controllers/examController");

const router = express.Router();

// Configure multer for in-memory PDF storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max file size
  },
  fileFilter: (req, file, cb) => { // cb means callback
    if (file.mimetype === "application/pdf") {
      cb(null, true); // true means accept the file
    } else {
      cb(new Error("Only PDF files are allowed"), false); // false means reject the file
    }
  },
});

// POST /api/exams/upload-paper
router.post("/upload-paper", upload.single("file"), examController.uploadPaper);

module.exports = router;
