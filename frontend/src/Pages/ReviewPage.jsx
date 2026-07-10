import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QuestionNode from "../components/QuestionNode";

function ReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [paperData, setPaperData] = useState(null);
  const [filename, setFilename] = useState("unknown_paper.pdf");
  const [submitStatus, setSubmitStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (location.state) {
      // Real backend response wraps data inside "questionPaper" key
      const data = location.state.questionPaper || location.state;
      setPaperData(data);
      if (location.state.filename) {
        setFilename(location.state.filename);
      } else if (location.state.pdf_filename) {
        setFilename(location.state.pdf_filename);
      } else {
        // Fallback for mock data testing
        setFilename("mock_question_paper.pdf");
      }
    }
  }, [location.state]);

  // Deep recursive update function
  const updateQuestionInTree = (questions, id, updates) => {
    return questions.map((q) => {
      if (q.id === id) {
        return { ...q, ...updates };
      }
      if (q.children && q.children.length > 0) {
        return { ...q, children: updateQuestionInTree(q.children, id, updates) };
      }
      return q;
    });
  };

  const handleUpdate = (id, updates) => {
    setPaperData((prev) => {
      if (!prev || !prev.questions) return prev;
      return {
        ...prev,
        questions: updateQuestionInTree(prev.questions, id, updates)
      };
    });
  };

  const handleSubmit = async () => {
    setSubmitStatus("submitting");
    setErrorMessage("");

    try {
      const backendBase = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${backendBase}/api/exams/generate-rubric`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdf_filename: filename,
          parsed_data: paperData,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus("success");
      } else {
        setSubmitStatus("error");
        setErrorMessage(data.error || `Server responded with status ${response.status}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitStatus("error");
      setErrorMessage(error.message || "Failed to submit review. Connection error.");
    }
  };

  if (!paperData) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <h2>No Question Paper Data Found</h2>
          <p style={{ color: "#94a3b8", margin: "16px 0" }}>Please go back and upload a PDF or images to begin.</p>
          <button onClick={() => navigate("/upload")} style={styles.submitBtn}>
            ← Go to Upload
          </button>
        </div>
      </div>
    );
  }

  if (submitStatus === "success") {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Question Paper Submitted Successfully!</h2>
          <p style={styles.successText}>
            The question paper and its rubrics for <strong>{filename}</strong> have been saved successfully to the database.
          </p>
          <button onClick={() => navigate("/")} style={styles.submitBtn}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Step 2: Question Review & Rubrics</h1>
        <p style={styles.subtitle}>
          Reviewing: <strong>{filename}</strong>
        </p>
        <p style={{ ...styles.subtitle, fontSize: "14px", marginTop: "4px" }}>
          Review parsed questions, adjust marks, setup rubrics, and toggle diagram requirements.
        </p>
      </header>

      {submitStatus === "error" && (
        <div style={styles.errorAlert}>
          <strong>Error: </strong> {errorMessage}
        </div>
      )}

      <main style={styles.main}>
        {paperData.questions && paperData.questions.length > 0 ? (
          paperData.questions.map((q) => (
            <QuestionNode 
              key={q.id} 
              question={q} 
              onUpdate={handleUpdate} 
            />
          ))
        ) : (
          <p>No questions found in the document.</p>
        )}
      </main>

      <footer style={styles.footer}>
        <button 
          onClick={handleSubmit} 
          disabled={submitStatus === "submitting"}
          style={{
            ...styles.submitBtn,
            opacity: submitStatus === "submitting" ? 0.7 : 1,
            cursor: submitStatus === "submitting" ? "not-allowed" : "pointer"
          }}
        >
          {submitStatus === "submitting" ? "Saving..." : "Submit Review"}
        </button>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0b1120",
    color: "#fff",
    padding: "40px 24px",
    fontFamily: "system-ui, -apple-system, sans-serif"
  },
  header: {
    maxWidth: "1000px",
    margin: "0 auto 32px",
    paddingBottom: "20px",
    borderBottom: "1px solid #28354d",
    textAlign: "center"
  },
  title: {
    fontSize: "36px",
    fontWeight: "800",
    margin: "0 0 10px 0",
    background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  subtitle: {
    fontSize: "16px",
    color: "#cbd5e1",
    margin: 0,
    lineHeight: "1.6"
  },
  main: {
    maxWidth: "1000px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  footer: {
    maxWidth: "1000px",
    margin: "32px auto 0",
    paddingTop: "24px",
    borderTop: "1px solid #28354d",
    display: "flex",
    justifyContent: "flex-end"
  },
  submitBtn: {
    background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
    color: "white",
    border: "none",
    padding: "14px 28px",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center"
  },
  successCard: {
    maxWidth: "600px",
    margin: "80px auto",
    background: "#172033",
    border: "1px solid #28354d",
    borderRadius: "24px",
    padding: "48px 32px",
    textAlign: "center",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)"
  },
  successIcon: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "rgba(16, 185, 129, 0.1)",
    border: "2px solid #10b981",
    color: "#10b981",
    fontSize: "36px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px"
  },
  successTitle: {
    fontSize: "28px",
    fontWeight: "800",
    marginBottom: "16px",
    color: "#fff"
  },
  successText: {
    fontSize: "16px",
    color: "#94a3b8",
    lineHeight: "1.6",
    marginBottom: "32px"
  },
  errorAlert: {
    maxWidth: "1000px",
    margin: "0 auto 20px",
    padding: "12px 16px",
    borderRadius: "8px",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    fontSize: "14px"
  }
};

export default ReviewPage;