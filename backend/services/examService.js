const supabase = require("../config/supabase");

/**
 * Stores the parsed exam paper data in Supabase.
 * The parsed JSON is stored exactly as received from the AI service —
 * no normalization, no restructuring, not a single character changed.
 *
 * @param {Object} parsedData - The exact JSON from the AI service (questionPaper.json format)
 * @param {string} pdfFilename - The original PDF filename
 * @returns {Object} The inserted record with its generated ID
 */
const storeExamPaper = async (parsedData, pdfFilename) => {
  const { data, error } = await supabase
    .from("exam_papers")
    .insert({
      pdf_filename: pdfFilename,
      parsed_data: parsedData, // Exact JSON, stored as-is in JSONB
    })
    .select("id, created_at")
    .single();

  if (error) {
    const dbError = new Error(`Database error: ${error.message}`);
    dbError.statusCode = 500;
    throw dbError;
  }

  return data;
};

module.exports = { storeExamPaper };
