const evaluationService = require("../services/evaluationService");
const aiService = require("../services/aiService");

/**
 * Handles POST /api/evaluations/upload-answers
 *
 * 1. Validates that question_paper_id is provided.
 * 2. Validates that a file is uploaded and that it is a PDF.
 * 3. Fetches the question paper JSON from Supabase (with ownership check).
 * 4. Sends the answer sheet PDF and the question paper JSON to the FastAPI AI service.
 * 5. Stores the evaluated results back into the Supabase database.
 * 6. Returns the evaluation result to the client.
 */
const uploadAnswers = async (req, res, next) => {
  const questionPaperId = req.body.question_paper_id || req.body.questionPaperId;
  const studentName = req.body.student_name || req.body.studentName;
  const files = req.files || [];
  const file = files[0];
  const userId = req.user.id;

  console.log(`[Evaluation] >>> Incoming POST /api/evaluations/upload-answers. ID: ${questionPaperId || "undefined"}, Student: ${studentName || "none"}, File: ${file ? file.originalname : "none"}, User: ${userId}`);

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

    const isImage =
      file.mimetype.startsWith("image/");

    if (isImage) {
      files.forEach(imageFile => {
        if (!imageFile.mimetype.startsWith("image/")) {
          return res.status(400).json({
            success: false,
            error: "Please provide only images or a PDF file.",
          });
        }
      });
    }
    if (isPdf && files.length > 1) {
      return res.status(400).json({
        success: false,
        error: "Please provide only images or a PDF file.",
      });
    }

    console.log("[Evaluation] => Request validation passed successfully.");

    // Step 1: Fetch the question paper from Supabase (verifies ownership)
    console.log(`[Evaluation] => Step 1: Fetching question paper template for ID ${questionPaperId} from database...`);
    let examPaper;
    try {
      examPaper = await evaluationService.getQuestionPaperById(questionPaperId, userId);
      console.log("[Evaluation] => i) : Question paper template retrieved successfully.");
    } catch (dbError) {
      console.error(`[Evaluation] [DB ERROR] => Failed to fetch question paper: ${dbError.message}`);
      if (dbError.statusCode === 404) {
        return res.status(404).json({
          success: false,
          error: `Question paper with ID ${questionPaperId} was not found.`,
        });
      }
      if (dbError.statusCode === 403) {
        return res.status(403).json({
          success: false,
          error: dbError.message,
        });
      }
      throw dbError;
    }
    // Step 2: Call the AI service for evaluation
    console.log("[Evaluation] => ii) : Dispatching answer sheet PDF or images and template JSON to AI Evaluation Service (AS-parsing)...");
    let evaluationData;
    try {
      const fileArray=[...files];
      evaluationData = await aiService.evaluateAnswers(
        fileArray,
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

/**
 * Handles GET /api/evaluations/paper/:examPaperId
 *
 * Retrieves all evaluations for an exam paper, after verifying ownership.
 */
const getEvaluations = async (req, res, next) => {
  const { examPaperId } = req.params;
  const userId = req.user.id;
  console.log(`[Evaluation] >>> Incoming GET /api/evaluations/paper/${examPaperId}. User: ${userId}`);

  try {
    if (!examPaperId) {
      console.warn("[Evaluation] Validation failed: Missing examPaperId parameter.");
      return res.status(400).json({
        success: false,
        error: "Missing examPaperId parameter.",
      });
    }

    // Verify ownership of the exam paper before returning evaluations
    try {
      await evaluationService.getQuestionPaperById(examPaperId, userId);
    } catch (ownerError) {
      if (ownerError.statusCode === 403 || ownerError.statusCode === 404) {
        return res.status(ownerError.statusCode).json({
          success: false,
          error: ownerError.message,
        });
      }
      throw ownerError;
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

/**
 * Handles DELETE /api/evaluations/:id
 *
 * Deletes an individual student evaluation after verifying ownership
 * through the parent exam paper.
 */
const deleteEvaluation = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  console.log(`[Evaluation] >>> Incoming DELETE /api/evaluations/${id}. User: ${userId}`);

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Missing evaluation ID.",
      });
    }

    const result = await evaluationService.deleteEvaluation(id, userId);
    console.log(`[Evaluation] <<< Successfully deleted evaluation ID: ${result.id}`);

    return res.status(200).json({
      success: true,
      message: "Evaluation deleted successfully.",
      deletedId: result.id,
    });
  } catch (error) {
    console.error(`[Evaluation] [FATAL ERROR] => ${error.message}`);
    next(error);
  }
};

module.exports = {
  uploadAnswers,
  getEvaluations,
  deleteEvaluation,
};
