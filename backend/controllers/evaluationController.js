const evaluationService = require("../services/evaluationService");
const aiService = require("../services/aiService");

/**
 * Handles POST /api/evaluations/upload-answers
 *
 * 1. Validates that question_paper_id is provided.
 * 2. Validates that a file is uploaded and that it is a PDF.
 * 3. Fetches the question paper JSON from Supabase.
 * 4. Sends the answer sheet PDF and the question paper JSON to the FastAPI AI service.
 * 5. Stores the evaluated results back into the Supabase database.
 * 6. Returns the evaluation result to the client.
 */
const uploadAnswers = async (req, res, next) => {
  const questionPaperId = req.body.question_paper_id || req.body.questionPaperId;
  const studentName = req.body.student_name || req.body.studentName;
  const files = req.files || [];
  const file = files[0];

  console.log(`[Evaluation] >>> Incoming POST /api/evaluations/upload-answers. ID: ${questionPaperId || "undefined"}, Student: ${studentName || "none"}, File: ${file ? file.originalname : "none"}`);

  try {
    if (!questionPaperId) {
      console.warn("[Evaluation] Validation failed: Missing question_paper_id.");
      return res.status(400).json({
        success: false,
        error: "Missing question_paper_id in request body.",
      });
    }

    if (files.length === 0) {
      console.warn("[Evaluation] Validation failed: No files uploaded.");
      return res.status(400).json({
        success: false,
        error: "Missing student answer sheet file. Please upload a file.",
      });
    }

    // Validate that the uploaded file is a PDF
    const isPdf = 
      file.mimetype === "application/pdf" || 
      file.originalname.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      console.warn(`[Evaluation] Validation failed: File ${file.originalname} is not a PDF.`);
      return res.status(400).json({
        success: false,
        error: "Invalid file type. The student answer sheet must be a PDF file.",
      });
    }

    console.log("[Evaluation] => Request validation passed successfully.");

    // Step 1: Fetch the question paper from Supabase
    console.log(`[Evaluation] => Step 1: Fetching question paper template for ID ${questionPaperId} from database...`);
    let examPaper;
    try {
      examPaper = await evaluationService.getQuestionPaperById(questionPaperId);
      console.log("[Evaluation] => Step 1: Question paper template retrieved successfully.");
    } catch (dbError) {
      console.error(`[Evaluation] [DB ERROR] => Failed to fetch question paper: ${dbError.message}`);
      if (dbError.statusCode === 404) {
        return res.status(404).json({
          success: false,
          error: `Question paper with ID ${questionPaperId} was not found.`,
        });
      }
      throw dbError;
    }

    // Step 2: Call the AI service for evaluation
    console.log("[Evaluation] => Step 2: Dispatching answer sheet PDF and template JSON to AI Evaluation Service (AS-parsing)...");
    let evaluationData;
    try {
      evaluationData = await aiService.evaluateAnswers(
        file.buffer,
        file.originalname,
        file.mimetype,
        examPaper.parsed_data
      );
      console.log("[Evaluation] => Step 2: AI Service response received successfully.");
    } catch (aiError) {
      console.error("[Evaluation] [AI SERVICE ERROR] =>", aiError.message);
      const errorMessage =
        aiError.response?.data?.detail ||
        aiError.response?.data?.error ||
        aiError.response?.data?.message ||
        aiError.message ||
        "AI service unavailable";
      const error = new Error(`AI service evaluation error: ${errorMessage}`);
      error.statusCode = 502;
      throw error;
    }

    // Step 3: Store the evaluation results in the evaluations table
    console.log("[Evaluation] => Step 3: Storing evaluation result in database...");
    const result = await evaluationService.storeEvaluation(
      questionPaperId,
      evaluationData,
      file.originalname,
      studentName
    );
    console.log(`[Evaluation] => Step 3: Successfully stored in DB with Record ID: ${result.id}`);

    // Step 4: Return success confirmation and data to the frontend
    console.log(`[Evaluation] <<< Responding 201 Created. Evaluation ID: ${result.id}`);
    return res.status(201).json({
      success: true,
      message: "Answer sheet evaluated and stored successfully.",
      evaluationId: result.id,
      createdAt: result.created_at,
      obtainedMarks: result.obtained_marks,
      maxMarks: result.max_marks,
      evaluationData,
    });
  } catch (error) {
    console.error(`[Evaluation] [FATAL ERROR] => ${error.message}`);
    next(error);
  }
};

const getEvaluations = async (req, res, next) => {
  const { examPaperId } = req.params;
  console.log(`[Evaluation] >>> Incoming GET /api/evaluations/paper/${examPaperId}`);

  try {
    if (!examPaperId) {
      console.warn("[Evaluation] Validation failed: Missing examPaperId parameter.");
      return res.status(400).json({
        success: false,
        error: "Missing examPaperId parameter.",
      });
    }

    const data = await evaluationService.getEvaluationsByPaperId(examPaperId);
    console.log(`[Evaluation] => Successfully retrieved ${data.length} evaluations.`);

    return res.status(200).json({
      success: true,
      evaluations: data.map((item) => ({
        id: item.id,
        studentName: item.student_name,
        filename: item.pdf_filename,
        evaluationId: item.id,
        evaluationData: item.parsed_data,
        obtainedMarks: item.obtained_marks,
        maxMarks: item.max_marks,
        createdAt: item.created_at,
      })),
    });
  } catch (error) {
    console.error(`[Evaluation] [FATAL ERROR] => ${error.message}`);
    next(error);
  }
};

module.exports = {
  uploadAnswers,
  getEvaluations,
};
