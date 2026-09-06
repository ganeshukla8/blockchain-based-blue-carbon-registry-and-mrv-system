import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useWeb3 } from "../context/Web3Context.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { address, connect, connecting } = useWeb3();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div style={{ background: "var(--ink)", color: "#fff" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link to="/" style={{ fontWeight: 700, textDecoration: "none", color: "#fff" }}>
            🌊 Blue Carbon Registry
          </Link>
          <Link to="/register-project" style={{ fontSize: 13, textDecoration: "none", color: "#B7C7C2" }}>Registry</Link>
          <Link to="/mrv" style={{ fontSize: 13, textDecoration: "none", color: "#B7C7C2" }}>MRV</Link>
          <Link to="/credits" style={{ fontSize: 13, textDecoration: "none", color: "#B7C7C2" }}>Credits</Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#B7C7C2" }}>{user.name} · {user.role}</span>
          <button
            onClick={connect}
            className="mono"
            style={{ background: "rgba(255,255,255,0.1)", color: "#fff", padding: "6px 10px", fontSize: 11, borderRadius: 6 }}
          >
            {connecting ? "Connecting…" : address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connect MetaMask"}
          </button>
          <button onClick={() => { logout(); navigate("/login"); }} className="btn-ghost" style={{ fontSize: 12 }}>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
