import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "owner" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={submit} className="card" style={{ width: 360 }}>
        <h2 style={{ marginTop: 0 }}>🌊 Create account</h2>
        {error && <div style={{ color: "var(--alert)", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <div style={{ marginBottom: 10 }}>
          <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <input required type="password" placeholder="Password (min 6 chars)" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="owner">Project Owner</option>
            <option value="verifier">Verifier</option>
            <option value="regulator">Regulator</option>
          </select>
        </div>
        <button disabled={busy} type="submit" className="btn-primary" style={{ width: "100%" }}>
          {busy ? "Creating…" : "Create account"}
        </button>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 14 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
