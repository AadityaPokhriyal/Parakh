const axios = require("axios");
const FormData = require("form-data");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:3000";
const AI_EVALUATION_SERVICE_URL = process.env.AI_EVALUATION_SERVICE_URL || "http://localhost:8000";

/**
 * Sends formData to the Question Paper parsing server and gets the response.
 * Returns the exact JSON response from the AI service without any modification.
 *
 * @returns {Object} The parsed question paper JSON (exact format from AI service)
 */
const parseQuestionPaper = async (files) => {
  const formData = new FormData();
  //formData contains key, buffer of file, file header or normal string containing fileName.

  files.forEach((file) => {
    console.log(file.originalname, file.mimetype);
    formData.append("QP", file.buffer,
      {
        filename: file.originalname,
        contentType: file.mimetype,
      }
    )
  });


  const response = await axios.post(
    `${AI_SERVICE_URL}/ai/parse-question-paper`,
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${process.env.QP_PARSING_SECRET}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 600000, // 10 minutes timeout for AI processing
    }
  );

  // Return the exact JSON response — no transformation
  return response.data;
};

/**
 * Sends the student answer sheet PDF and the question paper JSON to the FastAPI AI service at port 8000.
 *
 * @param {Array<Object>} files - Array of files containing student answer sheets
 * @param {Object} questionJsonData - The question paper JSON retrieved from database
 * @returns {Object} The evaluated grading JSON response from the AI service
 */
const evaluateAnswers = async (files, questionJsonData) => {
  const formData = new FormData();
  files.forEach((file) => {
    const ext = (file.originalname || "").toLowerCase();
    let contentType = file.mimetype;
    if (!contentType || contentType === "application/octet-stream") {
      if (ext.endsWith(".pdf")) contentType = "application/pdf";
      else if (ext.endsWith(".png")) contentType = "image/png";
      else if (ext.endsWith(".jpg") || ext.endsWith(".jpeg")) contentType = "image/jpeg";
      else if (ext.endsWith(".webp")) contentType = "image/webp";
      else contentType = "image/png";
    }

    formData.append("answers", file.buffer, {
      filename: file.originalname,
      contentType: contentType,
    });
    console.log(file.originalname, contentType);
  });

  const questionJsonBuffer = Buffer.from(JSON.stringify(questionJsonData));
  formData.append("question_json", questionJsonBuffer, {
    filename: "question_paper.json",
    contentType: "application/json",
  });

  const response = await axios.post(
    `${AI_EVALUATION_SERVICE_URL}/ai/evaluate-answers`,
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${process.env.AS_PARSING_SECRET}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 600000, // 10 minutes timeout for AI processing
    }
  );

  return response.data;
};

module.exports = {
  parseQuestionPaper,
  evaluateAnswers,
};


