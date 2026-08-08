require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const examRoutes = require("./routes/examRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : "*";

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/evaluations", evaluationRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler (must be after routes)
app.use(errorHandler);

// // Self Ping script for backend.
// const BackendPinger = setInterval(async () => {
//   try {
//     const response = await fetch(`${process.env.BACKEND_SERVICE_URL}/health`);
//     console.log("Get request for Backend server uptime. Status:", response.status);
//   } catch (error) {
//     console.error("Backend ping failed:", error.message);
//   }
// }, 10000);

// // Self Ping script for QP-parsing
// const QuestionPaperServicePinger = setInterval(async () => {
//   try {
//     const response = await fetch(`${process.env.AI_SERVICE_URL}/health`);
//     console.log("Get request for QP-Parsing server uptime. Status:", response.status);
//   } catch (error) {
//     console.error("QP-Parsing ping failed:", error.message);
//   }
// }, 10000);

// // Self Ping script for AS-parsing
// const AnswerSheetServicePinger = setInterval(async () => {
//   try {
//     const response = await fetch(`${process.env.AI_EVALUATION_SERVICE_URL}/health`);
//     console.log("Get request for AS-Parsing server uptime. Status:", response.status);
//   } catch (error) {
//     console.error("AS-Parsing ping failed:", error.message);
//   }
// }, 10000);


// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

module.exports = app;

