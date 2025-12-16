import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      style={{
        background: "#111827",
        borderBottom: "1px solid #1f2937",
        padding: "12px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <Link
          to="/books"
          style={{
            color: "#f9fafb",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "18px",
          }}
        >
          Library AI
        </Link>
        <Link
          to="/books"
          style={{ color: "#d1d5db", textDecoration: "none" }}
        >
          My Books
        </Link>
        <Link
          to="/ai"
          style={{ color: "#d1d5db", textDecoration: "none" }}
        >
          AI Panel
        </Link>
        {user?.role === "admin" && (
          <>
            <Link
              to="/admin/users"
              style={{ color: "#d1d5db", textDecoration: "none" }}
            >
              Admin Users
            </Link>
            <Link
              to="/admin/books"
              style={{ color: "#d1d5db", textDecoration: "none" }}
            >
              Admin Books
            </Link>
          </>
        )}
      </div>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <span style={{ color: "#9ca3af", fontSize: "14px" }}>
          {user?.name} ({user?.role})
        </span>
        <button
          onClick={handleLogout}
          style={{
            padding: "6px 12px",
            background: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
