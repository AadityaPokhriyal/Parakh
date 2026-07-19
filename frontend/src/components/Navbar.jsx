import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { User, LogOut, Sun, Moon } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header style={styles.navbar}>
      <div style={styles.logo} onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}>
        Parakh <span style={styles.gradient}>AI</span>
      </div>

      <nav style={styles.navGroup}>
        {isAuthenticated && (
          <>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                ...styles.navLink,
                ...(location.pathname === "/dashboard" ? styles.navLinkActive : {}),
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/upload")}
              style={{
                ...styles.navLink,
                ...(location.pathname === "/upload" ? styles.navLinkActive : {}),
              }}
            >
              New Paper
            </button>
          </>
        )}
      </nav>

      <div style={styles.actions}>
        <button
          onClick={toggleTheme}
          style={styles.themeBtn}
          aria-label="Toggle day/night theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {isAuthenticated ? (
          <div style={styles.profileWrapper}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={styles.profileBadge}
            >
              <div style={styles.avatarCircle}>
                <User size={16} style={{ color: "var(--accent)" }} />
              </div>
              <span style={styles.userName}>{user?.name || "Teacher"}</span>
            </button>

            {showProfileMenu && (
              <div style={styles.profileDropdown}>
                <div style={styles.dropdownHeader}>
                  <div style={styles.dropdownName}>{user?.name}</div>
                  <div style={styles.dropdownEmail}>{user?.email}</div>
                  <div style={styles.dropdownSub}>{user?.institution}</div>
                </div>
                <div style={styles.dropdownDivider} />
                <button onClick={handleLogout} style={styles.dropdownBtn}>
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button style={styles.loginBtn} onClick={() => navigate("/login")}>
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 32px",
    background: "var(--bg)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    position: "sticky",
    top: "16px",
    zIndex: 100,
    width: "calc(100% - 48px)",
    maxWidth: "1280px",
    margin: "16px auto 0 auto",
    boxSizing: "border-box",
    boxShadow: "var(--shadow)",
    transition: "background 0.3s ease, border 0.3s ease",
  },
  logo: {
    fontSize: "24px",
    fontWeight: "800",
    cursor: "pointer",
    color: "var(--text-h)",
    letterSpacing: "-0.5px",
  },
  gradient: {
    background: "linear-gradient(135deg,#8b5cf6,#3b82f6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  navGroup: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  navLink: {
    background: "none",
    border: "none",
    color: "var(--text)",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
  },
  navLinkActive: {
    color: "var(--text-h)",
    background: "var(--accent-bg)",
    border: "1px solid var(--accent-border)",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  themeBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "1px solid var(--border)",
    background: "var(--code-bg)",
    color: "var(--text-h)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  loginBtn: {
    padding: "10px 22px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--code-bg)",
    color: "var(--text-h)",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  profileWrapper: {
    position: "relative",
  },
  profileBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "var(--code-bg)",
    border: "1px solid var(--border)",
    padding: "6px 14px",
    borderRadius: "999px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  avatarCircle: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "var(--accent-bg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    color: "var(--text-h)",
    fontSize: "14px",
    fontWeight: "500",
  },
  profileDropdown: {
    position: "absolute",
    right: 0,
    top: "calc(100% + 10px)",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    width: "240px",
    padding: "16px",
    boxShadow: "var(--shadow)",
    animation: "fadeIn 0.2s ease-out",
  },
  dropdownHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    textAlign: "left",
  },
  dropdownName: {
    color: "var(--text-h)",
    fontSize: "15px",
    fontWeight: "600",
  },
  dropdownEmail: {
    color: "var(--text)",
    fontSize: "13px",
  },
  dropdownSub: {
    color: "var(--accent)",
    fontSize: "12px",
    marginTop: "4px",
    fontWeight: "500",
  },
  dropdownDivider: {
    height: "1px",
    background: "var(--border)",
    margin: "12px 0",
  },
  dropdownBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "none",
    border: "none",
    color: "#f43f5e",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "left",
    transition: "background 0.2s",
  },
};