import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Building2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function NewLoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [institution, setInstitution] = useState("");
  const [role, setRole] = useState("Teacher");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [focusedField, setFocusedField] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, password, name, institution, role });
      }
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      setLoading(false);
      setError(err.message || "Something went wrong. Please try again.");
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setSuccess(false);
    setError("");
    setEmail("");
    setPassword("");
    setName("");
    setConfirmPassword("");
    setInstitution("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.glowOrbs}>
        <div style={styles.orb1} />
        <div style={styles.orb2} />
      </div>

      <div style={styles.header}>
        <button
          style={styles.backBtn}
          onClick={() => navigate("/")}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-h)";
            e.currentTarget.style.background = "var(--accent-bg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>
        <div style={styles.logo} onClick={() => navigate("/")}>
          Parakh <span style={styles.gradient}>AI</span>
        </div>
      </div>

      <div style={styles.cardContainer}>
        {success ? (
          <div style={styles.successWrapper}>
            <div style={styles.successIconWrapper}>
              <CheckCircle size={48} style={{ color: "#4ade80" }} />
            </div>
            <h2 style={styles.successTitle}>
              {isLogin ? "Welcome Back!" : "Account Created!"}
            </h2>
            <p style={styles.successSubtitle}>
              {isLogin
                ? "Signing you into your dashboard..."
                : "Your account is ready. Redirecting..."}
            </p>
          </div>
        ) : (
          <div style={styles.card}>
            <div style={styles.tabs}>
              <button
                style={{
                  ...styles.tab,
                  ...(isLogin ? styles.activeTab : {}),
                }}
                onClick={() => {
                  if (!isLogin) toggleMode();
                }}
              >
                Sign In
              </button>
              <button
                style={{
                  ...styles.tab,
                  ...(!isLogin ? styles.activeTab : {}),
                }}
                onClick={() => {
                  if (isLogin) toggleMode();
                }}
              >
                Register
              </button>
            </div>

            <div style={styles.formHeader}>
              <div style={styles.logoIcon}>
                <GraduationCap size={24} style={{ color: "var(--accent)" }} />
              </div>
              <h2 style={styles.title}>
                {isLogin ? "Sign In to Parakh" : "Create an Account"}
              </h2>
              <p style={styles.subtitle}>
                {isLogin
                  ? "Access your exam papers and AI-driven assessments."
                  : "Start evaluating and parsing exam papers instantly."}
              </p>
            </div>

            <form onSubmit={handleAuth} style={styles.form}>
              {!isLogin && (
                <>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Full Name</label>
                    <div
                      style={{
                        ...styles.inputWrapper,
                        ...(focusedField === "name" ? styles.inputWrapperFocused : {}),
                      }}
                    >
                      <User size={18} style={styles.inputIcon} />
                      <input
                        type="text"
                        placeholder="Dr. Rajesh Kumar"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField("")}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Institution Name</label>
                    <div
                      style={{
                        ...styles.inputWrapper,
                        ...(focusedField === "institution" ? styles.inputWrapperFocused : {}),
                      }}
                    >
                      <Building2 size={18} style={styles.inputIcon} />
                      <input
                        type="text"
                        placeholder="IIT Bombay, Delhi University..."
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        required
                        onFocus={() => setFocusedField("institution")}
                        onBlur={() => setFocusedField("")}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Your Role</label>
                    <div style={styles.roleGrid}>
                      {["Teacher", "HOD", "Admin"].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          style={{
                            ...styles.roleBtn,
                            ...(role === r ? styles.roleBtnActive : {}),
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <div
                  style={{
                    ...styles.inputWrapper,
                    ...(focusedField === "email" ? styles.inputWrapperFocused : {}),
                  }}
                >
                  <Mail size={18} style={styles.inputIcon} />
                  <input
                    type="email"
                    placeholder="you@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField("")}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <div style={styles.labelRow}>
                  <label style={styles.label}>Password</label>
                  {isLogin && (
                    <button type="button" style={styles.forgotLink}>
                      Forgot?
                    </button>
                  )}
                </div>
                <div
                  style={{
                    ...styles.inputWrapper,
                    ...(focusedField === "password" ? styles.inputWrapperFocused : {}),
                  }}
                >
                  <Lock size={18} style={styles.inputIcon} />
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField("")}
                    style={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={styles.showHideBtn}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Confirm Password</label>
                  <div
                    style={{
                      ...styles.inputWrapper,
                      ...(focusedField === "confirmPassword" ? styles.inputWrapperFocused : {}),
                    }}
                  >
                    <Lock size={18} style={styles.inputIcon} />
                    <input
                      type={showCpw ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField("")}
                      style={styles.input}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCpw(!showCpw)}
                      style={styles.showHideBtn}
                    >
                      {showCpw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div style={styles.errorBox}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={styles.submitBtn}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(139, 92, 246, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {loading ? (
                  <div style={styles.spinner} />
                ) : (
                  <>
                    <span>{isLogin ? "Sign In" : "Register Now"}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div style={styles.footer}>
              <span style={styles.footerText}>
                {isLogin ? "New to our platform?" : "Already have an account?"}
              </span>{" "}
              <button onClick={toggleMode} style={styles.footerLink}>
                {isLogin ? "Create an account" : "Sign in here"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text-h)",
    padding: "20px 24px 80px 24px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflow: "hidden",
    fontFamily: "Inter, system-ui, sans-serif",
    transition: "background 0.3s ease, color 0.3s ease",
  },

  glowOrbs: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    zIndex: 1,
  },

  orb1: {
    position: "absolute",
    top: "-10%",
    left: "15%",
    width: "45vw",
    height: "45vw",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0, 0, 0, 0) 70%)",
    filter: "blur(40px)",
  },

  orb2: {
    position: "absolute",
    bottom: "5%",
    right: "10%",
    width: "40vw",
    height: "40vw",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(0, 0, 0, 0) 70%)",
    filter: "blur(40px)",
  },

  header: {
    width: "100%",
    maxWidth: "1200px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "60px",
    zIndex: 10,
    borderBottom: "1px solid var(--border)",
    paddingBottom: "15px",
  },

  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    padding: "8px 16px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
  },

  logo: {
    fontSize: "24px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
    cursor: "pointer",
    color: "var(--text-h)",
  },

  gradient: {
    background: "linear-gradient(135deg,#8b5cf6,#3b82f6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  cardContainer: {
    width: "100%",
    maxWidth: "460px",
    zIndex: 10,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },

  card: {
    width: "100%",
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "24px",
    padding: "40px 32px 32px 32px",
    boxShadow: "var(--shadow)",
    display: "flex",
    flexDirection: "column",
    transition: "background 0.3s ease, border 0.3s ease",
  },

  tabs: {
    display: "flex",
    background: "var(--code-bg)",
    padding: "4px",
    borderRadius: "12px",
    marginBottom: "32px",
    border: "1px solid var(--border)",
  },

  tab: {
    flex: 1,
    padding: "10px 0",
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    fontSize: "14px",
    fontWeight: "600",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  activeTab: {
    background: "var(--btn-sec-bg)",
    color: "var(--text-h)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
  },

  formHeader: {
    textAlign: "center",
    marginBottom: "28px",
  },

  logoIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "var(--accent-bg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px auto",
    border: "1px solid var(--accent-border)",
  },

  title: {
    fontSize: "24px",
    fontWeight: "700",
    margin: "0 0 8px 0",
    letterSpacing: "-0.5px",
    color: "var(--text-h)",
  },

  subtitle: {
    fontSize: "14px",
    color: "var(--text-muted)",
    margin: 0,
    lineHeight: "1.5",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-muted)",
  },

  forgotLink: {
    background: "transparent",
    border: "none",
    color: "var(--accent)",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    padding: 0,
  },

  inputWrapper: {
    display: "flex",
    alignItems: "center",
    background: "var(--code-bg)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "0 14px",
    height: "48px",
    transition: "all 0.2s ease",
  },

  inputWrapperFocused: {
    borderColor: "var(--accent)",
    boxShadow: "0 0 0 3px var(--accent-bg)",
    background: "var(--code-bg)",
  },

  inputIcon: {
    color: "var(--text-muted)",
    marginRight: "12px",
    flexShrink: 0,
  },

  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "var(--text-h)",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  },

  showHideBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    marginLeft: "8px",
  },

  roleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },

  roleBtn: {
    padding: "10px 0",
    background: "var(--code-bg)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    color: "var(--text-muted)",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  roleBtnActive: {
    background: "var(--accent-bg)",
    borderColor: "var(--accent)",
    color: "var(--accent)",
    fontWeight: "600",
  },

  submitBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    height: "48px",
    background: "linear-gradient(135deg,#8b5cf6,#6366f1)",
    border: "none",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginTop: "10px",
  },

  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderRadius: "50%",
    borderTopColor: "#fff",
    animation: "spin 0.8s linear infinite",
  },

  footer: {
    textAlign: "center",
    marginTop: "24px",
    fontSize: "13px",
  },

  footerText: {
    color: "var(--text-muted)",
  },

  footerLink: {
    background: "transparent",
    border: "none",
    color: "var(--accent)",
    fontWeight: "600",
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },

  successWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 32px",
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "24px",
    textAlign: "center",
    width: "100%",
  },

  successIconWrapper: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "rgba(74, 222, 128, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24px",
    border: "1px solid rgba(74, 222, 128, 0.2)",
  },

  successTitle: {
    fontSize: "24px",
    fontWeight: "700",
    margin: "0 0 10px 0",
    color: "var(--text-h)",
  },

  successSubtitle: {
    fontSize: "14px",
    color: "var(--text-muted)",
    margin: 0,
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 14px",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    borderRadius: "10px",
    color: "#f87171",
    fontSize: "13px",
    lineHeight: "1.4",
  },
};

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}