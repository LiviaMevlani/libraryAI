// src/features/auth/LoginPage.jsx
import { useState } from "react";
import { loginUser } from "../../api/authApi";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setPending(true);
      const res = await loginUser(form);
      const { access_token, user } = res.data;
      login({ accessToken: access_token, user });
      navigate("/books");
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors ||
        "Invalid email or password.";
      setError(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="auth-card">
        <h1 className="auth-title">Login</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />
          <input
            className="auth-input"
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-button" type="submit" disabled={pending}>
            {pending ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-helper">
          No account?{" "}
          <Link className="auth-link" to="/register">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
