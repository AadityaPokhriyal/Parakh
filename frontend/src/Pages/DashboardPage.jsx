import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import "./DashboardPage.css";
import {
  FileText,
  Users,
  Award,
  TrendingUp,
  Plus,
  Trash2,
  Settings,
  ArrowRight,
  Search,
  CheckCircle,
  GraduationCap,
  Clock,
  AlertTriangle
} from "lucide-react";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();

  // Component states
  const [papers, setPapers] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paperToDelete, setPaperToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Statistics
  const [stats, setStats] = useState({
    totalPapers: 0,
    totalEvaluations: 0,
    averageMarks: 0,
    reliability: 100,
  });

  // Fetch all papers and their corresponding evaluations
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch papers list
      const papersRes = await authFetch("/exams/list");
      if (!papersRes.ok) {
        throw new Error("Failed to load exam papers.");
      }
      const papersData = await papersRes.json();
      const paperList = papersData.papers || [];
      setPapers(paperList);

      // 2. Fetch evaluations for each paper concurrently
      const allEvaluationsPromise = paperList.map(async (paper) => {
        try {
          const evalRes = await authFetch(`/evaluations/paper/${paper.id}`);
          if (evalRes.ok) {
            const evalData = await evalRes.json();
            // Attach paper reference to evaluations
            return (evalData.evaluations || []).map((e) => ({
              ...e,
              examPaperId: paper.id,
              examPaperName: paper.pdf_filename,
            }));
          }
        } catch (err) {
          console.error(`Failed to fetch evaluations for paper ${paper.id}:`, err);
        }
        return [];
      });

      const evaluationsResults = await Promise.all(allEvaluationsPromise);
      const mergedEvaluations = evaluationsResults.flat();
      setEvaluations(mergedEvaluations);

      // 3. Compute statistics
      const totalPapers = paperList.length;
      const totalEvaluations = mergedEvaluations.length;

      // Compute class average percentage
      let avgPercentage = 0;
      if (totalEvaluations > 0) {
        const totalObtained = mergedEvaluations.reduce((sum, e) => sum + (e.obtainedMarks || 0), 0);
        const totalMax = mergedEvaluations.reduce((sum, e) => sum + (e.maxMarks || e.evaluationData?.paperMetadata?.totalMarks || 100), 0);
        avgPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
      }

      // Compute average AI confidence from papers
      let avgConfidence = 100;
      if (totalPapers > 0) {
        const sumConfidence = paperList.reduce((sum, p) => {
          const confidence = p.parsed_data?.parsingStatus?.confidence ?? 1;
          return sum + confidence;
        }, 0);
        avgConfidence = Math.round((sumConfidence / totalPapers) * 100);
      }

      setStats({
        totalPapers,
        totalEvaluations,
        averageMarks: avgPercentage,
        reliability: avgConfidence,
      });

    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Failed to fetch dashboard records. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Exam Paper Deletion
  const handleDeletePaper = async () => {
    if (!paperToDelete) return;
    setDeleting(true);
    try {
      const res = await authFetch(`/exams/${paperToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Reload dashboard
        setPaperToDelete(null);
        await loadDashboardData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete exam paper.");
      }
    } catch (err) {
      console.error("Delete paper error:", err);
      alert("Failed to connect to backend server to delete.");
    } finally {
      setDeleting(false);
    }
  };

  // Search filtering
  const filteredPapers = papers.filter((paper) =>
    (paper.pdf_filename || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sorting recent evaluations by date (newest first)
  const recentEvaluations = [...evaluations]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Navbar />
        <div style={styles.loaderWrapper}>
          <div style={styles.shimmerSpinner} />
          <p style={styles.loadingText}>Synthesizing your assessment dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Navbar />

      <div className="dashboard-main">
        {/* Glow Elements */}
        <div style={styles.glowOrbs}>
          <div style={styles.orbPurple} />
          <div style={styles.orbBlue} />
        </div>

        {/* Welcome Section */}
        <section className="welcome-section">
          <div style={styles.welcomeInfo}>
            <span style={styles.badgeText}>Portal Hub</span>
            <h1 style={styles.welcomeTitle}>
              Welcome back, <span style={styles.gradientText}>{user?.name || "Educator"}</span>
            </h1>
            <p style={styles.welcomeSubtitle}>
              Institution: <strong>{user?.institution || "N/A"}</strong> | Role: <strong>{user?.role || "Teacher"}</strong>
            </p>
          </div>
          <button style={styles.primaryBtn} onClick={() => navigate("/upload")}>
            <Plus size={18} />
            <span>Upload New Paper</span>
          </button>
        </section>

        {error && (
          <div style={styles.errorAlert}>
            <AlertTriangle size={20} />
            <span>{error}</span>
            <button style={styles.retryBtn} onClick={loadDashboardData}>Retry</button>
          </div>
        )}

        {/* Stats Grid */}
        <section className="stats-grid">
          <div style={styles.statCard}>
            <div style={{ ...styles.statIconWrapper, background: "rgba(139, 92, 246, 0.12)" }}>
              <FileText size={22} style={{ color: "#a78bfa" }} />
            </div>
            <div style={styles.statInfo}>
              <h3 style={styles.statValue}>{stats.totalPapers}</h3>
              <p style={styles.statLabel}>Question Papers</p>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconWrapper, background: "rgba(59, 130, 246, 0.12)" }}>
              <Users size={22} style={{ color: "#60a5fa" }} />
            </div>
            <div style={styles.statInfo}>
              <h3 style={styles.statValue}>{stats.totalEvaluations}</h3>
              <p style={styles.statLabel}>Evaluated Students</p>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconWrapper, background: "rgba(16, 185, 129, 0.12)" }}>
              <Award size={22} style={{ color: "#34d399" }} />
            </div>
            <div style={styles.statInfo}>
              <h3 style={styles.statValue}>{stats.averageMarks}%</h3>
              <p style={styles.statLabel}>Class Average</p>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconWrapper, background: "rgba(245, 158, 11, 0.12)" }}>
              <TrendingUp size={22} style={{ color: "#fbbf24" }} />
            </div>
            <div style={styles.statInfo}>
              <h3 style={styles.statValue}>{stats.reliability}%</h3>
              <p style={styles.statLabel}>AI Grading Confidence</p>
            </div>
          </div>
        </section>

        {/* Workflow & Quick Action Guide */}
        <section style={styles.workflowPanel}>
          <h2 style={styles.sectionHeader}>Assessment Pipeline</h2>
          <p style={styles.sectionSub}>Follow these simple steps to grade answer papers with generative intelligence.</p>

          <div className="pipeline-grid">
            <div style={styles.pipelineCard} onClick={() => navigate("/upload")}>
              <div style={styles.pipelineNumber}>01</div>
              <h4 style={styles.pipelineStepTitle}>Upload QP</h4>
              <p style={styles.pipelineStepDesc}>Submit exam question paper PDF to extract layout & schemas.</p>
              <ArrowRight size={14} style={styles.pipelineArrow} />
            </div>

            <div style={styles.pipelineCard} onClick={() => {
              if (papers.length > 0) {
                navigate("/review", {
                  state: {
                    questionPaperId: papers[0].id,
                    filename: papers[0].pdf_filename,
                    questionPaper: papers[0].parsed_data
                  }
                });
              } else {
                navigate("/upload");
              }
            }}>
              <div style={styles.pipelineNumber}>02</div>
              <h4 style={styles.pipelineStepTitle}>Adjust Rubrics</h4>
              <p style={styles.pipelineStepDesc}>Review parsed structures and setup AI grading rubrics.</p>
              <ArrowRight size={14} style={styles.pipelineArrow} />
            </div>

            <div style={styles.pipelineCard} onClick={() => {
              if (papers.length > 0) {
                navigate("/evaluation/upload", {
                  state: {
                    examPaperId: papers[0].id,
                    filename: papers[0].pdf_filename,
                    totalMarks: papers[0].parsed_data?.paperMetadata?.totalMarks
                  }
                });
              } else {
                navigate("/upload");
              }
            }}>
              <div style={styles.pipelineNumber}>03</div>
              <h4 style={styles.pipelineStepTitle}>Grade Answers</h4>
              <p style={styles.pipelineStepDesc}>Upload student sheets for automated, rubric-compliant grading.</p>
              <ArrowRight size={14} style={styles.pipelineArrow} />
            </div>

            <div style={styles.pipelineCard} onClick={() => {
              if (evaluations.length > 0) {
                navigate("/evaluation/results");
              } else if (papers.length > 0) {
                navigate("/evaluation/upload", {
                  state: {
                    examPaperId: papers[0].id,
                    filename: papers[0].pdf_filename,
                    totalMarks: papers[0].parsed_data?.paperMetadata?.totalMarks
                  }
                });
              } else {
                navigate("/upload");
              }
            }}>
              <div style={styles.pipelineNumber}>04</div>
              <h4 style={styles.pipelineStepTitle}>View Results</h4>
              <p style={styles.pipelineStepDesc}>Review deep assessment diagnostics and score breakdowns.</p>
              <CheckCircle size={14} style={{ ...styles.pipelineArrow, color: "#10b981" }} />
            </div>
          </div>
        </section>

        {/* Double Layout Grid: Left - Question Papers Repository, Right - Recent Evaluations */}
        <div className="two-column-grid">
          {/* Question Papers Repository */}
          <div style={styles.gridColumn}>
            <div style={styles.columnHeaderRow}>
              <h2 style={styles.sectionHeader}>Question Papers Repository</h2>
              <div style={styles.searchWrapper}>
                <Search size={16} style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Filter papers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            </div>

            {filteredPapers.length === 0 ? (
              <div style={styles.emptyCard}>
                <FileText size={48} style={{ color: "#334155", marginBottom: "12px" }} />
                <h4 style={styles.emptyTitle}>No Papers Available</h4>
                <p style={styles.emptyText}>
                  {searchQuery ? "No matches found for your filter." : "Start by uploading an exam question paper."}
                </p>
                {!searchQuery && (
                  <button style={styles.secondaryBtn} onClick={() => navigate("/upload")}>
                    Upload Paper
                  </button>
                )}
              </div>
            ) : (
              <div style={styles.paperList}>
                {filteredPapers.map((paper) => {
                  const paperEvalCount = evaluations.filter((e) => e.examPaperId === paper.id).length;
                  const maxMarks = paper.parsed_data?.paperMetadata?.totalMarks || "N/A";
                  return (
                    <div key={paper.id} style={styles.repoCard}>
                      <div style={styles.repoCardHeader}>
                        <div style={styles.repoCardMeta}>
                          <span style={styles.repoCardTitle} title={paper.pdf_filename}>
                            {paper.pdf_filename}
                          </span>
                          <span style={styles.repoCardSub}>
                            Max Marks: {maxMarks} | Evaluated: {paperEvalCount}
                          </span>
                        </div>
                        <button
                          style={styles.trashBtn}
                          onClick={() => setPaperToDelete(paper)}
                          title="Delete Exam Paper"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div style={styles.repoCardDivider} />

                      <div style={styles.repoActionsRow}>
                        <button
                          style={styles.repoActionBtn}
                          onClick={() =>
                            navigate("/evaluation/upload", {
                              state: {
                                examPaperId: paper.id,
                                filename: paper.pdf_filename,
                                totalMarks: paper.parsed_data?.paperMetadata?.totalMarks || null,
                              },
                            })
                          }
                        >
                          Grade Sheets
                        </button>
                        <button
                          style={styles.repoActionBtn}
                          onClick={() =>
                            navigate("/review", {
                              state: {
                                questionPaperId: paper.id,
                                filename: paper.pdf_filename,
                                questionPaper: paper.parsed_data,
                              },
                            })
                          }
                        >
                          Edit Rubric
                        </button>
                        {paperEvalCount > 0 && (
                          <button
                            style={{ ...styles.repoActionBtn, color: "#c084fc", borderColor: "rgba(192, 132, 252, 0.3)" }}
                            onClick={() =>
                              navigate("/evaluation/results", {
                                state: {
                                  examPaperId: paper.id,
                                  filename: paper.pdf_filename,
                                  totalMarks: paper.parsed_data?.paperMetadata?.totalMarks || null,
                                },
                              })
                            }
                          >
                            View Results
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Evaluations */}
          <div style={styles.gridColumn}>
            <div style={styles.columnHeaderRow}>
              <h2 style={styles.sectionHeader}>Recent Evaluations</h2>
              <span style={styles.subtextBadge}>{evaluations.length} total</span>
            </div>

            {recentEvaluations.length === 0 ? (
              <div style={styles.emptyCard}>
                <GraduationCap size={48} style={{ color: "#334155", marginBottom: "12px" }} />
                <h4 style={styles.emptyTitle}>No Graded Sheets Yet</h4>
                <p style={styles.emptyText}>Grade answer sheets against a question paper to view recent evaluations.</p>
              </div>
            ) : (
              <div style={styles.evalList}>
                {recentEvaluations.map((item) => {
                  const percent = item.maxMarks > 0 ? Math.round((item.obtainedMarks / item.maxMarks) * 100) : 0;
                  return (
                    <div
                      key={item.id}
                      style={styles.evalCard}
                      onClick={() =>
                        navigate("/evaluation/results", {
                          state: {
                            examPaperId: item.examPaperId,
                            filename: item.examPaperName,
                            totalMarks: item.maxMarks,
                            selectedEvaluationId: item.evaluationId,
                          },
                        })
                      }
                    >
                      <div style={styles.evalLeft}>
                        <div style={styles.evalAvatar}>
                          {(item.studentName || "U").charAt(0).toUpperCase()}
                        </div>
                        <div style={styles.evalDetails}>
                          <h4 style={styles.evalStudentName}>{item.studentName || "Unknown Student"}</h4>
                          <span style={styles.evalPaperName} title={item.examPaperName}>
                            📄 {item.examPaperName}
                          </span>
                        </div>
                      </div>

                      <div style={styles.evalRight}>
                        <div style={styles.scoreSummary}>
                          <span style={styles.scoreText}>
                            {item.obtainedMarks}/{item.maxMarks}
                          </span>
                          <span
                            style={{
                              ...styles.percentBadge,
                              backgroundColor: percent >= 75 ? "rgba(16, 185, 129, 0.1)" : percent >= 40 ? "rgba(245, 158, 11, 0.1)" : "rgba(239, 68, 68, 0.1)",
                              color: percent >= 75 ? "#34d399" : percent >= 40 ? "#fbbf24" : "#f87171",
                            }}
                          >
                            {percent}%
                          </span>
                        </div>
                        <div style={styles.evalDateWrapper}>
                          <Clock size={11} />
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {paperToDelete && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <AlertTriangle size={32} style={{ color: "#ef4444" }} />
              <h3 style={styles.modalTitle}>Delete Question Paper?</h3>
            </div>
            <p style={styles.modalBody}>
              Are you sure you want to delete <strong>{paperToDelete.pdf_filename}</strong>?<br />
              This action is permanent and will delete all associated student answer evaluations as well.
            </p>
            <div style={styles.modalFooter}>
              <button
                style={styles.cancelBtn}
                onClick={() => setPaperToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                style={styles.deleteBtn}
                onClick={handleDeletePaper}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Aesthetics styles complying with premium standards
const styles = {
  container: {
    background: "var(--bg)",
    color: "var(--text-muted)",
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box",
    transition: "background 0.3s ease, color 0.3s ease",
  },
  loadingContainer: {
    background: "var(--bg)",
    color: "var(--text-muted)",
    minHeight: "100vh",
    width: "100%",
  },
  loaderWrapper: {
    height: "calc(100vh - 80px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
  },
  shimmerSpinner: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: "3px solid var(--border)",
    borderTopColor: "var(--accent)",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    fontSize: "15px",
    color: "var(--text-muted)",
    fontWeight: "500",
  },
  // mainContent: {
  //   maxWidth: "1280px",
  //   margin: "0 auto",
  //   padding: "40px 24px",
  //   display: "flex",
  //   flexDirection: "column",
  //   gap: "36px",
  //   position: "relative",
  // },
  glowOrbs: {
    position: "absolute",
    top: 0,
    left: "10%",
    right: "10%",
    height: "300px",
    pointerEvents: "none",
    zIndex: 0,
  },
  orbPurple: {
    position: "absolute",
    top: "-50px",
    left: "-100px",
    width: "250px",
    height: "250px",
    background: "rgba(139, 92, 246, 0.12)",
    filter: "blur(80px)",
    borderRadius: "50%",
  },
  orbBlue: {
    position: "absolute",
    top: "100px",
    right: "-50px",
    width: "250px",
    height: "250px",
    background: "rgba(59, 130, 246, 0.1)",
    filter: "blur(80px)",
    borderRadius: "50%",
  },
  // welcomeSection: {
  //   display: "flex",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  //   flexWrap: "wrap",
  //   gap: "24px",
  //   zIndex: 1,
  // },
  welcomeInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    textAlign: "left",
  },
  badgeText: {
    alignSelf: "flex-start",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "var(--accent)",
    background: "var(--accent-bg)",
    padding: "4px 10px",
    borderRadius: "999px",
    border: "1px solid var(--accent-border)",
  },
  welcomeTitle: {
    fontSize: "32px",
    fontWeight: "800",
    color: "var(--text-h)",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  gradientText: {
    background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  welcomeSubtitle: {
    fontSize: "14px",
    color: "var(--text-muted)",
    margin: 0,
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 14px 0 rgba(139, 92, 246, 0.3)",
    transition: "all 0.2s ease",
  },
  secondaryBtn: {
    padding: "8px 16px",
    background: "var(--btn-sec-bg)",
    border: "1px solid var(--border)",
    color: "var(--text-h)",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  errorAlert: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 20px",
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "10px",
    color: "#f87171",
    fontSize: "14px",
    textAlign: "left",
    zIndex: 1,
  },
  retryBtn: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    color: "#f87171",
    fontWeight: "600",
    textDecoration: "underline",
    cursor: "pointer",
  },
  // statsGrid: {
  //   display: "grid",
  //   gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  //   gap: "20px",
  //   zIndex: 1,
  // },
  statCard: {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    backdropFilter: "blur(12px)",
    transition: "background 0.3s ease, border 0.3s ease",
  },
  statIconWrapper: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statInfo: {
    textAlign: "left",
  },
  statValue: {
    fontSize: "26px",
    fontWeight: "700",
    color: "var(--text-h)",
    margin: 0,
    lineHeight: "1",
  },
  statLabel: {
    fontSize: "12px",
    color: "var(--text-muted)",
    marginTop: "4px",
    fontWeight: "500",
  },
  workflowPanel: {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    padding: "28px",
    textAlign: "left",
    zIndex: 1,
    transition: "background 0.3s ease, border 0.3s ease",
  },
  sectionHeader: {
    fontSize: "20px",
    fontWeight: "700",
    color: "var(--text-h)",
    margin: 0,
  },
  sectionSub: {
    fontSize: "14px",
    color: "var(--text-muted)",
    marginTop: "4px",
    marginBottom: "24px",
  },
  // pipelineGrid: {
  //   display: "grid",
  //   gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  //   gap: "20px",
  // },
  pipelineCard: {
    background: "var(--code-bg)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    padding: "20px",
    position: "relative",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  pipelineNumber: {
    fontSize: "12px",
    fontWeight: "800",
    color: "var(--accent)",
    background: "var(--accent-bg)",
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  pipelineStepTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "var(--text-h)",
    margin: 0,
  },
  pipelineStepDesc: {
    fontSize: "12px",
    color: "var(--text-muted)",
    marginTop: "6px",
    lineHeight: "140%",
  },
  pipelineArrow: {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    color: "var(--text-muted)",
  },
  // twoColumnGrid: {
  //   display: "grid",
  //   gridTemplateColumns: "1fr 1fr",
  //   gap: "28px",
  //   zIndex: 1,
  // },
  gridColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    textAlign: "left",
  },
  columnHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  subtextBadge: {
    fontSize: "12px",
    color: "var(--text-muted)",
    background: "var(--code-bg)",
    padding: "3px 10px",
    borderRadius: "12px",
    fontWeight: "500",
  },
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    color: "var(--text-muted)",
  },
  searchInput: {
    padding: "8px 12px 8px 36px",
    background: "var(--code-bg)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text-h)",
    fontSize: "13px",
    outline: "none",
    width: "200px",
    transition: "border-color 0.2s",
  },
  emptyCard: {
    background: "var(--code-bg)",
    border: "1px dashed var(--border)",
    borderRadius: "16px",
    padding: "48px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "var(--text-h)",
    margin: 0,
  },
  emptyText: {
    fontSize: "13px",
    color: "var(--text-muted)",
    marginTop: "4px",
    marginBottom: "16px",
    maxWidth: "280px",
    textAlign: "center",
  },
  paperList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxHeight: "520px",
    overflowY: "auto",
    paddingRight: "4px",
  },
  repoCard: {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    padding: "20px",
    transition: "border-color 0.2s",
  },
  repoCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  repoCardMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  repoCardTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "var(--text-h)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "340px",
  },
  repoCardSub: {
    fontSize: "12px",
    color: "var(--text-muted)",
  },
  trashBtn: {
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    color: "#f87171",
    padding: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s",
  },
  repoCardDivider: {
    height: "1px",
    background: "var(--border)",
    margin: "14px 0",
  },
  repoActionsRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  repoActionBtn: {
    padding: "6px 12px",
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  evalList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxHeight: "520px",
    overflowY: "auto",
  },
  evalCard: {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  evalLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  evalAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "var(--accent-bg)",
    color: "var(--accent)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
  },
  evalDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    textAlign: "left",
  },
  evalStudentName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--text-h)",
    margin: 0,
  },
  evalPaperName: {
    fontSize: "11px",
    color: "var(--text-muted)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "200px",
  },
  evalRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "6px",
  },
  scoreSummary: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  scoreText: {
    fontSize: "14px",
    fontWeight: "700",
    color: "var(--text-h)",
  },
  percentBadge: {
    fontSize: "10px",
    fontWeight: "700",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  evalDateWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "10px",
    color: "var(--text-muted)",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.75)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "16px",
  },
  modalCard: {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "24px",
    maxWidth: "400px",
    width: "100%",
    textAlign: "left",
    boxShadow: "var(--shadow)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--text-h)",
    margin: 0,
  },
  modalBody: {
    fontSize: "14px",
    color: "var(--text-muted)",
    lineHeight: "150%",
    margin: 0,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "24px",
  },
  cancelBtn: {
    padding: "8px 16px",
    background: "var(--code-bg)",
    color: "var(--text)",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  deleteBtn: {
    padding: "8px 16px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
};