import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

export default function WorkflowStepper({ currentStep, currentPageName }) {
  const navigate = useNavigate();

  const steps = [
    { number: 1, label: "Upload Paper" },
    { number: 2, label: "Review Questions" },
    { number: 3, label: "Upload Answer" },
    { number: 4, label: "Results" },
  ];

  return (
    <div style={styles.outerContainer}>
      {/* 1. Breadcrumbs Row */}
      <div style={styles.breadcrumbRow}>
        <span style={styles.dashboardLink} onClick={() => navigate("/dashboard")}>
          Dashboard
        </span>
        <span style={styles.breadcrumbSeparator}>›</span>
        <span style={styles.activePage}>{currentPageName}</span>
      </div>

      {/* 2. Stepper Row */}
      <div style={styles.stepperContainer}>
        {steps.map((step, idx) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <div key={step.number} style={styles.stepWrapper}>
              <div style={styles.stepMain}>
                {isCompleted ? (
                  <div style={styles.completedCircle}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                ) : isActive ? (
                  <div style={styles.activeCircle}>{step.number}</div>
                ) : (
                  <div style={styles.futureCircle}>{step.number}</div>
                )}

                <span
                  style={{
                    ...styles.stepLabel,
                    color: isActive
                      ? "var(--text-h)"
                      : isCompleted
                      ? "var(--text-muted)"
                      : "var(--text-muted)",
                    fontWeight: isActive ? "600" : "500",
                  }}
                >
                  {step.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  style={{
                    ...styles.line,
                    background: step.number < currentStep ? "#10b981" : "var(--border)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  outerContainer: {
    maxWidth: "1280px",
    width: "100%",
    margin: "0 auto",
    padding: "24px 40px 8px 40px",
    boxSizing: "border-box",
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
  },
  breadcrumbRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "20px",
  },
  dashboardLink: {
    color: "#60a5fa",
    cursor: "pointer",
    transition: "color 0.2s",
  },
  breadcrumbSeparator: {
    color: "var(--text-muted)",
    fontSize: "16px",
    userSelect: "none",
  },
  activePage: {
    color: "var(--text-h)",
  },
  stepperContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
    width: "100%",
  },
  stepWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  stepMain: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  completedCircle: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#10b981",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 10px rgba(16, 185, 129, 0.2)",
  },
  activeCircle: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "700",
    boxShadow: "0 0 12px rgba(139, 92, 246, 0.3)",
  },
  futureCircle: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "var(--code-bg)",
    border: "2px solid var(--border)",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "700",
  },
  stepLabel: {
    fontSize: "13px",
    letterSpacing: "0.2px",
  },
  line: {
    height: "2px",
    width: "48px",
    borderRadius: "1px",
    transition: "background 0.3s ease",
  },
};