const aiService = require("../services/aiService");

/**
 * Handles POST /api/exams/upload-paper
 *
 * 1. Validates the uploaded PDF file
 * 2. Sends PDF to AI service for parsing
 * 3. Stores the exact JSON response in Supabase
 * 4. Returns success with the exam paper ID
 */
const uploadPaper = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No PDF file uploaded. Please attach a PDF file.",
      });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        error: "Invalid file type. Only PDF files are accepted.",
      });
    }

    const pdfBuffer = req.file.buffer;
    const originalFilename = req.file.originalname;

    let parsedData;
    try {
      parsedData = await aiService.parseQuestionPaper(
        pdfBuffer,
        originalFilename
      );
    } catch (aiError) {
      const errorMessage =
        aiError.response?.data?.error ||
        aiError.message ||
        "AI service unavailable";
      const error = new Error(`AI service error: ${errorMessage}`);
      error.statusCode = 502;
      throw error;
    }

    const examService = require("../services/examService");
    const result = await examService.storeExamPaper(
      parsedData,
      originalFilename
    );

    return res.status(201).json({
      success: true,
      message: "Question paper uploaded and parsed successfully.",
      examPaperId: result.id,
      createdAt: result.created_at,
      questionPaper: parsedData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadPaper };  
