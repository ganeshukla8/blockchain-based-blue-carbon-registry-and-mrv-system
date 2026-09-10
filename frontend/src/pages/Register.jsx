import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Lock,
  Waves,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "owner",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      await register(
        form.name,
        form.email,
        form.password,
        form.role
      );

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed"
      );
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
            <span className="auth-eyebrow">JOIN THE REGISTRY</span>

            <h1>
              Restore
              <br />
              <em>what protects us.</em>
            </h1>

            <p>
              Register your account and become part of a transparent
              ecosystem for protecting blue carbon environments.
            </p>
          </div>

          <div className="auth-quote">
            <span>02</span>
            <p>
              From mangroves to seagrass, every project can create
              measurable environmental impact.
            </p>
          </div>
        </div>
      </section>

      {/* RIGHT FORM */}
      <section className="auth-panel">
        <div className="auth-form-wrap register-form-wrap">
          <Link to="/" className="auth-back">
            <ArrowLeft size={16} />
            Back to website
          </Link>

          <div className="auth-heading">
            <span className="auth-mobile-logo">
              <Waves size={18} />
            </span>

            <span className="auth-label">GET STARTED</span>

            <h2>Create your account</h2>

            <p>
              Join the Blue Carbon Registry and start creating
              measurable impact.
            </p>
          </div>

          <form onSubmit={submit} className="auth-form">
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <label className="auth-field">
              <span>Full name</span>

              <div className="auth-input-wrap">
                <User size={18} />

                <input
                  required
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                />
              </div>
            </label>

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
                  minLength={6}
                  placeholder="Minimum 6 characters"
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

            <div className="auth-field">
              <span>Account type</span>

              <div className="auth-role-grid">
                <button
                  type="button"
                  className={
                    form.role === "owner"
                      ? "auth-role active"
                      : "auth-role"
                  }
                  onClick={() =>
                    setForm({
                      ...form,
                      role: "owner",
                    })
                  }
                >
                  <strong>Project Owner</strong>
                  <small>Register projects</small>
                </button>

                <button
                  type="button"
                  className={
                    form.role === "verifier"
                      ? "auth-role active"
                      : "auth-role"
                  }
                  onClick={() =>
                    setForm({
                      ...form,
                      role: "verifier",
                    })
                  }
                >
                  <strong>Verifier</strong>
                  <small>Verify projects</small>
                </button>

                <button
                  type="button"
                  className={
                    form.role === "regulator"
                      ? "auth-role active"
                      : "auth-role"
                  }
                  onClick={() =>
                    setForm({
                      ...form,
                      role: "regulator",
                    })
                  }
                >
                  <strong>Regulator</strong>
                  <small>Review registry</small>
                </button>
              </div>
            </div>

            <button
              disabled={busy}
              type="submit"
              className="auth-submit"
            >
              {busy ? "Creating account..." : "Create account"}
              {!busy && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account?
            <Link to="/login">Sign in</Link>
          </div>

          <div className="auth-footer-note">
            Your account gives you secure access to the registry.
          </div>
        </div>
      </section>
    </main>
  );
}