import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={submit} className="card" style={{ width: 340 }}>
        <h2 style={{ marginTop: 0 }}>🌊 Sign in</h2>
        {error && <div style={{ color: "var(--alert)", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <div style={{ marginBottom: 10 }}>
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button disabled={busy} type="submit" className="btn-primary" style={{ width: "100%" }}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 14 }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
