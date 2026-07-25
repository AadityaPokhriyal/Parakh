import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEvaluation } from "../context/EvaluationContext";
import Navbar from "../components/Navbar";
import WorkflowStepper from "../components/WorkflowStepper";
import "./EvaluationResultsPage.css";

const formatMarks = (val) => {
  if (val === null || val === undefined) return "0";
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num)) return "0";
  return Number.isInteger(num) ? num.toString() : (Math.round(num * 100) / 100).toString();
};

const sumBlockMarks = (block) => {
  if (block.children && block.children.length > 0) {
    return block.children.reduce((sum, child) => sum + sumBlockMarks(child), 0);
  }
  const val = parseFloat(block.earnedMarks?.value);
  return isNaN(val) ? 0 : val;
};

const calculateTotalMarks = (evaluationData) => {
  if (!evaluationData || !evaluationData.answerBlocks) return 0;
  const rawSum = evaluationData.answerBlocks.reduce((sum, block) => {
    return sum + sumBlockMarks(block);
  }, 0);
  return Math.round(rawSum * 100) / 100;
};

const AnswerBlockNode = ({ block, level = 1 }) => {
  const hasChildren = block.children && block.children.length > 0;
  const isAttempted = block.attemptStatus === "attempted" || block.attemptStatus === "partial";

  const paddingLeft = level === 1 ? "0px" : level === 2 ? "20px" : "35px";
  const borderLeft = level === 1 ? "none" : "3px solid var(--accent-border)";

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
            Score: <strong style={{ color: "#a78bfa" }}>{formatMarks(block.earnedMarks?.value)}</strong>
          </div>
        </div>

        {block.answerSummary && (
          <div style={blockStyles.summarySection}>
            <div style={blockStyles.sectionLabel}>Student's Answer Summary</div>
            <p style={blockStyles.summaryText}>{block.answerSummary}</p>
          </div>
        )}

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

        {block.earnedMarks?.reason && (
          <div style={blockStyles.reasonBox}>
            <div style={blockStyles.reasonLabel}>AI Evaluation Note</div>
            <p style={blockStyles.reasonText}>{block.earnedMarks.reason}</p>
          </div>
        )}

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

function EvaluationResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { evaluations, totalMarks, isBulkUploading, bulkProgress, examPaperId, filename, setExamInfo } = useEvaluation();
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const stateExamPaperId = location.state?.examPaperId || location.state?.questionPaperId;
    const stateFilename = location.state?.filename || location.state?.pdf_filename;
    const stateTotalMarks = location.state?.totalMarks;

    if (stateExamPaperId && stateExamPaperId !== examPaperId) {
      setExamInfo({
        examPaperId: stateExamPaperId,
        filename: stateFilename || "exam_paper.pdf",
        totalMarks: stateTotalMarks !== undefined ? stateTotalMarks : null,
      });
    }
  }, [location.state, examPaperId, setExamInfo]);

  useEffect(() => {
    if (location.state?.selectedEvaluationId) {
      setSelectedId(location.state.selectedEvaluationId);
    } else if (evaluations.length > 0 && selectedId === null) {
      setSelectedId(evaluations[0].id);
    }
  }, [evaluations, selectedId, location.state]);

  if (evaluations.length === 0) {
    if (isBulkUploading) {
      return (
        <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
          <Navbar />
          <div style={styles.invalidContainer}>
            <h2>Evaluating Student Answer Sheets...</h2>
            <p style={{ color: "var(--text-muted)", margin: "12px 0 24px", maxWidth: "450px", textAlign: "center" }}>
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
        </div>
      );
    }

    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <Navbar />
        <div style={styles.invalidContainer}>
          <h2>No Assessment Results Found</h2>
          <p style={{ color: "var(--text-muted)", margin: "12px 0 24px" }}>
            Please upload and successfully submit student answer sheets to view the evaluation dashboard.
          </p>
          <button onClick={() => navigate("/")} style={styles.backHomeBtn}>
            Return Home
          </button>
        </div>
      </div>
    );
  }

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
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />
      <WorkflowStepper currentStep={4} currentPageName="Evaluation Results" />

      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Step 4: Assessment & Evaluation Results</h1>
        <p style={styles.pageSubtitle}>
          Detailed analytical grading and AI feedback dashboard.
        </p>
      </div>

      <div style={{ ...styles.container, background: "transparent", paddingTop: "10px" }}>

      {/* Main layout split */}
      <div className="results-layout">
        
        {/* Left column: Student list selection */}
        <div className="results-sidebar">
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
              <div style={{ color: "var(--text-muted)", padding: "20px", textAlign: "center", fontStyle: "italic" }}>
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
                      border: isSelected ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: isSelected ? "var(--accent-bg)" : "var(--card-bg)",
                      boxShadow: isSelected ? "0 0 12px var(--accent-bg)" : "none",
                    }}
                  >
                    <div style={styles.studentMetaRow}>
                      <span style={styles.studentCardName}>{sName}</span>
                      <span style={styles.studentScoreBadge}>
                        {formatMarks(totalScore)}
                        {paperMaxMarks !== null ? ` / ${formatMarks(paperMaxMarks)}` : ""} Marks
                      </span>
                    </div>
                    <div style={styles.studentCardSub}>
                      <span>Roll Number: {roll}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>ID: {item.evaluationId?.substring(0, 8) || "..."}</span>
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
        <div className="results-details">
          {selectedItem ? (
            <div style={styles.detailsContent}>
              
              {/* Top Summary Card */}
              <div className="student-detail-header">
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
                
                <div style={styles.scoreCardContainer}>
                  <span style={styles.scoreCardLabel}>Total Score</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={styles.scoreCardObtained}>{formatMarks(activeTotalScore)}</span>
                    {activeMaxMarks !== null && activeMaxMarks !== undefined && (
                      <span style={styles.scoreCardMax}>/ {formatMarks(activeMaxMarks)}</span>
                    )}
                  </div>
                  {activeMaxMarks && activeMaxMarks > 0 ? (
                    <div style={{
                      marginTop: "6px",
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      backgroundColor: (activeTotalScore / activeMaxMarks) >= 0.8 ? "rgba(16, 185, 129, 0.14)" : (activeTotalScore / activeMaxMarks) >= 0.5 ? "rgba(245, 158, 11, 0.14)" : "rgba(239, 68, 68, 0.14)",
                      color: (activeTotalScore / activeMaxMarks) >= 0.8 ? "#34d399" : (activeTotalScore / activeMaxMarks) >= 0.5 ? "#fbbf24" : "#f87171",
                      border: `1px solid ${(activeTotalScore / activeMaxMarks) >= 0.8 ? "rgba(16, 185, 129, 0.3)" : (activeTotalScore / activeMaxMarks) >= 0.5 ? "rgba(245, 158, 11, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                    }}>
                      <span>{Math.round((activeTotalScore / activeMaxMarks) * 100)}%</span>
                      <span style={{ opacity: 0.7 }}>•</span>
                      <span>{(activeTotalScore / activeMaxMarks) >= 0.8 ? "Excellent" : (activeTotalScore / activeMaxMarks) >= 0.5 ? "Passing" : "Needs Review"}</span>
                    </div>
                  ) : (
                    <span style={styles.scoreDisplayUnits}>Marks Awarded</span>
                  )}
                </div>
              </div>

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
                      <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-h)" }}>
                        {Math.round((status.overallConfidence || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <h3 style={styles.sectionHeading}>Detailed Question-by-Question Grading</h3>

              <div style={styles.blocksContainer}>
                {evalData?.answerBlocks && evalData.answerBlocks.length > 0 ? (
                  evalData.answerBlocks.map((block) => (
                    <AnswerBlockNode key={block.id} block={block} level={1} />
                  ))
                ) : (
                  <p style={{ fontStyle: "italic", color: "var(--text-muted)" }}>No grading blocks extracted for this student.</p>
                )}
              </div>

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
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <h3>Select a student</h3>
              <p style={{ color: "var(--text-muted)" }}>Click on any student row in the sidebar list to view their complete assessment breakdown.</p>
            </div>
          )}
        </div>

      </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text-h)",
    padding: "40px 24px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  },
  pageHeader: {
    maxWidth: "1280px",
    width: "100%",
    margin: "10px auto 24px auto",
    padding: "0 40px",
    boxSizing: "border-box",
    textAlign: "center",
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "var(--text-h)",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: "15px",
    color: "var(--text-muted)",
    margin: "8px 0 0 0",
    lineHeight: "1.5",
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


  // Left Sidebar
  searchWrapper: {
    width: "100%",
  },
  searchInput: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--card-bg)",
    color: "var(--text-h)",
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
    color: "var(--text-h)",
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
    color: "var(--text-muted)",
  },
  sidebarReturnBtn: {
    marginTop: "auto",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text-h)",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  // Right Details Panel
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
    color: "var(--text-muted)",
    padding: "40px",
  },

  // Header inside Right Panel
  detailHeaderLeft: {
    flex: 1,
    minWidth: "250px",
  },
  studentNameTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "var(--text-h)",
    margin: "0 0 14px 0",
  },
  metadataGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "10px",
    fontSize: "13px",
  },
  metaLabel: {
    color: "var(--text-muted)",
    fontWeight: "600",
  },
  scoreCardContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    padding: "14px 20px",
    borderRadius: "14px",
    boxShadow: "var(--shadow)",
    minWidth: "160px",
  },
  scoreCardLabel: {
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    letterSpacing: "0.5px",
    marginBottom: "2px",
  },
  scoreCardObtained: {
    fontSize: "32px",
    fontWeight: "800",
    color: "var(--accent)",
    lineHeight: "1.1",
  },
  scoreCardMax: {
    fontSize: "18px",
    fontWeight: "600",
    color: "var(--text-muted)",
  },
  scoreDisplayLabel: {
    fontSize: "10px",
    fontWeight: "700",
    textTransform: "uppercase",
    color: "var(--text-muted)",
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

  parsingBanner: {
    display: "flex",
    gap: "30px",
    flexWrap: "wrap",
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
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
    color: "var(--text-muted)",
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
    background: "var(--border)",
    overflow: "hidden",
  },
  confidenceBarFill: {
    height: "100%",
    borderRadius: "3px",
  },

  sectionHeading: {
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--text-h)",
    margin: "12px 0 4px 0",
    borderLeft: "4px solid #8b5cf6",
    paddingLeft: "10px",
  },
  blocksContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  invalidAnswersBox: {
    padding: "12px 16px",
    borderRadius: "8px",
    background: "rgba(239, 68, 68, 0.05)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    color: "var(--text-muted)",
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
    color: "var(--text-h)",
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
    backgroundColor: "var(--border)",
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

const blockStyles = {
  card: {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
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
    borderBottom: "1px solid var(--border)",
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
    background: "var(--code-bg)",
    border: "1px solid var(--border)",
    color: "var(--text-h)",
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
    color: "var(--text-muted)",
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
    color: "var(--text-h)",
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
    color: "var(--text-h)",
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
    color: "var(--text-h)",
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