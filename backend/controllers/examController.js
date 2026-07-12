const aiService = require("../services/aiService");
const examService = require("../services/examService");

/**
 * Handles POST /api/exams/upload-paper
 *
 * 1. Sends validated files to AI service for parsing
 * 2. Returns success with parsed data (no database write here)
 * 
 */
const uploadPaper = async (req, res, next) => {
  const filename = req.files && req.files[0] ? req.files[0].originalname : "unknown_paper.pdf";
  console.log(`[Exam] >>> Incoming POST /api/exams/upload-paper. No. of Files: ${req.files.length}`);

  try {
    console.log("[Exam] => Sending question paper PDF to AI Parsing Service (QP-parsing)...");
    let parsedData;
    try {
      parsedData = await aiService.parseQuestionPaper(req.files);
      console.log("[Exam] => Question paper successfully parsed by AI Service.");
    } catch (aiError) {
      console.error("[Exam] [AI SERVICE ERROR] =>", aiError.message);
      const errorMessage =
        aiError.response?.data?.error ||
        aiError.message ||
        "AI service unavailable";
      const error = new Error(`AI service error: ${errorMessage}`);
      error.statusCode = 502;
      throw error;
    }

    for(const file of req.files){
        console.log(`[Exam] <<< Responding 201 Created for file: ${file.originalname}`);
    }
    console.log(parsedData);
    return res.status(201).json({
      success: true,
      message: "Question paper uploaded and parsed successfully.",
      filename,
      questionPaper: parsedData,
    });
  } catch (error) {
    console.error(`[Exam] [FATAL ERROR] => ${error.message}`);
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
  const { pdf_filename, parsed_data } = req.body;
  const filename = pdf_filename || "unknown_paper.pdf";
  
  console.log(`[Exam] >>> Incoming POST /api/exams/generate-rubric. File: ${filename}`);

  try {
    if (!parsed_data) {
      console.warn("[Exam] Validation failed: Missing parsed_data in request body.");
      return res.status(400).json({
        success: false,
        error: "Missing parsed_data (question paper JSON) in request body.",
      });
    }

    console.log("[Exam] => Storing parsed question paper and rubrics in database...");
    const result = await examService.storeExamPaper(parsed_data, filename);
    console.log(`[Exam] => Successfully stored in DB with Record ID: ${result.id}`);

    console.log(`[Exam] <<< Responding 201 Created. ID: ${result.id}`);
    return res.status(201).json({
      success: true,
      message: "Question paper and rubrics saved successfully.",
      examPaperId: result.id,
      createdAt: result.created_at,
    });
  } catch (error) {
    console.error(`[Exam] [FATAL ERROR] => ${error.message}`);
    next(error);
  }
};

module.exports = { uploadPaper, generateRubric };
