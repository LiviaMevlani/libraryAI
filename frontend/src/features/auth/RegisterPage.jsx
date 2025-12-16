import { useState } from "react";
import { registerUser } from "../../api/authApi";
import { useNavigate, Link } from "react-router-dom";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Real-time password validation
    if (name === "password") {
      if (value && !PASSWORD_REGEX.test(value)) {
        setPasswordError(
          "Password must be at least 8 characters and contain one uppercase letter, one number, and one special character."
        );
      } else {
        setPasswordError("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }

    // Check password regex
    if (!PASSWORD_REGEX.test(form.password)) {
      setError(
        "Password must be at least 8 characters and contain one uppercase letter, one number, and one special character."
      );
      return;
    }

    try {
      setPending(true);
      const res = await registerUser(form);
      // Success - navigate to login
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      setPending(false);
      
      // Handle different error formats
      if (err.response?.data?.errors) {
        // Backend validation errors (object)
        const errors = err.response.data.errors;
        const errorMessages = Object.values(errors).join(" ");
        setError(errorMessages);
      } else if (err.response?.data?.message) {
        // Backend error message (string)
        setError(err.response.data.message);
      } else {
        setError("Registration failed. Please check your inputs and try again.");
      }
      return;
    }
  };

  return (
    <div className="app-shell">
      <div className="auth-card">
        <h1 className="auth-title">Register</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            className="auth-input"
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            className="auth-input"
            name="password"
            type="password"
            placeholder="Password (min 8 chars, 1 uppercase, 1 number, 1 special)"
            value={form.password}
            onChange={handleChange}
            required
          />
          {passwordError && <div className="auth-error" style={{ fontSize: "12px", marginTop: "-8px" }}>{passwordError}</div>}

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-button" type="submit" disabled={pending || !!passwordError}>
            {pending ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="auth-helper">
          Already have an account?{" "}
          <Link className="auth-link" to="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

