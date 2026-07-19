import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { User, LogOut, Sun, Moon } from "lucide-react";
import './Navbar.css';

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
    <header className="navbar">
      <div className="logo" onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}>
        Parakh <span className="gradient">AI</span>
      </div>

      <nav className="navGroup">
        {isAuthenticated && (
          <>
           <button
  onClick={() => navigate("/dashboard")}
  className={`navLink ${
    location.pathname === "/dashboard" ? "navLinkActive" : ""
  }`}
>
              Dashboard
            </button>
            <button
              onClick={() => navigate("/upload")}
              className={`navLink ${
                location.pathname === "/upload" ? "navLinkActive" : ""
              }`}
            >
              New Paper
            </button>
          </>
        )}
      </nav>

      <div className="actions">
        <button
          onClick={toggleTheme}
          className="themeBtn"
          aria-label="Toggle day/night theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {isAuthenticated ? (
          <div className="profileWrapper">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="profileBadge"
            >
              <div className="avatarCircle">
                <User size={16} style={{ color: "var(--accent)" }} />
              </div>
              <span className="userName">{user?.name || "Teacher"}</span>
            </button>

            {showProfileMenu && (
              <div className="profileDropdown">
                <div className="dropdownHeader">
                  <div className="dropdownName">{user?.name}</div>
                  <div className="dropdownEmail">{user?.email}</div>
                  <div className="dropdownSub">{user?.institution}</div>
                </div>
                <div className="dropdownDivider" />
                <button onClick={handleLogout} className="dropdownBtn">
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="loginBtn" onClick={() => navigate("/login")}>
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}

