const axios = require("axios");
const FormData = require("form-data");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Sends the PDF buffer to the AI service for question paper parsing.
 * Returns the exact JSON response from the AI service without any modification.
 *
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @param {string} originalFilename - The original filename of the uploaded PDF
 * @returns {Object} The parsed question paper JSON (exact format from AI service)
 */
const parseQuestionPaper = async (pdfBuffer, originalFilename) => {
  const formData = new FormData();
  formData.append("QP", pdfBuffer, {
    filename: originalFilename,
    contentType: "application/pdf",
  });

  const response = await axios.post(
    `${AI_SERVICE_URL}/ai/parse-question-paper`,
    formData,
    {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 300000, // 2 minutes timeout for AI processing
    }
  );

  // Return the exact JSON response — no transformation
  return response.data;
};

module.exports = { parseQuestionPaper };

