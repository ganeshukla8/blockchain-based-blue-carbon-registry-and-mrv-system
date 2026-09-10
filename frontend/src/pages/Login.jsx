import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail, Lock, Waves } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

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
    <main className="auth-page">
      {/* LEFT VISUAL */}
      <section className="auth-visual">
        <div className="auth-visual-overlay" />

        <div className="auth-visual-content">
          <Link to="/" className="auth-brand">
            <span className="auth-brand-icon">
              <Waves size={20} />
            </span>
            Blue Carbon Registry
          </Link>

          <div className="auth-visual-copy">
            <span className="auth-eyebrow">BLUE CARBON REGISTRY</span>

            <h1>
              Protecting our
              <br />
              <em>coastal future.</em>
            </h1>

            <p>
              Track, verify and manage blue carbon projects with
              transparency powered by blockchain technology.
            </p>
          </div>

          <div className="auth-quote">
            <span>01</span>
            <p>
              Every verified project brings us one step closer to
              healthier oceans and stronger coastal communities.
            </p>
          </div>
        </div>
      </section>

      {/* RIGHT FORM */}
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <Link to="/" className="auth-back">
            <ArrowLeft size={16} />
            Back to website
          </Link>

          <div className="auth-heading">
            <span className="auth-mobile-logo">
              <Waves size={18} />
            </span>

            <span className="auth-label">WELCOME BACK</span>

            <h2>Sign in to your account</h2>

            <p>
              Access your projects, MRV verification and carbon
              credits.
            </p>
          </div>

          <form onSubmit={submit} className="auth-form">
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <label className="auth-field">
              <span>Email address</span>

              <div className="auth-input-wrap">
                <Mail size={18} />
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Password</span>

              <div className="auth-input-wrap">
                <Lock size={18} />

                <input
                  required
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                />
              </div>
            </label>

            <button
              disabled={busy}
              type="submit"
              className="auth-submit"
            >
              {busy ? "Signing in..." : "Sign in"}
              {!busy && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="auth-switch">
            Don't have an account?
            <Link to="/register">Create one</Link>
          </div>

          <div className="auth-footer-note">
            Secure access to the Blue Carbon Registry
          </div>
        </div>
      </section>
    </main>
  );
}