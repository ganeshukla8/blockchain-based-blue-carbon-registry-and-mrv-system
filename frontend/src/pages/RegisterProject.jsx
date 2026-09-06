import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useWeb3 } from "../context/Web3Context.jsx";

export default function RegisterProject() {
  const navigate = useNavigate();
  const { address, connect } = useWeb3();
  const [form, setForm] = useState({ name: "", ecosystem: "mangrove", location: "", areaHa: "", latitude: "", longitude: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      let wallet = address;
      if (!wallet) wallet = await connect();
      if (!wallet) throw new Error("Connect MetaMask before registering a blockchain project");
      await client.post("/auth/wallet", { walletAddress: wallet });
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (file) data.append("document", file);

      await client.post("/projects", data, { headers: { "Content-Type": "multipart/form-data" } });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Could not register project");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 40, maxWidth: 640 }}>
      <h1>Register a blue carbon project</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>
        Stores the project and evidence, then uses the latitude/longitude for real Sentinel-2 MRV.
        The final demo should run with blockchain enforcement enabled.
      </p>

      <form onSubmit={submit} className="card" style={{ display: "grid", gap: 12 }}>
        {error && <div style={{ color: "var(--alert)", fontSize: 13 }}>{error}</div>}

        <label>
          <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 4 }}>Project name</div>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sundarbans Fringe Restoration" />
        </label>

        <label>
          <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 4 }}>Ecosystem type</div>
          <select value={form.ecosystem} onChange={(e) => setForm({ ...form, ecosystem: e.target.value })}>
            <option value="mangrove">Mangrove Forest</option>
            <option value="seagrass">Seagrass Meadow</option>
            <option value="saltmarsh">Salt Marsh</option>
          </select>
        </label>

        <label>
          <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 4 }}>Location</div>
          <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Sundarbans, West Bengal" />
        </label>

        <label>
          <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 4 }}>Area (hectares)</div>
          <input required type="number" min="0.1" step="0.1" value={form.areaHa} onChange={(e) => setForm({ ...form, areaHa: e.target.value })} placeholder="e.g. 45.5" />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label>
            <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 4 }}>Latitude</div>
            <input required type="number" step="any" min="-90" max="90" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="e.g. 21.9497" />
          </label>
          <label>
            <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 4 }}>Longitude</div>
            <input required type="number" step="any" min="-180" max="180" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="e.g. 88.8490" />
          </label>
        </div>

        <label>
          <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 4 }}>Supporting document (required for MRV)</div>
          <input required type="file" onChange={(e) => setFile(e.target.files[0])} />
        </label>

        <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Blockchain wallet: <span className="mono">{address || "not connected"}</span></div>

        <button disabled={busy} type="submit" className="btn-primary">
          {busy ? "Registering…" : "Register on-chain"}
        </button>
      </form>
    </div>
  );
}
