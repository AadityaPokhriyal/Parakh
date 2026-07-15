const supabase = require("../config/supabase");

/**
 * Fetches an exam paper (question paper) by its ID from Supabase.
 *
 * @param {string} id - The UUID of the exam paper
 * @returns {Object} The exam paper record
 */
const getQuestionPaperById = async (id) => {
  if (!supabase) {
    const configError = new Error(
      "Database configuration is missing. Supabase is not configured on this server."
    );
    configError.statusCode = 500;
    throw configError;
  }

  const { data, error } = await supabase
    .from("exam_papers")
    .select("id, parsed_data, pdf_filename")
    .eq("id", id)
    .single();

  if (error) {
    const dbError = new Error(`Database error: ${error.message}`);
    dbError.statusCode = error.code === "PGRST116" ? 404 : 500; // PGRST116 is single record not found
    throw dbError;
  }

  return data;
};

/**
 * Stores the evaluated student answer sheet results in Supabase.
 * Follows the fields based on studentMetadata in answerSheet.json.
 *
 * @param {string} examPaperId - The associated question paper's UUID
 * @param {Object} evaluationData - The exact grading response JSON from the AI service
 * @param {string} pdfFilename - The filename of the student's answer sheet
 * @param {string} [studentName] - The optional name of the student provided by user input
 * @returns {Object} The inserted record containing id and created_at
 */
const storeEvaluation = async (examPaperId, evaluationData, pdfFilename, studentName) => {
  if (!supabase) {
    const configError = new Error(
      "Database configuration is missing. Supabase is not configured on this server."
    );
    configError.statusCode = 500;
    throw configError;
  }

  const studentMetadata = evaluationData.studentMetadata || {};

  // Calculate student's total obtained marks from the evaluation answer blocks
  let obtainedMarks = 0;
  if (evaluationData && Array.isArray(evaluationData.answerBlocks)) {
    obtainedMarks = evaluationData.answerBlocks.reduce((sum, block) => {
      return sum + (block.earnedMarks?.value || 0);
    }, 0);
  }

  // Fetch max marks from the associated question paper
  let maxMarks = 0;
  try {
    const examPaper = await getQuestionPaperById(examPaperId);
    if (examPaper && examPaper.parsed_data && examPaper.parsed_data.paperMetadata) {
      maxMarks = examPaper.parsed_data.paperMetadata.totalMarks || 0;
    }
  } catch (err) {
    console.warn(`Failed to retrieve max marks from question paper: ${err.message}`);
  }

  const record = {
    exam_paper_id: examPaperId,
    pdf_filename: pdfFilename,
    parsed_data: evaluationData,
    student_name: studentName || studentMetadata.name || "",
    roll_number: studentMetadata.rollNumber || "",
    exam_code: studentMetadata.examCode || "",
    subject: studentMetadata.subject || "",
    obtained_marks: obtainedMarks,
    max_marks: maxMarks,
  };

  const { data, error } = await supabase
    .from("evaluations")
    .insert(record)
    .select("id, created_at, obtained_marks, max_marks")
    .single();

  if (error) {
    const dbError = new Error(`Database error: ${error.message}`);
    dbError.statusCode = 500;
    throw dbError;
  }

  return data;
};

/**
 * Fetches all evaluation results for a specific question paper.
 *
 * @param {string} examPaperId - The UUID of the question paper
 * @returns {Array} List of evaluation records
 */
const getEvaluationsByPaperId = async (examPaperId) => {
  if (!supabase) {
    const configError = new Error(
      "Database configuration is missing. Supabase is not configured on this server."
    );
    configError.statusCode = 500;
    throw configError;
  }

  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .eq("exam_paper_id", examPaperId)
    .order("created_at", { ascending: true });

  if (error) {
    const dbError = new Error(`Database error: ${error.message}`);
    dbError.statusCode = 500;
    throw dbError;
  }

  return data || [];
};

module.exports = {
  getQuestionPaperById,
  storeEvaluation,
  getEvaluationsByPaperId,
};
