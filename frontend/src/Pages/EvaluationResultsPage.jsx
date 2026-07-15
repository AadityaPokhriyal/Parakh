import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEvaluation } from "../context/EvaluationContext";

// Helper to calculate total earned marks for a student evaluation
const calculateTotalMarks = (evaluationData) => {
  if (!evaluationData || !evaluationData.answerBlocks) return 0;
  return evaluationData.answerBlocks.reduce((sum, block) => {
    return sum + (block.earnedMarks?.value || 0);
  }, 0);
};

// Recursive Component to render answer blocks (Root, Child, Grandchild)
const AnswerBlockNode = ({ block, level = 1 }) => {
  const hasChildren = block.children && block.children.length > 0;
  const isAttempted = block.attemptStatus === "attempted" || block.attemptStatus === "partial";

  // Different padding/border based on depth level
  const paddingLeft = level === 1 ? "0px" : level === 2 ? "20px" : "35px";
  const borderLeft = level === 1 ? "none" : "3px solid var(--accent-border, rgba(168, 85, 247, 0.3))";

  return (
    <div
      style={{
        paddingLeft,
        borderLeft,
        marginTop: level === 1 ? "16px" : "12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div style={blockStyles.card}>
        {/* Header line */}
        <div style={blockStyles.header}>
          <div style={blockStyles.headerLeft}>
            <span style={level === 1 ? blockStyles.idBadge : blockStyles.subIdBadge}>
              {block.id}
            </span>
            <span
              style={{
                ...blockStyles.statusBadge,
                backgroundColor: isAttempted ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                color: isAttempted ? "#34d399" : "#f87171",
              }}
            >
              {block.attemptStatus}
            </span>
          </div>

          <div style={blockStyles.scoreBadge}>
            Score: <strong style={{ color: "#a78bfa" }}>{block.earnedMarks?.value ?? 0}</strong>
          </div>
        </div>

        {/* Answer Summary */}
        {block.answerSummary && (
          <div style={blockStyles.summarySection}>
            <div style={blockStyles.sectionLabel}>Student's Answer Summary</div>
            <p style={blockStyles.summaryText}>{block.answerSummary}</p>
          </div>
        )}

        {/* Satisfied / Criteria Met list */}
        {block.satisfies && block.satisfies.length > 0 && (
          <div style={blockStyles.listSection}>
            <div style={{ ...blockStyles.sectionLabel, color: "#10b981" }}>✓ Criteria Met</div>
            <ul style={blockStyles.list}>
              {block.satisfies.map((item, idx) => (
                <li key={idx} style={blockStyles.listItem}>
                  <span style={{ color: "#10b981", marginRight: "6px" }}>✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing / Unmet list */}
        {block.missing && block.missing.length > 0 && (
          <div style={blockStyles.listSection}>
            <div style={{ ...blockStyles.sectionLabel, color: "#ef4444" }}>✕ Missing / Unmet Points</div>
            <ul style={blockStyles.list}>
              {block.missing.map((item, idx) => (
                <li key={idx} style={blockStyles.listItem}>
                  <span style={{ color: "#ef4444", marginRight: "6px" }}>✕</span> {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Evaluation Reason */}
        {block.earnedMarks?.reason && (
          <div style={blockStyles.reasonBox}>
            <div style={blockStyles.reasonLabel}>AI Evaluation Note</div>
            <p style={blockStyles.reasonText}>{block.earnedMarks.reason}</p>
          </div>
        )}

        {/* Warnings or Issues if any */}
        {((block.errors && block.errors.length > 0) || (block.warnings && block.warnings.length > 0) || (block.issues && block.issues.length > 0)) && (
          <div style={blockStyles.issuesBox}>
            {block.issues?.map((issue, idx) => (
              <div key={`issue-${idx}`} style={blockStyles.issueItem}>⚡ Note: {issue}</div>
            ))}
            {block.warnings?.map((warn, idx) => (
              <div key={`warn-${idx}`} style={blockStyles.issueItem}>⚠ Warning: {warn}</div>
            ))}
            {block.errors?.map((err, idx) => (
              <div key={`err-${idx}`} style={{ ...blockStyles.issueItem, color: "#ef4444" }}>✕ Error: {err}</div>
            ))}
          </div>
        )}
      </div>

      {/* Render children elements recursively */}
      {hasChildren && (
        <div style={blockStyles.childrenWrapper}>
          {block.children.map((childBlock) => (
            <AnswerBlockNode
              key={childBlock.id}
              block={childBlock}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main step4 Page Component
function EvaluationResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { evaluations, totalMarks, isBulkUploading, bulkProgress, examPaperId, filename } = useEvaluation();
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Select first student by default
  useEffect(() => {
    if (evaluations.length > 0 && selectedId === null) {
      setSelectedId(evaluations[0].id);
    }
  }, [evaluations, selectedId]);

  if (evaluations.length === 0) {
    if (isBulkUploading) {
      return (
        <div style={styles.invalidContainer}>
          <h2>Evaluating Student Answer Sheets...</h2>
          <p style={{ color: "#94a3b8", margin: "12px 0 24px", maxWidth: "450px", textAlign: "center" }}>
            AI evaluation is running in the background ({bulkProgress.current} of {bulkProgress.total} sheets processed). Results will automatically load on this page as they finish grading.
          </p>
          <div style={{ ...styles.backgroundProgressTrack, width: "300px", height: "8px", marginBottom: "24px" }}>
            <div
              style={{
                ...styles.backgroundProgressFill,
                width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => navigate("/evaluation/upload", { state: { examPaperId, filename, totalMarks } })} style={styles.backHomeBtn}>
              ← Back to Uploading Sheets
            </button>
            <button onClick={() => navigate("/")} style={{ ...styles.sidebarReturnBtn, marginTop: 0 }}>
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.invalidContainer}>
        <h2>No Assessment Results Found</h2>
        <p style={{ color: "#94a3b8", margin: "12px 0 24px" }}>
          Please upload and successfully submit student answer sheets to view the evaluation dashboard.
        </p>
        <button onClick={() => navigate("/")} style={styles.backHomeBtn}>
          Return Home
        </button>
      </div>
    );
  }

  // Filter students based on search query
  const filteredEvaluations = evaluations.filter((item) => {
    const name = (item.studentName || item.evaluationData?.studentMetadata?.name || "").toLowerCase();
    const roll = (item.evaluationData?.studentMetadata?.rollNumber || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || roll.includes(query);
  });

  const selectedItem = evaluations.find((item) => item.id === selectedId) || filteredEvaluations[0] || evaluations[0];
  const evalData = selectedItem?.evaluationData;
  const metadata = evalData?.studentMetadata;
  const status = evalData?.parsingStatus;

  const activeTotalScore = selectedItem?.obtainedMarks !== undefined && selectedItem?.obtainedMarks !== null
    ? selectedItem.obtainedMarks
    : calculateTotalMarks(evalData);
  const activeMaxMarks = selectedItem?.maxMarks !== undefined && selectedItem?.maxMarks !== null
    ? selectedItem.maxMarks
    : (totalMarks !== undefined && totalMarks !== null ? totalMarks : null);

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Step 4: Assessment & Evaluation Results</h1>
        <p style={styles.subtitle}>
          Detailed analytical grading and AI feedback dashboard
        </p>
      </header>

      {/* Main layout split */}
      <div style={styles.mainLayout}>
        
        {/* Left column: Student list selection */}
        <div style={styles.sidebar}>
          {isBulkUploading && (
            <div style={styles.backgroundProgressBanner}>
              <div style={styles.backgroundProgressHeader}>
                <span style={styles.backgroundProgressLabel}>
                  Evaluating: {bulkProgress.current} / {bulkProgress.total} sheets
                </span>
                <span style={styles.backgroundSpinner}>⟳</span>
              </div>
              <div style={styles.backgroundProgressTrack}>
                <div
                  style={{
                    ...styles.backgroundProgressFill,
                    width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div style={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Search by student name or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.studentList}>
            {filteredEvaluations.length === 0 ? (
              <div style={{ color: "#64748b", padding: "20px", textAlign: "center", fontStyle: "italic" }}>
                No students found matching your search.
              </div>
            ) : (
              filteredEvaluations.map((item) => {
                const sName = item.studentName || item.evaluationData?.studentMetadata?.name || "Unknown Student";
                const roll = item.evaluationData?.studentMetadata?.rollNumber || "-";
                const totalScore = item.obtainedMarks !== undefined && item.obtainedMarks !== null
                  ? item.obtainedMarks
                  : calculateTotalMarks(item.evaluationData);
                const paperMaxMarks = item.maxMarks !== undefined && item.maxMarks !== null
                  ? item.maxMarks
                  : (totalMarks !== undefined && totalMarks !== null ? totalMarks : null);
                const isSelected = item.id === selectedId;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      ...styles.studentCard,
                      border: isSelected ? "1px solid #8b5cf6" : "1px solid #1e293b",
                      background: isSelected ? "#1e1b4b" : "#131d30",
                      boxShadow: isSelected ? "0 0 12px rgba(139, 92, 246, 0.25)" : "none",
                    }}
                  >
                    <div style={styles.studentMetaRow}>
                      <span style={styles.studentCardName}>{sName}</span>
                      <span style={styles.studentScoreBadge}>
                        {totalScore}
                        {paperMaxMarks !== null ? ` / ${paperMaxMarks}` : ""} Marks
                      </span>
                    </div>
                    <div style={styles.studentCardSub}>
                      <span>Roll Number: {roll}</span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>ID: {item.evaluationId?.substring(0, 8) || "..."}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={() => navigate("/evaluation/upload", { state: { examPaperId, filename, totalMarks } })}
              style={{ ...styles.sidebarReturnBtn, color: "#c084fc", borderColor: "rgba(192, 132, 252, 0.3)" }}
            >
              ← Back to Uploading Sheets
            </button>
            <button
              onClick={() => navigate("/")}
              style={styles.sidebarReturnBtn}
            >
              ← Return to Home
            </button>
          </div>
        </div>

        {/* Right column: Selected student analysis */}
        <div style={styles.detailsPanel}>
          {selectedItem ? (
            <div style={styles.detailsContent}>
              
              {/* Top Summary Card */}
              <div style={styles.studentDetailHeader}>
                <div style={styles.detailHeaderLeft}>
                  <h2 style={styles.studentNameTitle}>
                    {selectedItem.studentName || metadata?.name || "Unknown Student"}
                  </h2>
                  <div style={styles.metadataGrid}>
                    <div><span style={styles.metaLabel}>Roll Number:</span> <span style={styles.metaValue}>{metadata?.rollNumber || "Not Detected"}</span></div>
                    <div><span style={styles.metaLabel}>Exam Code:</span> <span style={styles.metaValue}>{metadata?.examCode || "Not Detected"}</span></div>
                    <div><span style={styles.metaLabel}>Subject:</span> <span style={styles.metaValue}>{metadata?.subject || "Not Detected"}</span></div>
                    <div><span style={styles.metaLabel}>File:</span> <span style={styles.metaValue} title={selectedItem.filename}>{selectedItem.filename}</span></div>
                  </div>
                </div>
                <div style={styles.totalScoreDisplay}>
                  <span style={styles.scoreDisplayLabel}>Total Score</span>
                  <span style={styles.scoreDisplayValue}>
                    {activeTotalScore}
                    {activeMaxMarks !== null && (
                      <span style={{ fontSize: "16px", color: "#94a3b8", fontWeight: "600" }}>/{activeMaxMarks}</span>
                    )}
                  </span>
                  <span style={styles.scoreDisplayUnits}>Marks Awarded</span>
                </div>
              </div>

              {/* Status and Confidence */}
              {status && (
                <div style={styles.parsingBanner}>
                  <div style={styles.parsingBannerItem}>
                    <span style={styles.bannerLabel}>Paper Clarity:</span>
                    <span style={{
                      ...styles.bannerValue,
                      color: status.paperClarity === "clear" ? "#10b981" : status.paperClarity === "partially_clear" ? "#f59e0b" : "#ef4444"
                    }}>
                      {status.paperClarity?.replace("_", " ")}
                    </span>
                  </div>

                  <div style={styles.parsingBannerItem}>
                    <span style={styles.bannerLabel}>AI Confidence:</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={styles.confidenceBarTrack}>
                        <div style={{
                          ...styles.confidenceBarFill,
                          width: `${(status.overallConfidence || 0) * 100}%`,
                          backgroundColor: status.overallConfidence >= 0.8 ? "#10b981" : status.overallConfidence >= 0.5 ? "#f59e0b" : "#ef4444"
                        }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: "13px", color: "#cbd5e1" }}>
                        {Math.round((status.overallConfidence || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Question list heading */}
              <h3 style={styles.sectionHeading}>Detailed Question-by-Question Grading</h3>

              {/* Answer Blocks list */}
              <div style={styles.blocksContainer}>
                {evalData?.answerBlocks && evalData.answerBlocks.length > 0 ? (
                  evalData.answerBlocks.map((block) => (
                    <AnswerBlockNode key={block.id} block={block} level={1} />
                  ))
                ) : (
                  <p style={{ fontStyle: "italic", color: "#64748b" }}>No grading blocks extracted for this student.</p>
                )}
              </div>

              {/* Invalid answers / Redundant attempts note if any */}
              {evalData?.invalidAnswers && evalData.invalidAnswers.length > 0 && (
                <div style={styles.invalidAnswersBox}>
                  <strong>Note: </strong> Conflicting or excess attempts detected and ignored:{" "}
                  {evalData.invalidAnswers.map((ansId, index) => (
                    <span key={ansId} style={styles.invalidAnswerChip}>
                      {ansId}
                      {index < evalData.invalidAnswers.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
              )}

            </div>
          ) : (
            <div style={styles.noSelectionContainer}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <h3>Select a student</h3>
              <p style={{ color: "#64748b" }}>Click on any student row in the sidebar list to view their complete assessment breakdown.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Styles objects matching the ReviewPage design guidelines ───────────────────

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0b1120",
    color: "#fff",
    padding: "40px 24px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    maxWidth: "1200px",
    margin: "0 auto 32px",
    paddingBottom: "20px",
    borderBottom: "1px solid #28354d",
    textAlign: "center",
    width: "100%",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #a855f7, #3b82f6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "15px",
    color: "#cbd5e1",
    margin: 0,
    lineHeight: "1.6",
  },
  invalidContainer: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    gap: "16px",
    backgroundColor: "#0b1120",
    color: "#fff",
    fontFamily: "system-ui, -apple-system, sans-serif",
    padding: "20px",
    textAlign: "center",
  },
  backHomeBtn: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    backgroundColor: "#8b5cf6",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
    transition: "background-color 0.2s",
  },

  // Main Page Layout
  mainLayout: {
    maxWidth: "1200px",
    width: "100%",
    margin: "0 auto",
    display: "flex",
    gap: "24px",
    flex: 1,
    boxSizing: "border-box",
    alignItems: "stretch",
  },

  // Left Sidebar
  sidebar: {
    width: "350px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    flexShrink: 0,
  },
  searchWrapper: {
    width: "100%",
  },
  searchInput: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #1e293b",
    background: "#131d30",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  studentList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflowY: "auto",
    maxHeight: "calc(100vh - 300px)",
    paddingRight: "4px",
  },
  studentCard: {
    padding: "16px",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  studentMetaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },
  studentCardName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#e2e8f0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  studentScoreBadge: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#c084fc",
    background: "rgba(192, 132, 252, 0.15)",
    padding: "4px 8px",
    borderRadius: "6px",
    flexShrink: 0,
  },
  studentCardSub: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
    color: "#94a3b8",
  },
  sidebarReturnBtn: {
    marginTop: "auto",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #1e293b",
    background: "transparent",
    color: "#cbd5e1",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  // Right Details Pane
  detailsPanel: {
    flex: 1,
    minWidth: 0,
    background: "#101827",
    border: "1px solid #28354d",
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    overflowY: "auto",
    maxHeight: "calc(100vh - 200px)",
  },
  detailsContent: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  noSelectionContainer: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    textAlign: "center",
    color: "#64748b",
    padding: "40px",
  },

  // Header inside Right Panel
  studentDetailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(139, 92, 246, 0.03)",
    border: "1px solid #1e293b",
    padding: "20px",
    borderRadius: "14px",
    gap: "20px",
    flexWrap: "wrap",
  },
  detailHeaderLeft: {
    flex: 1,
    minWidth: "250px",
  },
  studentNameTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#e2e8f0",
    margin: "0 0 14px 0",
  },
  metadataGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "10px",
    fontSize: "13px",
  },
  metaLabel: {
    color: "#64748b",
    fontWeight: "600",
  },
  metaValue: {
    color: "#cbd5e1",
    fontWeight: "500",
  },
  totalScoreDisplay: {
    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)",
    border: "1px solid rgba(139, 92, 246, 0.3)",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "120px",
    textAlign: "center",
  },
  scoreDisplayLabel: {
    fontSize: "10px",
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#94a3b8",
    letterSpacing: "0.5px",
  },
  scoreDisplayValue: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#c084fc",
    margin: "4px 0",
  },
  scoreDisplayUnits: {
    fontSize: "11px",
    fontWeight: "500",
    color: "#a78bfa",
  },

  // Parsing status banner
  parsingBanner: {
    display: "flex",
    gap: "30px",
    flexWrap: "wrap",
    background: "#131d30",
    border: "1px solid #1e293b",
    padding: "12px 20px",
    borderRadius: "10px",
  },
  parsingBannerItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
  },
  bannerLabel: {
    color: "#64748b",
    fontWeight: "600",
  },
  bannerValue: {
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: "12px",
  },
  confidenceBarTrack: {
    width: "80px",
    height: "5px",
    borderRadius: "3px",
    background: "#1e293b",
    overflow: "hidden",
  },
  confidenceBarFill: {
    height: "100%",
    borderRadius: "3px",
  },

  // Section details
  sectionHeading: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#cbd5e1",
    margin: "12px 0 4px 0",
    borderLeft: "4px solid #8b5cf6",
    paddingLeft: "10px",
  },
  blocksContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  // Invalid Answers Box
  invalidAnswersBox: {
    padding: "12px 16px",
    borderRadius: "8px",
    background: "rgba(239, 68, 68, 0.05)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    color: "#94a3b8",
    fontSize: "13px",
  },
  invalidAnswerChip: {
    color: "#f87171",
    fontWeight: "600",
  },
  backgroundProgressBanner: {
    padding: "12px 14px",
    borderRadius: "10px",
    background: "rgba(139, 92, 246, 0.08)",
    border: "1px solid rgba(139, 92, 246, 0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "16px",
  },
  backgroundProgressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backgroundProgressLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#cbd5e1",
  },
  backgroundSpinner: {
    fontSize: "13px",
    color: "#a855f7",
    fontWeight: "bold",
    display: "inline-block",
    animation: "spin 1.5s infinite linear",
  },
  backgroundProgressTrack: {
    height: "4px",
    width: "100%",
    backgroundColor: "#1e293b",
    borderRadius: "2px",
    overflow: "hidden",
  },
  backgroundProgressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #a855f7, #3b82f6)",
    borderRadius: "2px",
    transition: "width 0.4s ease",
  },
};

// ── Styles for recursive AnswerBlock cards ──────────────────────────────────────

const blockStyles = {
  card: {
    background: "#131d30",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    width: "100%",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    borderBottom: "1px solid #1e293b",
    paddingBottom: "10px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  idBadge: {
    background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
    color: "#fff",
    padding: "5px 12px",
    borderRadius: "8px",
    fontWeight: "700",
    fontSize: "14px",
  },
  subIdBadge: {
    background: "#2e303a",
    border: "1px solid #4b5563",
    color: "#e5e7eb",
    padding: "4px 10px",
    borderRadius: "6px",
    fontWeight: "600",
    fontSize: "12px",
  },
  statusBadge: {
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  scoreBadge: {
    fontSize: "13px",
    color: "#94a3b8",
    fontWeight: "600",
  },
  summarySection: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#8b5cf6",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  summaryText: {
    margin: 0,
    fontSize: "14px",
    color: "#e2e8f0",
    lineHeight: "1.5",
  },
  listSection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  list: {
    margin: 0,
    paddingLeft: "0px",
    listStyleType: "none",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  listItem: {
    fontSize: "13px",
    color: "#cbd5e1",
    lineHeight: "1.4",
  },
  reasonBox: {
    background: "rgba(139, 92, 246, 0.05)",
    borderLeft: "3px solid #8b5cf6",
    padding: "10px 14px",
    borderRadius: "4px 8px 8px 4px",
  },
  reasonLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#a78bfa",
    textTransform: "uppercase",
    marginBottom: "4px",
    letterSpacing: "0.5px",
  },
  reasonText: {
    margin: 0,
    fontSize: "13px",
    color: "#cbd5e1",
    lineHeight: "1.5",
    fontStyle: "italic",
  },
  issuesBox: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    background: "rgba(245, 158, 11, 0.04)",
    border: "1px solid rgba(245, 158, 11, 0.15)",
    padding: "10px 14px",
    borderRadius: "8px",
  },
  issueItem: {
    fontSize: "12px",
    color: "#fbbf24",
    lineHeight: "1.4",
  },
  childrenWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
  },
};

// ── Inject spin keyframes ───────────────────────────────────────────────────
if (typeof document !== "undefined") {
  const id = "results-page-keyframes";
  if (!document.getElementById(id)) {
    const styleSheet = document.createElement("style");
    styleSheet.id = id;
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      @keyframes spin {
        0%   { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}

export default EvaluationResultsPage;
