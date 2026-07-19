import { useTheme } from "../context/ThemeContext";

function ThemeToggle() {
  const { darkMode, setDarkMode } = useTheme();

  return (
    <button onClick={() => setDarkMode(!darkMode)}>
      {darkMode ? "☀ Light" : "🌙 Dark"}
    </button>
  );
}

export default ThemeToggle;