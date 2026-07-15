import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEvaluation, createBlankSheet } from "../context/EvaluationContext";

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// ── Component ────────────────────────────────────────────────────────────────

function UploadAnswersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    sheets,
    isBulkUploading,
    bulkProgress,
    examPaperId: contextExamPaperId,
    filename: contextFilename,
    totalMarks: contextTotalMarks,
    setExamInfo,
    updateSheet,
    handleAddSheet,
    handleDuplicateSheet,
    handleDeleteSheet,
    handleResetSheet,
    uploadSingleSheet,
    handleSubmitAll,
    isLoading: isContextLoading,
  } = useEvaluation();

  const stateExamPaperId = location.state?.examPaperId;
  const stateFilename = location.state?.filename;
  const stateTotalMarks = location.state?.totalMarks;

  const examPaperId = stateExamPaperId || contextExamPaperId;
  const filename = stateFilename || contextFilename;
  const totalMarks = stateTotalMarks !== undefined ? stateTotalMarks : contextTotalMarks;

  // We keep a Map of refs keyed by sheet id for file inputs
  const fileInputRefs = useRef({});

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!examPaperId) {
    return (
      <div style={styles.invalidContainer}>
        <h2>Invalid Access</h2>
        <p style={{ color: "var(--text)", margin: "12px 0 24px" }}>
          Please upload and submit a question paper first.
        </p>
        <button onClick={() => navigate("/")} style={styles.submitButton}>
          Return Home
        </button>
      </div>
    );
  }

  // ── Initialize Context ────────────────────────────────────────────────────
  useEffect(() => {
    if (examPaperId && examPaperId !== contextExamPaperId) {
      setExamInfo({ examPaperId, filename, totalMarks });
    }
  }, [examPaperId, filename, totalMarks, contextExamPaperId, setExamInfo]);

  // ── File handling (scoped per sheet) ──────────────────────────────────────

  const validateAndSetFile = (id, fileList) => {
    const selectedFiles = Array.from(fileList);
    if (selectedFiles.length === 0) return;
    const firstFile = selectedFiles[0];

    if (firstFile.type === "application/pdf" || firstFile.name.toLowerCase().endsWith(".pdf")) {
      if (selectedFiles.length > 1) {
        updateSheet(id, { errorMessage: "Please select only one PDF answer sheet.", uploadStatus: "error", files: [] });
        return;
      }
      updateSheet(id, { files: [firstFile], uploadStatus: "idle", errorMessage: "" });
    } else {
      updateSheet(id, { errorMessage: "Invalid file type. The student answer sheet must be a PDF file.", uploadStatus: "error", files: [] });
    }
  };

  const handleDrag = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      updateSheet(id, { dragActive: true });
    } else if (e.type === "dragleave") {
      updateSheet(id, { dragActive: false });
    }
  };

  const handleDrop = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    updateSheet(id, { dragActive: false });
    if (e.dataTransfer.files) validateAndSetFile(id, e.dataTransfer.files);
  };

  const handleFileChange = (id, e) => {
    if (e.target.files) validateAndSetFile(id, e.target.files);
  };

  const triggerFilePicker = (id) => {
    const input = fileInputRefs.current[id];
    if (input) input.click();
  };

  const handleIndividualUpload = (id, e) => {
    e.preventDefault();
    const sheet = sheets.find((s) => s.id === id);
    if (sheet) uploadSingleSheet(sheet);
  };

  const navigateToResults = () => {
    navigate("/evaluation/results");
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const eligibleCount = sheets.filter((s) => s.files.length > 0 && s.uploadStatus !== "success").length;
  const anyUploading = sheets.some((s) => s.uploadStatus === "uploading");
  const globalDisabled = isBulkUploading || anyUploading;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      <div style={styles.outerCard}>
        {/* ── Page header ─────────────────────────────────────────── */}
        <div>
          <h2 style={styles.title}>Step 3: Upload Student Answer Sheets</h2>
          <p style={styles.subtitle}>
            Upload one or more student answer sheets for AI grading against the active question paper
          </p>
        </div>

        {/* ── Associated question paper ───────────────────────────── */}
        <div style={styles.infoCard}>
          <h4 style={styles.infoTitle}>Associated Question Paper</h4>
          <p style={styles.infoText}>📄 {filename}</p>
          <p style={styles.infoSubtext}>Exam Paper ID: {examPaperId}</p>
        </div>

        {/* ── Global progress bar (visible during bulk upload) ───── */}
        {isBulkUploading && (
          <div style={styles.globalProgressWrapper}>
            <div style={styles.globalProgressHeader}>
              <span style={styles.globalProgressLabel}>
                Evaluating Sheets: {bulkProgress.current} / {bulkProgress.total} completed
              </span>
              <span style={styles.globalProgressSuccess}>
                ✓ {bulkProgress.successCount} successful
              </span>
            </div>
            <div style={styles.globalProgressTrack}>
              <div
                style={{
                  ...styles.globalProgressFill,
                  width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* ── Sheet cards ─────────────────────────────────────────── */}
        {isContextLoading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text)" }}>
            <p>Loading previous evaluations from database...</p>
          </div>
        ) : (
          <div style={styles.sheetsContainer}>
            {sheets.map((sheet, index) => {
            const isActive = isBulkUploading && sheet.uploadStatus === "uploading";

            return (
              <div
                key={sheet.id}
                style={{
                  ...styles.sheetCard,
                  ...(isActive ? styles.sheetCardActive : {}),
                  ...(sheet.uploadStatus === "success" ? styles.sheetCardSuccess : {}),
                  ...(sheet.uploadStatus === "error" ? styles.sheetCardError : {}),
                }}
              >
                {/* Card header */}
                <div style={styles.sheetHeader}>
                  <div style={styles.sheetHeaderLeft}>
                    <span style={styles.sheetBadge}>#{index + 1}</span>
                    <span style={styles.sheetHeaderTitle}>Answer Sheet</span>
                    {sheet.uploadStatus === "success" && (
                      <span style={styles.statusTagSuccess}>✓ Evaluated</span>
                    )}
                    {sheet.uploadStatus === "error" && (
                      <span style={styles.statusTagError}>✕ Failed</span>
                    )}
                    {sheet.uploadStatus === "uploading" && (
                      <span style={styles.statusTagUploading}>⟳ Evaluating…</span>
                    )}
                  </div>
                  {sheets.length > 1 && !globalDisabled && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSheet(sheet.id)}
                      style={styles.deleteSheetButton}
                      title="Remove this answer sheet"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Student name input */}
                <div style={styles.inputGroup}>
                  <label htmlFor={`student-name-${sheet.id}`} style={styles.label}>Student Name</label>
                  <input
                    id={`student-name-${sheet.id}`}
                    type="text"
                    placeholder="Enter student name (e.g. John Doe)"
                    value={sheet.studentName}
                    onChange={(e) => updateSheet(sheet.id, { studentName: e.target.value })}
                    style={styles.textInput}
                    disabled={globalDisabled || sheet.uploadStatus === "success"}
                  />
                </div>

                {/* Hidden file input */}
                <input
                  ref={(el) => { fileInputRefs.current[sheet.id] = el; }}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => handleFileChange(sheet.id, e)}
                  style={styles.hiddenInput}
                />

                {/* Drop zone (shown when no file selected) */}
                {sheet.files.length === 0 && sheet.uploadStatus !== "success" && (
                  <div
                    style={{
                      ...styles.dropZone,
                      borderColor: sheet.dragActive ? "var(--accent)" : "var(--border)",
                      backgroundColor: sheet.dragActive ? "var(--accent-bg)" : "transparent",
                      pointerEvents: globalDisabled ? "none" : "auto",
                      opacity: globalDisabled ? 0.5 : 1,
                    }}
                    onDragEnter={(e) => handleDrag(sheet.id, e)}
                    onDragOver={(e) => handleDrag(sheet.id, e)}
                    onDragLeave={(e) => handleDrag(sheet.id, e)}
                    onDrop={(e) => handleDrop(sheet.id, e)}
                    onClick={() => triggerFilePicker(sheet.id)}
                  >
                    <div style={styles.iconContainer}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <p style={styles.dropText}>
                      Drag & drop answer sheet here, or <span style={styles.browseText}>browse</span>
                    </p>
                    <p style={styles.limitText}>Only PDF files accepted (Max 20 MB)</p>
                  </div>
                )}

                {/* Selected file details */}
                {sheet.files.length > 0 && (
                  <div style={styles.fileDetailsCard}>
                    <div style={styles.fileDetailsRow}>
                      <div style={styles.pdfBadge}>
                        <span style={styles.pdfBadgeText}>PDF</span>
                      </div>
                      <div style={styles.fileMeta}>
                        <p style={styles.fileName}>{sheet.files[0].name}</p>
                        <p style={styles.fileSize}>{formatFileSize(sheet.files[0].size)}</p>
                      </div>
                      {sheet.uploadStatus !== "uploading" && sheet.uploadStatus !== "success" && !globalDisabled && (
                        <button
                          type="button"
                          onClick={() => handleResetSheet(sheet.id)}
                          style={styles.removeButton}
                          title="Remove selected file"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Per‑card uploading indicator */}
                    {sheet.uploadStatus === "uploading" && (
                      <div style={styles.progressContainer}>
                        <div style={styles.progressBarContainer}>
                          <div style={styles.progressBar} />
                        </div>
                        <p style={styles.progressText}>Evaluating answer sheet with AI, please wait…</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Per‑card error */}
                {sheet.uploadStatus === "error" && sheet.errorMessage && (
                  <div style={styles.errorAlert}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{sheet.errorMessage}</span>
                  </div>
                )}

                {/* Per‑card success */}
                {sheet.uploadStatus === "success" && (
                  <div style={styles.successAlert}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, flexShrink: 0 }}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <div>
                      <strong style={{ display: "block" }}>Evaluation Completed Successfully!</strong>
                      <span style={{ fontSize: "13px" }}>
                        Record ID: {sheet.responseData?.evaluationId}. Evaluated student: {sheet.responseData?.evaluationData?.studentMetadata?.name || sheet.studentName || "Unknown"}.
                      </span>
                    </div>
                  </div>
                )}

                {/* Per‑card action row */}
                <div style={styles.cardActionRow}>

                  {/* Individual submit */}
                  {sheet.files.length > 0 && sheet.uploadStatus !== "success" && (
                    <button
                      type="button"
                      onClick={(e) => handleIndividualUpload(sheet.id, e)}
                      disabled={globalDisabled}
                      style={{
                        ...styles.individualSubmitButton,
                        backgroundColor: globalDisabled ? "var(--border)" : "var(--accent)",
                        cursor: globalDisabled ? "not-allowed" : "pointer",
                      }}
                    >
                      {sheet.uploadStatus === "uploading" ? "Evaluating…" : "Upload & Evaluate"}
                    </button>
                  )}

                  {/* Reset (after success/error) */}
                  {(sheet.uploadStatus === "success" || sheet.uploadStatus === "error") && !globalDisabled && (
                    <button
                      type="button"
                      onClick={() => handleResetSheet(sheet.id)}
                      style={styles.resetButton}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* ── Add sheet button ────────────────────────────────────── */}
        {!globalDisabled && (
          <button
            type="button"
            onClick={handleAddSheet}
            style={styles.addSheetButton}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Another Answer Sheet
          </button>
        )}

        {/* ── Bulk progress summary (after completion) ────────────── */}
        {!isBulkUploading && bulkProgress.total > 0 && (
          <div
            style={{
              ...styles.bulkSummary,
              backgroundColor: bulkProgress.successCount === 0 
                ? "rgba(239, 68, 68, 0.08)" 
                : bulkProgress.successCount < bulkProgress.total 
                  ? "rgba(245, 158, 11, 0.08)" 
                  : "rgba(16, 185, 129, 0.08)",
              borderColor: bulkProgress.successCount === 0 
                ? "rgba(239, 68, 68, 0.2)" 
                : bulkProgress.successCount < bulkProgress.total 
                  ? "rgba(245, 158, 11, 0.2)" 
                  : "rgba(16, 185, 129, 0.2)",
            }}
          >
            <span
              style={{
                ...styles.bulkSummaryText,
                color: bulkProgress.successCount === 0 
                  ? "#ef4444" 
                  : bulkProgress.successCount < bulkProgress.total 
                    ? "#f59e0b" 
                    : "#10b981",
              }}
            >
              {bulkProgress.successCount === bulkProgress.total
                ? `Batch complete — All ${bulkProgress.total} sheets evaluated successfully!`
                : bulkProgress.successCount === 0
                  ? `Batch complete — Evaluation failed for all ${bulkProgress.total} sheets.`
                  : `Batch complete — ${bulkProgress.successCount} of ${bulkProgress.total} sheets evaluated successfully, ${bulkProgress.total - bulkProgress.successCount} failed.`}
            </span>
          </div>
        )}

        {/* ── Global action row ──────────────────────────────────── */}
        <div style={styles.globalActionRow}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={styles.backButton}
          >
            Back to Home
          </button>

          {sheets.some((s) => s.uploadStatus === "success") && (
            <button
              type="button"
              onClick={navigateToResults}
              style={{
                ...styles.submitAllButton,
                backgroundColor: "#10b981",
                cursor: "pointer",
                boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2), 0 2px 4px -1px rgba(16, 185, 129, 0.1)",
              }}
            >
              View Results →
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmitAll}
            disabled={globalDisabled || eligibleCount === 0}
            style={{
              ...styles.submitAllButton,
              backgroundColor: globalDisabled || eligibleCount === 0 ? "var(--border)" : "var(--accent)",
              cursor: globalDisabled || eligibleCount === 0 ? "not-allowed" : "pointer",
            }}
          >
            {isBulkUploading
              ? `Evaluating… (${bulkProgress.current}/${bulkProgress.total})`
              : `Submit All (${eligibleCount} sheet${eligibleCount !== 1 ? "s" : ""})`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    padding: "40px 20px",
    width: "100%",
    minHeight: "100vh",
    boxSizing: "border-box",
    backgroundColor: "var(--bg)",
  },
  invalidContainer: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    gap: "16px",
    backgroundColor: "var(--bg)",
    color: "var(--text-h)",
  },
  outerCard: {
    width: "100%",
    maxWidth: "680px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "700",
    color: "var(--text-h)",
  },
  subtitle: {
    color: "var(--text)",
    margin: "8px 0 0 0",
    fontSize: "15px",
    lineHeight: "140%",
  },

  // Info card
  infoCard: {
    background: "var(--accent-bg)",
    border: "1px solid var(--accent-border, rgba(192, 132, 252, 0.3))",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  infoTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
    color: "var(--accent)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  infoText: { margin: 0, fontSize: "15px", color: "var(--text-h)" },
  infoSubtext: { margin: 0, fontSize: "12px", color: "var(--text)" },

  // Global progress
  globalProgressWrapper: {
    padding: "16px 20px",
    borderRadius: "12px",
    background: "var(--accent-bg)",
    border: "1px solid var(--accent-border, rgba(192, 132, 252, 0.3))",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  globalProgressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
  },
  globalProgressLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--text-h)",
  },
  globalProgressSuccess: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#10b981",
  },
  globalProgressTrack: {
    height: "8px",
    width: "100%",
    backgroundColor: "var(--border)",
    borderRadius: "4px",
    overflow: "hidden",
  },
  globalProgressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #a855f7, #c084fc)",
    borderRadius: "4px",
    transition: "width 0.4s ease",
  },

  // Sheet list
  sheetsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  // Individual sheet card
  sheetCard: {
    padding: "24px",
    borderRadius: "14px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    boxShadow: "rgba(0,0,0,0.06) 0 4px 12px -2px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    transition: "box-shadow 0.3s ease, border-color 0.3s ease",
  },
  sheetCardActive: {
    borderColor: "var(--accent)",
    boxShadow: "0 0 0 3px var(--accent-bg), rgba(0,0,0,0.06) 0 4px 12px -2px",
  },
  sheetCardSuccess: {
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  sheetCardError: {
    borderColor: "rgba(239, 68, 68, 0.3)",
  },

  // Sheet header
  sheetHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  sheetBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "var(--accent-bg)",
    color: "var(--accent)",
    fontSize: "13px",
    fontWeight: "700",
  },
  sheetHeaderTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--text-h)",
  },
  statusTagSuccess: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#10b981",
    background: "rgba(16, 185, 129, 0.1)",
    padding: "3px 8px",
    borderRadius: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  statusTagError: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#ef4444",
    background: "rgba(239, 68, 68, 0.1)",
    padding: "3px 8px",
    borderRadius: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  statusTagUploading: {
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--accent)",
    background: "var(--accent-bg)",
    padding: "3px 8px",
    borderRadius: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  deleteSheetButton: {
    background: "transparent",
    border: "none",
    color: "var(--text)",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s, background 0.2s",
  },

  // Form fields
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-h)",
  },
  textInput: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "var(--code-bg)",
    color: "var(--text-h)",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  hiddenInput: { display: "none" },

  // Drop zone
  dropZone: {
    borderWidth: "2px",
    borderStyle: "dashed",
    borderRadius: "12px",
    padding: "30px 20px",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s ease, background-color 0.2s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  iconContainer: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    backgroundColor: "var(--accent-bg)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  dropText: { fontSize: "14px", color: "var(--text-h)", margin: 0 },
  browseText: { color: "var(--accent)", fontWeight: "600", textDecoration: "underline" },
  limitText: { fontSize: "12px", color: "var(--text)", margin: 0 },

  // File details
  fileDetailsCard: {
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    backgroundColor: "var(--code-bg)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  fileDetailsRow: { display: "flex", alignItems: "center", gap: "12px" },
  pdfBadge: {
    padding: "5px 9px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: "1px solid rgba(239, 68, 68, 0.2)",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  pdfBadgeText: { fontWeight: "bold", fontSize: "11px", letterSpacing: "0.5px", color: "#ef4444" },
  fileMeta: { flex: 1, minWidth: 0 },
  fileName: {
    margin: 0, fontSize: "13px", fontWeight: "600", color: "var(--text-h)",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  fileSize: { margin: "2px 0 0 0", fontSize: "11px", color: "var(--text)" },
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

  // Progress (per card)
  progressContainer: { width: "100%" },
  progressBarContainer: {
    height: "5px",
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
    margin: "6px 0 0 0",
    fontSize: "11px",
    color: "var(--text)",
    textAlign: "center",
    fontStyle: "italic",
  },

  // Alerts
  errorAlert: {
    padding: "10px 14px",
    borderRadius: "8px",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    lineHeight: "140%",
  },
  successAlert: {
    padding: "10px 14px",
    borderRadius: "8px",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    color: "#10b981",
    fontSize: "13px",
    display: "flex",
    alignItems: "flex-start",
    lineHeight: "140%",
  },

  // Per‑card actions
  cardActionRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    paddingTop: "4px",
    borderTop: "1px solid var(--border)",
  },
  duplicateButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    borderRadius: "7px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text-h)",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s, border-color 0.2s",
  },
  individualSubmitButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 16px",
    borderRadius: "7px",
    border: "none",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "600",
    transition: "background-color 0.2s ease",
  },
  resetButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    borderRadius: "7px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text)",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s",
  },

  // Add sheet button
  addSheetButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "2px dashed var(--border)",
    background: "transparent",
    color: "var(--text)",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "border-color 0.2s, color 0.2s, background 0.2s",
  },

  // Bulk summary
  bulkSummary: {
    padding: "12px 16px",
    borderRadius: "10px",
    background: "rgba(16, 185, 129, 0.08)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    textAlign: "center",
  },
  bulkSummaryText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#10b981",
  },

  // Global actions
  globalActionRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "8px",
    flexWrap: "wrap",
  },
  backButton: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text-h)",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  submitButton: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    backgroundColor: "var(--accent)",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  },
  submitAllButton: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    transition: "background-color 0.2s ease",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
};

// ── Inject shimmer animation ─────────────────────────────────────────────────
if (typeof document !== "undefined") {
  const id = "upload-answers-keyframes";
  if (!document.getElementById(id)) {
    const styleSheet = document.createElement("style");
    styleSheet.id = id;
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}

export default UploadAnswersPage;