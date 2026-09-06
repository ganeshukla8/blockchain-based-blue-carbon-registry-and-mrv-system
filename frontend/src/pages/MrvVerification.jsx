import React, { useEffect, useState } from "react";
import client from "../api/client";
import StatusPill from "../components/StatusPill.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const RATES = {
  mangrove: 6.2,
  seagrass: 3.7,
  saltmarsh: 2.9,
};

export default function MrvVerification() {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // LOAD PROJECTS
  // ============================================================

  const load = async () => {
    try {
      const res = await client.get("/projects");

      setProjects(res.data.projects || []);
    } catch (err) {
      console.error("Could not load projects:", err);

      setError(
        err.response?.data?.message ||
          "Could not load projects"
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ============================================================
  // RUN / RERUN AUTOMATED MRV
  // ============================================================

  const runMrv = async (id) => {
    setBusyId(id);
    setError("");
    setSuccess("");

    try {
      // Run automated MRV on backend
      const res = await client.post(`/mrv/${id}/run`);

      /*
       * IMPORTANT:
       *
       * Always reload the projects from MongoDB after MRV.
       *
       * This ensures that the frontend receives the newest:
       * - mrvStatus
       * - mrvRules
       * - satelliteItemId
       * - satelliteAcquisitionDate
       * - mrvReportHash
       * - mrvIndices
       * - verifier information
       * - credits information
       *
       * Therefore browser refresh is NOT required.
       */
      await load();

      setSuccess(
        res.data.message ||
          "Automated MRV completed successfully"
      );
    } catch (err) {
      console.error(
        "Automated MRV error:",
        err
      );

      /*
       * Reload even when an error occurs.
       * This is useful if the backend updated MongoDB
       * before returning an error.
       */
      try {
        await load();
      } catch (loadErr) {
        console.error(
          "Could not reload projects:",
          loadErr
        );
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Automated MRV failed"
      );
    } finally {
      setBusyId(null);
    }
  };

  // ============================================================
  // VERIFIER DECISION
  // ============================================================

  const decide = async (id, approve) => {
    setBusyId(id);
    setError("");
    setSuccess("");

    try {
      const note = approve
        ? "Automated MRV passed and the verifier reviewed the submitted evidence."
        : "Project rejected after verifier review of the submitted MRV evidence.";

      const res = await client.post(
        `/mrv/${id}/decision`,
        {
          approve,
          note,
        }
      );

      /*
       * Reload latest project state from MongoDB.
       */
      await load();

      setSuccess(
        res.data.message ||
          (approve
            ? "Project approved"
            : "Project rejected")
      );
    } catch (err) {
      console.error(
        "Verifier decision error:",
        err
      );

      /*
       * Try to synchronize UI even after an error.
       */
      try {
        await load();
      } catch (loadErr) {
        console.error(
          "Could not reload projects:",
          loadErr
        );
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Verifier decision failed"
      );
    } finally {
      setBusyId(null);
    }
  };

  // ============================================================
  // ISSUE CREDITS
  // ============================================================

  const issue = async (id) => {
    setBusyId(id);
    setError("");
    setSuccess("");

    try {
      const res = await client.post(
        `/credits/${id}/issue`
      );

      /*
       * Reload latest project state from MongoDB.
       */
      await load();

      setSuccess(
        res.data.message ||
          "Credits issued successfully"
      );
    } catch (err) {
      console.error(
        "Credit issuance error:",
        err
      );

      try {
        await load();
      } catch (loadErr) {
        console.error(
          "Could not reload projects:",
          loadErr
        );
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Credit issuance failed"
      );
    } finally {
      setBusyId(null);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      className="container"
      style={{
        paddingTop: 28,
        paddingBottom: 40,
      }}
    >
      <h1>
        Monitoring, Reporting &amp; Verification
      </h1>

      <p
        style={{
          color: "var(--ink-soft)",
          fontSize: 13.5,
        }}
      >
        Automated MRV uses real Sentinel-2 L2A
        B04/B08 imagery and predefined validation
        rules. Projects that pass all automated
        rules become Auto-Verified. Projects that
        fail a rule are Flagged for Review and must
        either be corrected and rerun or rejected.
      </p>

      {/* ====================================================== */}
      {/* ERROR */}
      {/* ====================================================== */}

      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 8,
            background:
              "rgba(220, 38, 38, 0.08)",
            color: "#b91c1c",
            fontSize: 13,
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* ====================================================== */}
      {/* SUCCESS */}
      {/* ====================================================== */}

      {success && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 8,
            background:
              "rgba(16, 185, 129, 0.08)",
            color: "var(--teal-dark)",
            fontSize: 13,
          }}
        >
          ✅ {success}
        </div>
      )}

      {/* ====================================================== */}
      {/* PROJECTS */}
      {/* ====================================================== */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {projects.map((p) => (
          <div
            key={p._id}
            className="card"
          >
            {/* ================================================== */}
            {/* HEADER */}
            {/* ================================================== */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "flex-start",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 600,
                  }}
                >
                  {p.name}
                </div>

                <div
                  style={{
                    fontSize: 12.5,
                    color:
                      "var(--ink-soft)",
                  }}
                >
                  {p.location} ·{" "}
                  {p.areaHa} ha
                </div>
              </div>

              <StatusPill
                status={p.mrvStatus}
              />
            </div>

            {/* ================================================== */}
            {/* SATELLITE INFORMATION */}
            {/* ================================================== */}

            {p.satelliteItemId && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color:
                    "var(--ink-soft)",
                }}
              >
                Satellite scene:{" "}

                <span className="mono">
                  {p.satelliteItemId}
                </span>

                {p.satelliteAcquisitionDate
                  ? ` · ${new Date(
                      p.satelliteAcquisitionDate
                    ).toLocaleDateString()}`
                  : ""}

                {p.mrvReportHash && (
                  <>
                    {" "}
                    · MRV report CID:{" "}
                    <span className="mono">
                      {p.mrvReportHash}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* ================================================== */}
            {/* MRV RULES */}
            {/* ================================================== */}

            {p.mrvRules?.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: 4,
                }}
              >
                {p.mrvRules.map((r) => (
                  <div
                    key={r.key}
                    style={{
                      fontSize: 12,
                      display: "flex",
                      gap: 6,
                    }}
                  >
                    <span>
                      {r.pass
                        ? "✅"
                        : "❌"}
                    </span>

                    <span>
                      {r.key}
                    </span>

                    <span
                      className="mono"
                      style={{
                        marginLeft: "auto",
                        color:
                          "var(--ink-soft)",
                      }}
                    >
                      {r.detail}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ================================================== */}
            {/* ACTIONS */}
            {/* ================================================== */}

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems:
                  "center",
              }}
            >

              {/* ================================================= */}
              {/* PENDING → RUN MRV */}
              {/* ================================================= */}

              {p.mrvStatus === "Pending" &&
                ["verifier", "regulator"].includes(
                  user?.role
                ) && (
                  <button
                    disabled={
                      busyId === p._id
                    }
                    onClick={() =>
                      runMrv(p._id)
                    }
                    className="btn-primary"
                    style={{
                      fontSize: 12,
                      padding:
                        "7px 12px",
                    }}
                  >
                    {busyId === p._id
                      ? "Running MRV..."
                      : "Run Automated MRV"}
                  </button>
                )}

              {/* ================================================= */}
              {/* FLAGGED → RERUN OR REJECT */}
              {/* ================================================= */}

              {p.mrvStatus ===
                "Flagged for Review" &&
                user?.role ===
                  "verifier" && (
                  <>
                    {/* RERUN */}

                    <button
                      disabled={
                        busyId === p._id
                      }
                      onClick={() =>
                        runMrv(p._id)
                      }
                      className="btn-primary"
                      style={{
                        fontSize: 12,
                        padding:
                          "7px 12px",
                      }}
                    >
                      {busyId === p._id
                        ? "Rerunning MRV..."
                        : "Rerun Automated MRV"}
                    </button>

                    {/* REJECT */}

                    <button
                      disabled={
                        busyId === p._id
                      }
                      onClick={() =>
                        decide(
                          p._id,
                          false
                        )
                      }
                      className="btn-alert"
                      style={{
                        fontSize: 12,
                        padding:
                          "7px 12px",
                      }}
                    >
                      {busyId === p._id
                        ? "Processing..."
                        : "Reject"}
                    </button>

                    <span
                      style={{
                        fontSize: 12,
                        color:
                          "var(--ink-soft)",
                      }}
                    >
                      ⚠️ Automated MRV
                      failed. Correct
                      the evidence and
                      rerun, or reject
                      the project.
                    </span>
                  </>
                )}

              {/* ================================================= */}
              {/* AUTO-VERIFIED → APPROVE OR REJECT */}
              {/* ================================================= */}

              {p.mrvStatus ===
                "Auto-Verified" &&
                user?.role ===
                  "verifier" && (
                  <>
                    {/* APPROVE */}

                    <button
                      disabled={
                        busyId === p._id
                      }
                      onClick={() =>
                        decide(
                          p._id,
                          true
                        )
                      }
                      className="btn-primary"
                      style={{
                        fontSize: 12,
                        padding:
                          "7px 12px",
                      }}
                    >
                      {busyId === p._id
                        ? "Processing..."
                        : "Approve"}
                    </button>

                    {/* REJECT */}

                    <button
                      disabled={
                        busyId === p._id
                      }
                      onClick={() =>
                        decide(
                          p._id,
                          false
                        )
                      }
                      className="btn-alert"
                      style={{
                        fontSize: 12,
                        padding:
                          "7px 12px",
                      }}
                    >
                      {busyId === p._id
                        ? "Processing..."
                        : "Reject"}
                    </button>
                  </>
                )}

              {/* ================================================= */}
              {/* VERIFIER APPROVED → ISSUE CREDITS */}
              {/* ================================================= */}

              {p.mrvStatus ===
                "Verifier Approved" &&
                !p.creditsIssued &&
                user?.role ===
                  "regulator" && (
                  <button
                    disabled={
                      busyId === p._id
                    }
                    onClick={() =>
                      issue(p._id)
                    }
                    className="btn-primary"
                    style={{
                      fontSize: 12,
                      padding:
                        "7px 12px",
                    }}
                  >
                    {busyId === p._id
                      ? "Issuing..."
                      : `Issue ${
                          Math.round(
                            p.areaHa *
                              RATES[
                                p.ecosystem
                              ]
                          ).toLocaleString()
                        } tCO₂e credits`}
                  </button>
                )}

              {/* ================================================= */}
              {/* CREDITS ISSUED */}
              {/* ================================================= */}

              {p.creditsIssued && (
                <span
                  style={{
                    fontSize: 12,
                    color:
                      "var(--teal-dark)",
                  }}
                >
                  ✅{" "}
                  {Number(
                    p.creditsAmount || 0
                  ).toLocaleString()}{" "}
                  tCO₂e credits issued
                </span>
              )}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}