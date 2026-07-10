const aiService = require("../services/aiService");
const examService = require("../services/examService");

/**
 * Handles POST /api/exams/upload-paper
 *
 * 1. Validates the uploaded PDF file
 * 2. Sends PDF to AI service for parsing
 * 3. Returns success with parsed data (no database write here)
 */
const uploadPaper = async (req, res, next) => {
  try {
    let parsedData;
    try {
      parsedData = await aiService.parseQuestionPaper(req.files);
    } catch (aiError) {
      const errorMessage =
        aiError.response?.data?.error ||
        aiError.message ||
        "AI service unavailable";
      const error = new Error(`AI service error: ${errorMessage}`);
      error.statusCode = 502;
      throw error;
    }

    const filename = req.files[0]?.originalname || "unknown_paper.pdf";

    return res.status(201).json({
      success: true,
      message: "Question paper uploaded and parsed successfully.",
      filename,
      questionPaper: parsedData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles POST /api/exams/generate-rubric
 *
 * 1. Extracts the original filename and the edited parsed JSON from the body
 * 2. Stores the data in the database (Supabase)
 * 3. Returns a success message
 */
const generateRubric = async (req, res, next) => {
  try {
    const { pdf_filename, parsed_data } = req.body;

    if (!parsed_data) {
      return res.status(400).json({
        success: false,
        error: "Missing parsed_data (question paper JSON) in request body.",
      });
    }

    const filename = pdf_filename || "unknown_paper.pdf";

    const result = await examService.storeExamPaper(parsed_data, filename);

    return res.status(201).json({
      success: true,
      message: "Question paper and rubrics saved successfully.",
      examPaperId: result.id,
      createdAt: result.created_at,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadPaper, generateRubric };
