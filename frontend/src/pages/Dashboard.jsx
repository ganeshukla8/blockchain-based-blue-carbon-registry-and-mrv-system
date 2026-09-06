import React, { useEffect, useState } from "react";
import client from "../api/client";
import StatusPill from "../components/StatusPill.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const ECOSYSTEM_LABEL = {
  mangrove: "Mangrove Forest",
  seagrass: "Seagrass Meadow",
  saltmarsh: "Salt Marsh",
};

export default function Dashboard() {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedFiles, setSelectedFiles] = useState({});
  const [busyId, setBusyId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // LOAD PROJECTS
  // ============================================================

  const loadProjects = async () => {
    try {
      setLoading(true);

      const mine =
        user.role === "owner"
          ? "?mine=true"
          : "";

      const res =
        await client.get(
          `/projects${mine}`
        );

      setProjects(
        res.data.projects || []
      );
    } catch (err) {
      console.error(
        "Could not load projects:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Could not load projects"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [user.role]);

  // ============================================================
  // SELECT CORRECTED DOCUMENT
  // ============================================================

  const selectFile = (projectId, file) => {
    setError("");
    setSuccess("");

    if (!file) {
      return;
    }

    // Basic PDF validation
    if (
      file.type !==
      "application/pdf"
    ) {
      setError(
        "Please upload a PDF document."
      );

      return;
    }

    setSelectedFiles((current) => ({
      ...current,
      [projectId]: file,
    }));
  };

  // ============================================================
  // UPLOAD CORRECTED DOCUMENT + RESUBMIT
  // ============================================================

  const resubmitProject = async (
    projectId
  ) => {
    const file =
      selectedFiles[projectId];

    if (!file) {
      setError(
        "Please select a corrected PDF before resubmitting."
      );

      return;
    }

    setBusyId(projectId);
    setError("");
    setSuccess("");

    try {
      const data =
        new FormData();

      data.append(
        "document",
        file
      );

      const res =
        await client.post(
          `/projects/${projectId}/resubmit`,
          data,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      // Update immediately without refresh
      if (res.data.project) {
        setProjects((current) =>
          current.map((project) =>
            project._id ===
            projectId
              ? res.data.project
              : project
          )
        );
      } else {
        await loadProjects();
      }

      // Remove selected file
      setSelectedFiles((current) => {
        const updated = {
          ...current,
        };

        delete updated[projectId];

        return updated;
      });

      setSuccess(
        res.data.message ||
          "Corrected evidence submitted. Project is ready for MRV."
      );
    } catch (err) {
      console.error(
        "Resubmission error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not resubmit project"
      );
    } finally {
      setBusyId(null);
    }
  };

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalArea =
    projects.reduce(
      (s, p) =>
        s + Number(p.areaHa || 0),
      0
    );

  const totalCredits =
    projects.reduce(
      (s, p) =>
        s +
        Number(
          p.creditsAmount || 0
        ),
      0
    );

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
      <h1
        style={{
          marginBottom: 4,
        }}
      >
        Registry Overview
      </h1>

      <p
        style={{
          color: "var(--ink-soft)",
          marginTop: 0,
          fontSize: 13.5,
        }}
      >
        {user.role === "owner"
          ? "Your registered projects"
          : "All projects across the registry"}
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
            color:
              "var(--teal-dark)",
            fontSize: 13,
          }}
        >
          ✅ {success}
        </div>
      )}

      {/* ====================================================== */}
      {/* STATISTICS */}
      {/* ====================================================== */}

      <div
        className="grid-stats"
        style={{
          margin: "20px 0",
        }}
      >
        <StatCard
          label="Projects"
          value={projects.length}
        />

        <StatCard
          label="Hectares"
          value={totalArea.toLocaleString()}
        />

        <StatCard
          label="Credits issued"
          value={
            totalCredits.toLocaleString() +
            " tCO₂e"
          }
        />
      </div>

      {/* ====================================================== */}
      {/* LOADING */}
      {/* ====================================================== */}

      {loading && (
        <p>Loading…</p>
      )}

      {/* ====================================================== */}
      {/* EMPTY */}
      {/* ====================================================== */}

      {!loading &&
        projects.length === 0 && (
          <div className="card">
            No projects yet.

            {user.role ===
              "owner" &&
              " Head to the Registry tab to add one."}
          </div>
        )}

      {/* ====================================================== */}
      {/* PROJECT LIST */}
      {/* ====================================================== */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {projects.map((p) => (
          <div
            key={p._id}
            className="card"
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "flex-start",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {/* ================================================== */}
            {/* PROJECT INFORMATION */}
            {/* ================================================== */}

            <div
              style={{
                flex: 1,
                minWidth: 250,
              }}
            >
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
                {
                  ECOSYSTEM_LABEL[
                    p.ecosystem
                  ]
                }{" "}
                · {p.location} ·{" "}
                {p.areaHa} ha
              </div>

              {/* ================================================ */}
              {/* EXISTING DOCUMENT */}
              {/* ================================================ */}

              {p.docName && (
                <div
                  style={{
                    fontSize: 12,
                    color:
                      "var(--ink-soft)",
                    marginTop: 5,
                  }}
                >
                  📄 Evidence:{" "}
                  {p.docName}
                </div>
              )}

              {/* ================================================ */}
              {/* CREDITS */}
              {/* ================================================ */}

              {p.creditsIssued && (
                <div
                  style={{
                    fontSize: 12,
                    color:
                      "var(--teal-dark)",
                    marginTop: 4,
                  }}
                >
                  {Number(
                    p.creditsAmount ||
                      0
                  ).toLocaleString()}{" "}
                  tCO₂e issued to{" "}
                  {p.ownerWallet
                    ? `${p.ownerWallet.slice(
                        0,
                        8
                      )}…`
                    : "owner"}
                </div>
              )}

              {/* ================================================= */}
              {/* FLAGGED PROJECT — CORRECTION */}
              {/* ================================================= */}

              {user.role ===
                "owner" &&
                p.mrvStatus ===
                  "Flagged for Review" && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 8,
                      border:
                        "1px solid rgba(220, 38, 38, 0.2)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        marginBottom: 4,
                      }}
                    >
                      ⚠️ Correction Required
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color:
                          "var(--ink-soft)",
                        marginBottom: 10,
                      }}
                    >
                      The automated MRV
                      could not verify
                      this project. Upload
                      corrected supporting
                      evidence and resubmit
                      it for another MRV
                      evaluation.
                    </div>

                    {/* FILE INPUT */}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) =>
                        selectFile(
                          p._id,
                          e.target
                            .files?.[0]
                        )
                      }
                      disabled={
                        busyId ===
                        p._id
                      }
                    />

                    {/* SELECTED FILE */}
                    {selectedFiles[
                      p._id
                    ] && (
                      <div
                        style={{
                          fontSize: 12,
                          marginTop: 6,
                          color:
                            "var(--ink-soft)",
                        }}
                      >
                        Selected:{" "}
                        {
                          selectedFiles[
                            p._id
                          ].name
                        }
                      </div>
                    )}

                    {/* RESUBMIT */}
                    <button
                      type="button"
                      disabled={
                        busyId ===
                          p._id ||
                        !selectedFiles[
                          p._id
                        ]
                      }
                      onClick={() =>
                        resubmitProject(
                          p._id
                        )
                      }
                      className="btn-primary"
                      style={{
                        marginTop: 10,
                        fontSize: 12,
                        padding:
                          "7px 12px",
                      }}
                    >
                      {busyId ===
                      p._id
                        ? "Submitting…"
                        : "Upload & Resubmit for MRV"}
                    </button>
                  </div>
                )}
            </div>

            {/* ================================================== */}
            {/* STATUS */}
            {/* ================================================== */}

            <StatusPill
              status={p.mrvStatus}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}) {
  return (
    <div className="card">
      <div
        style={{
          fontSize: 11.5,
          color:
            "var(--ink-soft)",
          fontWeight: 500,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginTop: 4,
        }}
      >
        {value}
      </div>
    </div>
  );
}