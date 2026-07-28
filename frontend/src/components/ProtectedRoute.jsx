import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * ProtectedRoute wraps a route element and redirects unauthenticated users
 * to the login page. Shows nothing during loading to prevent flicker.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // or a loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
