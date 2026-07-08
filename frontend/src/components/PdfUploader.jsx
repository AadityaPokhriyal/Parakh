import { useState, useRef } from "react";

export default function PdfUploader() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle | uploading | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [responseData, setResponseData] = useState(null);
  const fileInputRef = useRef(null);
  const backendUrl = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/exams/upload-paper`;

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop events
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file input selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // Validate that the file is indeed a PDF
  const validateAndSetFile = (selectedFile) => {
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.endsWith(".pdf")) {
      setErrorMessage("Invalid file type. Please select a PDF file.");
      setUploadStatus("error");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setUploadStatus("idle");
    setErrorMessage("");
    setResponseData(null);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Trigger input element click
  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  // Send the PDF to the backend
  const uploadPdfFile = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploadStatus("uploading");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log(`Sending POST request to: ${backendUrl}`);
      const response = await fetch(backendUrl, {
        method: "POST",
        body: formData,
        // Content-Type header must NOT be set manually when uploading FormData. 
        // The browser will automatically set it to multipart/form-data with the correct boundary.
      });

      // Log raw response object to console
      console.log("Raw Fetch Response Object:", response);

      const data = await response.json();
      
      // Log parsed response data to console
      console.log("Parsed Response JSON Data:", data);

      if (response.ok && data.success) {
        setUploadStatus("success");
        setResponseData(data);
      } else {
        setUploadStatus("error");
        setErrorMessage(data.error || `Server responded with status ${response.status}`);
      }
    } catch (error) {
      console.error("Network or parsing error:", error);
      setUploadStatus("error");
      setErrorMessage(error.message || "Failed to connect to the backend server.");
    }
  };

  // Reset the state to upload a new file
  const handleReset = () => {
    setFile(null);
    setUploadStatus("idle");
    setErrorMessage("");
    setResponseData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Upload Question Paper</h2>
        <p style={styles.subtitle}>Upload your exam PDF for automated AI parsing</p>

        <form onSubmit={uploadPdfFile} style={styles.form}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            style={styles.hiddenInput}
          />

          {/* Drag & Drop Area */}
          {!file && (
            <div
              style={{
                ...styles.dropZone,
                borderColor: dragActive ? "var(--accent)" : "var(--border)",
                backgroundColor: dragActive ? "var(--accent-bg)" : "transparent",
              }}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
            >
              <div style={styles.iconContainer}>
                {/* PDF SVG Icon */}
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M9 15h1.5a1.5 1.5 0 0 0 0-3H9v4Z" />
                  <path d="M12 12v4" />
                  <path d="M12 12h2" />
                </svg>
              </div>
              <p style={styles.dropText}>
                Drag & drop your PDF file here, or <span style={styles.browseText}>browse</span>
              </p>
              <p style={styles.limitText}>Maximum size: 20 MB</p>
            </div>
          )}

          {/* Selected File Details */}
          {file && (
            <div style={styles.fileDetailsCard}>
              <div style={styles.fileDetailsRow}>
                <div style={styles.pdfBadge}>
                  <span style={styles.pdfBadgeText}>PDF</span>
                </div>
                <div style={styles.fileMeta}>
                  <p style={styles.fileName}>{file.name}</p>
                  <p style={styles.fileSize}>{formatFileSize(file.size)}</p>
                </div>
                {uploadStatus !== "uploading" && (
                  <button
                    type="button"
                    onClick={handleReset}
                    style={styles.removeButton}
                    title="Remove file"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>

              {/* Progress bar for upload */}
              {uploadStatus === "uploading" && (
                <div style={styles.progressContainer}>
                  <div style={styles.progressBarContainer}>
                    <div style={styles.progressBar}></div>
                  </div>
                  <p style={styles.progressText}>Processing with AI, please wait...</p>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {uploadStatus === "error" && errorMessage && (
            <div style={styles.errorAlert}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: 8, flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {uploadStatus === "success" && (
            <div style={styles.successAlert}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: 8, flexShrink: 0 }}
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <div>
                <strong style={{ display: "block" }}>Parsing Successful!</strong>
                <span style={{ fontSize: "13px" }}>
                  Response logged in browser console. ID: {responseData?.examPaperId}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={styles.actionRow}>
            {file && uploadStatus !== "success" && (
              <button
                type="submit"
                disabled={uploadStatus === "uploading"}
                style={{
                  ...styles.submitButton,
                  backgroundColor: uploadStatus === "uploading" ? "var(--border)" : "var(--accent)",
                  cursor: uploadStatus === "uploading" ? "not-allowed" : "pointer",
                }}
              >
                {uploadStatus === "uploading" ? "Parsing..." : "Upload & Parse Paper"}
              </button>
            )}

            {uploadStatus === "success" && (
              <button
                type="button"
                onClick={handleReset}
                style={{
                  ...styles.submitButton,
                  backgroundColor: "var(--accent)",
                }}
              >
                Upload Another PDF
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
    width: "100%",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "550px",
    padding: "36px",
    borderRadius: "16px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    boxShadow: "var(--shadow)",
    textAlign: "left",
    boxSizing: "border-box",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "28px",
    fontWeight: "600",
  },
  subtitle: {
    color: "var(--text)",
    margin: "0 0 24px 0",
    fontSize: "15px",
    lineHeight: "140%",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  hiddenInput: {
    display: "none",
  },
  dropZone: {
    borderWidth: "2px",
    borderStyle: "dashed",
    borderRadius: "12px",
    padding: "40px 20px",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s ease, background-color 0.2s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  iconContainer: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: "var(--accent-bg)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  dropText: {
    fontSize: "15px",
    color: "var(--text-h)",
    margin: 0,
  },
  browseText: {
    color: "var(--accent)",
    fontWeight: "600",
    textDecoration: "underline",
  },
  limitText: {
    fontSize: "12px",
    color: "var(--text)",
    margin: 0,
  },
  fileDetailsCard: {
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    backgroundColor: "var(--code-bg)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  fileDetailsRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  pdfBadge: {
    padding: "6px 10px",
    borderRadius: "6px",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pdfBadgeText: {
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: "12px",
    letterSpacing: "0.5px",
  },
  fileMeta: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--text-h)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  fileSize: {
    margin: "2px 0 0 0",
    fontSize: "12px",
    color: "var(--text)",
  },
  removeButton: {
    background: "transparent",
    border: "none",
    color: "var(--text)",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s, background-color 0.2s",
  },
  progressContainer: {
    width: "100%",
  },
  progressBarContainer: {
    height: "6px",
    width: "100%",
    backgroundColor: "var(--border)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    width: "100%",
    background: "linear-gradient(90deg, var(--border) 0%, var(--accent) 50%, var(--border) 100%)",
    backgroundSize: "200% 100%",
    borderRadius: "3px",
    animation: "shimmer 1.5s infinite linear",
  },
  progressText: {
    margin: "8px 0 0 0",
    fontSize: "12px",
    color: "var(--text)",
    textAlign: "center",
    fontStyle: "italic",
  },
  errorAlert: {
    padding: "12px 16px",
    borderRadius: "8px",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    lineHeight: "140%",
  },
  successAlert: {
    padding: "12px 16px",
    borderRadius: "8px",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    color: "#10b981",
    fontSize: "14px",
    display: "flex",
    alignItems: "flex-start",
    lineHeight: "140%",
  },
  actionRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "8px",
  },
  submitButton: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    transition: "background-color 0.2s ease, transform 0.1s ease",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
};

// Add shimmer keyframe animation to document head if we are in client browser environment
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}
