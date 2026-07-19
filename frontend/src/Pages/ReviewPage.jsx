import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QuestionNode from "../components/QuestionNode";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import WorkflowStepper from "../components/WorkflowStepper";

// ── Collapsible Panel Helper ──────────────────────────────────────────
const CollapsiblePanel = ({ title, icon, defaultOpen = false, accentColor = "#8b5cf6", children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={panelStyles.wrapper}>
      <div
        style={{ ...panelStyles.header, borderColor: open ? accentColor + '30' : 'transparent' }}
        onClick={() => setOpen(!open)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>{icon}</span>
          <span style={panelStyles.headerTitle}>{title}</span>
        </div>
        <span style={{ color: accentColor, fontSize: "13px", transition: "transform 0.2s" }}>
          {open ? "▼" : "▶"}
        </span>
      </div>
      {open && <div style={panelStyles.body}>{children}</div>}
    </div>
  );
};

// ── Choices Renderer (reused for section-level and global-level) ──────
const ChoicesDisplay = ({ choices, label }) => {
  if (!Array.isArray(choices) || choices.length === 0) return null;
  return (
    <div style={choiceStyles.container}>
      <div style={choiceStyles.label}>{label}</div>
      {choices.map((c, i) => (
        <div key={i} style={choiceStyles.card}>
          {c.targetNodes && c.targetNodes.length > 0 && (
            <div style={choiceStyles.targets}>
              {c.targetNodes.map((t, j) => (
                <span key={j} style={choiceStyles.targetChip}>{t}</span>
              ))}
            </div>
          )}
          {c.summary && <div style={choiceStyles.summary}>{c.summary}</div>}
          {c.detailedDescription && (
            <div style={choiceStyles.detail}>{c.detailedDescription}</div>
          )}
        </div>
      ))}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
//  ReviewPage
// ════════════════════════════════════════════════════════════════════════
function ReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [paperData, setPaperData] = useState(null);
  const [filename, setFilename] = useState("unknown_paper.pdf");
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [instrLang, setInstrLang] = useState("en");
  const [questionPaperId, setQuestionPaperId] = useState(null);
  const [isStatusExpanded, setIsStatusExpanded] = useState(true);
  const [isStatusVisible, setIsStatusVisible] = useState(true);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      const bannerElement = document.getElementById("status-banner");
      const offset = bannerElement ? bannerElement.offsetHeight + 20 : 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (location.state) {
      const data = location.state.questionPaper || location.state;
      setPaperData(data);
      if (location.state.questionPaperId) {
        setQuestionPaperId(location.state.questionPaperId);
      } else if (location.state.id) {
        setQuestionPaperId(location.state.id);
      }
      if (location.state.filename) {
        setFilename(location.state.filename);
      } else if (location.state.pdf_filename) {
        setFilename(location.state.pdf_filename);
      } else {
        setFilename("mock_question_paper.pdf");
      }
    }
  }, [location.state]);

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
      if (!prev) return prev;
      if (prev.sections && prev.sections.length > 0) {
        return {
          ...prev,
          sections: prev.sections.map((sec) => ({
            ...sec,
            questions: updateQuestionInTree(sec.questions || [], id, updates),
          })),
        };
      }
      if (prev.questions) {
        return {
          ...prev,
          questions: updateQuestionInTree(prev.questions, id, updates),
        };
      }
      return prev;
    });
  };

  const handleSubmit = async () => {
    setSubmitStatus("submitting");
    setErrorMessage("");

    try {
      const response = await authFetch("/exams/generate-rubric", {
        method: "POST",
        body: JSON.stringify({ pdf_filename: filename, parsed_data: paperData, questionPaperId }),
      });

      let data = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (jsonErr) {
          console.error("Failed to parse JSON response:", jsonErr);
        }
      }

      if (response.ok && data && data.success) {
        navigate("/evaluation/upload", {
          state: {
            examPaperId: data.examPaperId,
            filename,
            totalMarks: paperData.paperMetadata?.totalMarks || null,
          },
        });
      } else {
        setSubmitStatus("error");
        const errMsg = (data && data.error) || (data && data.message) || `Server responded with status ${response.status}`;
        setErrorMessage(errMsg);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitStatus("error");
      setErrorMessage(error.message || "Failed to submit review. Connection error.");
    }
  };

  if (!paperData) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <Navbar />
        <div style={styles.container}>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <h2>No Question Paper Data Found</h2>
            <p style={{ color: "var(--text-muted)", margin: "16px 0" }}>Please go back and upload a PDF or images to begin.</p>
            <button onClick={() => navigate("/upload")} style={styles.submitBtn}>
              ← Go to Upload
            </button>
          </div>
        </div>
      </div>
    );
  }

  const meta = paperData.paperMetadata;
  const status = paperData.parsingStatus;
  const hasSections = paperData.sections && paperData.sections.length > 0;
  const hasFlatQuestions = paperData.questions && paperData.questions.length > 0;
  const globalChoices = paperData.globalChoices;

  const getConfidenceColor = (c) => {
    if (c >= 0.8) return "#10b981";
    if (c >= 0.5) return "#f59e0b";
    return "#ef4444";
  };

  const getClarityBadge = (clarity) => {
    const map = {
      clear: { bg: "rgba(16,185,129,0.12)", color: "#34d399", border: "rgba(16,185,129,0.3)" },
      partially_clear: { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.3)" },
      unclear: { bg: "rgba(239,68,68,0.12)", color: "#f87171", border: "rgba(239,68,68,0.3)" },
    };
    const s = map[clarity] || map.unclear;
    return (
      <span style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}>
        {(clarity || "unknown").replace("_", " ")}
      </span>
    );
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />
      <WorkflowStepper currentStep={2} currentPageName="Review Questions & Rubrics" />

      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Step 2: Question Review & Rubrics</h1>
        <p style={styles.pageSubtitle}>
          Reviewing: <strong>{filename}</strong> | Adjust marks, setup grading rubrics, and configure expectations.
        </p>
      </div>

      <div style={{ ...styles.container, background: "transparent", paddingTop: "10px" }}>

      {submitStatus === "error" && (
        <div style={styles.errorAlert}>
          <strong>Error: </strong> {errorMessage}
        </div>
      )}

      {!isStatusVisible && status && (
        <div style={{ maxWidth: "1000px", margin: "0 auto 16px", display: "flex", justifyContent: "flex-end" }}>
          <button 
            onClick={() => setIsStatusVisible(true)}
            style={styles.statusToggleBtn}
          >
            Show Parsing Status Bar 👁️
          </button>
        </div>
      )}

      {/* ── Parsing Status Banner ───────────────────────────────────── */}
      {isStatusVisible && status && (
      
        <div style={styles.statusBanner} id="status-banner">
          <div style={styles.statusHeader(isStatusExpanded)}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600, color: "#fff", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Parsing Status:</span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                color: status.success ? "#34d399" : "#f87171", fontWeight: 600, fontSize: "13px"
              }}>
                {status.success ? "✓ Parsed" : "✕ Failed"}
              </span>
              <span style={{ color: "#334155" }}>|</span>
              <span style={{ fontSize: "13px", color: "#cbd5e1" }}>
                Clarity: <strong style={{ color: "#38bdf8" }}>{(status.paperClarity || "unknown").replace("_", " ")}</strong>
              </span>
              <span style={{ color: "#334155" }}>|</span>
              <span style={{ fontSize: "13px", color: getConfidenceColor(status.confidence || 0), fontWeight: 600 }}>
                Confidence: {((status.confidence || 0) * 100).toFixed(0)}%
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button 
                onClick={() => setIsStatusExpanded(!isStatusExpanded)}
                style={styles.statusToggleBtn}
              >
                {isStatusExpanded ? "Hide Details ▲" : "Show Details ▼"}
              </button>
              <button 
                onClick={() => setIsStatusVisible(false)}
                style={styles.statusCloseBtn}
                title="Dismiss Status Bar"
              >
                ✕
              </button>
            </div>
          </div>

          {isStatusExpanded && (
            <>
              <div style={styles.statusRow}>
                <div style={styles.statusItem}>
                  <span style={styles.statusLabel}>Status</span>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    color: status.success ? "#34d399" : "#f87171", fontWeight: 600, fontSize: "14px"
                  }}>
                    {status.success ? "✓ Parsed" : "✕ Failed"}
                  </span>
                </div>

                <div style={styles.statusItem}>
                  <span style={styles.statusLabel}>Clarity</span>
                  {getClarityBadge(status.paperClarity)}
                </div>

                <div style={styles.statusItem}>
                  <span style={styles.statusLabel}>Confidence</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={styles.confidenceBarTrack}>
                      <div style={{
                        ...styles.confidenceBarFill,
                        width: `${(status.confidence || 0) * 100}%`,
                        background: getConfidenceColor(status.confidence || 0),
                      }} />
                    </div>
                    <span style={{ color: getConfidenceColor(status.confidence || 0), fontWeight: 700, fontSize: "13px" }}>
                      {((status.confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {hasSections && (
                  <div style={styles.jumpItem}>
                    <span style={styles.statusLabel}>Jump to Section</span>
                    <div style={styles.jumpButtons}>
                      {paperData.sections.map((section, sIdx) => {
                        const sId = section.sectionId || `${sIdx + 1}`;
                        return (
                          <button
                            key={sId}
                            onClick={() => scrollToSection(section.sectionId || sIdx)}
                            style={styles.jumpBtn}
                            className="jump-btn-hover"
                          >
                            {sId}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Errors & Warnings */}
              {status.errors && status.errors.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  {status.errors.map((e, i) => (
                    <div key={i} style={styles.statusError}>⚠ {e}</div>
                  ))}
                </div>
              )}
              {status.warnings && status.warnings.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  {status.warnings.map((w, i) => (
                    <div key={i} style={styles.statusWarning}>⚡ {w}</div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <main style={styles.main}>
        {meta && (
          <CollapsiblePanel title="Paper Metadata" icon="📄" accentColor="#3b82f6">
            <div style={metaStyles.grid}>
              {meta.title && (
                <div style={metaStyles.item}>
                  <span style={metaStyles.label}>Title</span>
                  <span style={metaStyles.value}>{meta.title}</span>
                </div>
              )}
              {meta.subject && (
                <div style={metaStyles.item}>
                  <span style={metaStyles.label}>Subject</span>
                  <span style={metaStyles.value}>{meta.subject}</span>
                </div>
              )}
              {meta.examType && (
                <div style={metaStyles.item}>
                  <span style={metaStyles.label}>Exam Type</span>
                  <span style={metaStyles.value}>{meta.examType}</span>
                </div>
              )}
              {meta.duration && (
                <div style={metaStyles.item}>
                  <span style={metaStyles.label}>Duration</span>
                  <span style={metaStyles.value}>{meta.duration}</span>
                </div>
              )}
              {meta.totalMarks !== undefined && (
                <div style={metaStyles.item}>
                  <span style={metaStyles.label}>Total Marks</span>
                  <span style={{ ...metaStyles.value, color: "var(--accent)", fontWeight: 700, fontSize: "20px" }}>
                    {meta.totalMarks}
                  </span>
                </div>
              )}
            </div>

            {meta.instructions && (meta.instructions.en || meta.instructions.hi) && (
              <div style={{ marginTop: "16px" }}>
                <div style={{ display: "flex", gap: "4px", marginBottom: "10px" }}>
                  {meta.instructions.en && (
                    <button
                      onClick={() => setInstrLang("en")}
                      style={{
                        ...metaStyles.langTab,
                        ...(instrLang === "en" ? metaStyles.langTabActive : {}),
                      }}
                    >English</button>
                  )}
                  {meta.instructions.hi && (
                    <button
                      onClick={() => setInstrLang("hi")}
                      style={{
                        ...metaStyles.langTab,
                        ...(instrLang === "hi" ? metaStyles.langTabActive : {}),
                      }}
                    >Hindi</button>
                  )}
                </div>
                <div style={metaStyles.instrList}>
                  {(meta.instructions[instrLang] || []).map((instr, i) => (
                    <div key={i} style={metaStyles.instrItem}>
                      <span style={metaStyles.instrNum}>{i + 1}</span>
                      <span>{instr}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsiblePanel>
        )}

        {hasSections && paperData.sections.map((section, sIdx) => (
          <div
            key={section.sectionId || sIdx}
            id={`section-${section.sectionId || sIdx}`}
            style={sectionStyles.card}
          >
            <div style={sectionStyles.header}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={sectionStyles.badge}>Section {section.sectionId}</span>
                {section.sectionInstructions && (section.sectionInstructions.en || section.sectionInstructions.hi) && (
                  <span style={sectionStyles.instrText}>
                    {section.sectionInstructions.en || section.sectionInstructions.hi}
                  </span>
                )}
              </div>
            </div>

            <ChoicesDisplay choices={section.sectionChoices} label="Section Choices" />

            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {(section.questions || []).map((q) => (
                <QuestionNode key={q.id} question={q} onUpdate={handleUpdate} />
              ))}
              {(!section.questions || section.questions.length === 0) && (
                <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No questions in this section.</p>
              )}
            </div>
          </div>
        ))}

        {!hasSections && hasFlatQuestions && (
          paperData.questions.map((q) => (
            <QuestionNode key={q.id} question={q} onUpdate={handleUpdate} />
          ))
        )}

        {!hasSections && !hasFlatQuestions && (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>
            No questions found in the document.
          </p>
        )}

        {globalChoices && globalChoices.length > 0 && (
          <CollapsiblePanel title="Global Choices (Cross-Section)" icon="🔀" accentColor="#a855f7" defaultOpen>
            <ChoicesDisplay choices={globalChoices} label="" />
          </CollapsiblePanel>
        )}
      </main>

      <footer style={styles.footer}>
        <button
          onClick={handleSubmit}
          disabled={submitStatus === "submitting"}
          style={{
            ...styles.submitBtn,
            opacity: submitStatus === "submitting" ? 0.7 : 1,
            cursor: submitStatus === "submitting" ? "not-allowed" : "pointer",
          }}
        >
          {submitStatus === "submitting" ? "Saving..." : "Submit Review"}
        </button>
      </footer>
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
  main: {
    maxWidth: "1000px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  footer: {
    maxWidth: "1000px",
    margin: "32px auto 0",
    paddingTop: "24px",
    borderTop: "1px solid var(--border)",
    display: "flex",
    justifyContent: "flex-end",
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
    justifyContent: "center",
  },
  errorAlert: {
    maxWidth: "1000px",
    margin: "0 auto 20px",
    padding: "12px 16px",
    borderRadius: "8px",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    fontSize: "14px",
  },
  statusBanner: {
    position: "sticky",
    top: "12px",
    zIndex: 1000,
    maxWidth: "1000px",
    margin: "0 auto 24px",
    padding: "16px 20px",
    borderRadius: "14px",
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow)",
    transition: "box-shadow 0.2s ease",
  },
  statusRow: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
    alignItems: "center",
    width: "100%",
  },
  statusItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: "120px",
  },
  statusLabel: {
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  confidenceBarTrack: {
    width: "100px",
    height: "6px",
    borderRadius: "3px",
    background: "var(--border)",
    overflow: "hidden",
  },
  confidenceBarFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.5s ease",
  },
  statusError: {
    padding: "6px 10px",
    borderRadius: "6px",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.15)",
    color: "#f87171",
    fontSize: "13px",
    marginBottom: "4px",
  },
  statusWarning: {
    padding: "6px 10px",
    borderRadius: "6px",
    background: "rgba(245,158,11,0.08)",
    border: "1px solid rgba(245,158,11,0.15)",
    color: "#fbbf24",
    fontSize: "13px",
    marginBottom: "4px",
  },
  jumpItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: "120px",
    marginLeft: "auto",
  },
  jumpButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  jumpBtn: {
    background: "var(--accent-bg)",
    border: "1px solid var(--accent-border)",
    borderRadius: "8px",
    color: "var(--accent)",
    padding: "5px 12px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
  },
  statusHeader: (isExpanded) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    borderBottom: isExpanded ? "1px solid #1e293b" : "none",
    paddingBottom: isExpanded ? "10px" : "0px",
    marginBottom: isExpanded ? "10px" : "0px",
  }),
  statusToggleBtn: {
    background: "rgba(139, 92, 246, 0.12)",
    border: "1px solid rgba(139, 92, 246, 0.35)",
    borderRadius: "8px",
    color: "#c4b5fd",
    padding: "6px 14px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
  },
  statusCloseBtn: {
    background: "transparent",
    border: "none",
    color: "#64748b",
    fontSize: "14px",
    cursor: "pointer",
    padding: "4px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.15s ease, transform 0.15s ease",
  },
};

const panelStyles = {
  wrapper: {
    borderRadius: "14px",
    border: "1px solid var(--border)",
    background: "var(--card-bg)",
    overflow: "hidden",
    boxShadow: "var(--shadow)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 18px",
    cursor: "pointer",
    userSelect: "none",
    borderBottom: "1px solid transparent",
    transition: "background 0.15s ease",
  },
  headerTitle: {
    fontSize: "15px",
    fontWeight: 600,
    color: "var(--text-h)",
  },
  body: {
    padding: "18px",
  },
};

const metaStyles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "16px",
  },
  item: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  value: {
    fontSize: "15px",
    color: "var(--text-h)",
    fontWeight: 500,
  },
  langTab: {
    padding: "6px 14px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text-muted)",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  langTabActive: {
    background: "var(--accent-bg)",
    borderColor: "var(--accent-border)",
    color: "var(--accent)",
  },
  instrList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxHeight: "300px",
    overflowY: "auto",
    padding: "12px",
    background: "var(--code-bg)",
    borderRadius: "10px",
    border: "1px solid var(--border)",
  },
  instrItem: {
    display: "flex",
    gap: "10px",
    fontSize: "13px",
    color: "var(--text-h)",
    lineHeight: "1.6",
    alignItems: "baseline",
  },
  instrNum: {
    flexShrink: 0,
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "var(--accent-bg)",
    color: "var(--accent)",
    fontSize: "11px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

const sectionStyles = {
  card: {
    borderRadius: "16px",
    border: "1px solid var(--border)",
    background: "var(--card-bg)",
    overflow: "hidden",
    boxShadow: "var(--shadow)",
  },
  header: {
    padding: "16px 20px",
    background: "var(--accent-bg)",
    borderBottom: "1px solid var(--border)",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 14px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))",
    border: "1px solid rgba(139,92,246,0.3)",
    color: "var(--accent)",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.4px",
  },
  instrText: {
    fontSize: "13px",
    color: "var(--text-muted)",
    fontStyle: "italic",
  },
};

const choiceStyles = {
  container: {
    padding: "12px 20px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#a855f7",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "8px",
  },
  card: {
    padding: "10px 14px",
    borderRadius: "10px",
    background: "rgba(168, 85, 247, 0.05)",
    border: "1px solid rgba(168, 85, 247, 0.15)",
    borderLeft: "3px solid #a855f7",
    marginBottom: "8px",
  },
  targets: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    marginBottom: "6px",
  },
  targetChip: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "12px",
    background: "rgba(168,85,247,0.12)",
    color: "#c084fc",
    fontSize: "11px",
    fontWeight: 600,
    border: "1px solid rgba(168,85,247,0.25)",
  },
  summary: {
    fontSize: "13px",
    color: "var(--text-h)",
    lineHeight: "1.5",
  },
  detail: {
    fontSize: "12px",
    color: "var(--text-muted)",
    marginTop: "4px",
    lineHeight: "1.5",
  },
};

export default ReviewPage;