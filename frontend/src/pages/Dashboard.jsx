import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  Leaf,
  MapPin,
  MoreHorizontal,
  Plus,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Waves,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";

import client from "../api/client";
import StatusPill from "../components/StatusPill.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const ECOSYSTEM_LABEL = {
  mangrove: "Mangrove Forest",
  seagrass: "Seagrass Meadow",
  saltmarsh: "Salt Marsh",
};

const ECOSYSTEM_SHORT = {
  mangrove: "Mangrove",
  seagrass: "Seagrass",
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

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const mine = user.role === "owner" ? "?mine=true" : "";

      const res = await client.get(`/projects${mine}`);

      setProjects(res.data.projects || []);
    } catch (err) {
      console.error("Could not load projects:", err);

      setError(
        err.response?.data?.message ||
          "Could not load projects"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role) {
      loadProjects();
    }
  }, [user?.role]);

  const selectFile = (projectId, file) => {
    setError("");
    setSuccess("");

    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF document.");
      return;
    }

    setSelectedFiles((current) => ({
      ...current,
      [projectId]: file,
    }));
  };

  const resubmitProject = async (projectId) => {
    const file = selectedFiles[projectId];

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
      const data = new FormData();
      data.append("document", file);

      const res = await client.post(
        `/projects/${projectId}/resubmit`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data.project) {
        setProjects((current) =>
          current.map((project) =>
            project._id === projectId
              ? res.data.project
              : project
          )
        );
      } else {
        await loadProjects();
      }

      setSelectedFiles((current) => {
        const updated = { ...current };
        delete updated[projectId];
        return updated;
      });

      setSuccess(
        res.data.message ||
          "Corrected evidence submitted successfully."
      );
    } catch (err) {
      console.error("Resubmission error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not resubmit project"
      );
    } finally {
      setBusyId(null);
    }
  };

  const totalArea = useMemo(
    () =>
      projects.reduce(
        (sum, project) =>
          sum + Number(project.areaHa || 0),
        0
      ),
    [projects]
  );

  const totalCredits = useMemo(
    () =>
      projects.reduce(
        (sum, project) =>
          sum + Number(project.creditsAmount || 0),
        0
      ),
    [projects]
  );

  const verifiedProjects = projects.filter(
    (p) =>
      p.mrvStatus === "Auto-Verified" ||
      p.mrvStatus === "Verifier Approved"
  ).length;

  const pendingProjects = projects.filter(
    (p) =>
      p.mrvStatus === "Pending" ||
      p.mrvStatus === "Flagged for Review"
  ).length;

  const recentProjects = [...projects]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    )
    .slice(0, 5);

  return (
    <main className="dashboard-page">
      <div className="dashboard-content">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <section className="dashboard-header">
          <div>
            <div className="dashboard-kicker">
              BLUE CARBON REGISTRY
            </div>

            <h1>
              Good to see you,{" "}
              <span>
                {user?.name?.split(" ")[0] || "there"}.
              </span>
            </h1>

            <p>
              Monitor your coastal projects, verification
              progress and carbon impact.
            </p>
          </div>

          {user.role === "owner" && (
            <Link
              to="/register-project"
              className="dashboard-add-btn"
            >
              <Plus size={17} />
              Register project
            </Link>
          )}
        </section>

        {/* =====================================================
            ALERTS
        ====================================================== */}

        {error && (
          <div className="dashboard-alert dashboard-alert-error">
            <AlertTriangle size={17} />
            <span>{error}</span>

            <button onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="dashboard-alert dashboard-alert-success">
            <CheckCircle2 size={17} />
            <span>{success}</span>

            <button onClick={() => setSuccess("")}>
              ×
            </button>
          </div>
        )}

        {/* =====================================================
            KPI CARDS
        ====================================================== */}

        <section className="dashboard-stats">
          <DashboardStat
            icon={<Leaf size={19} />}
            label="Registered projects"
            value={projects.length}
            detail={
              projects.length
                ? `${verifiedProjects} verified`
                : "No projects yet"
            }
            positive
          />

          <DashboardStat
            icon={<MapPin size={19} />}
            label="Protected area"
            value={`${totalArea.toLocaleString()} ha`}
            detail="Across registered projects"
          />

          <DashboardStat
            icon={<Waves size={19} />}
            label="Carbon credits"
            value={totalCredits.toLocaleString()}
            detail="tCO₂e issued"
            positive
          />

          <DashboardStat
            icon={<Clock3 size={19} />}
            label="Awaiting review"
            value={pendingProjects}
            detail={
              pendingProjects
                ? "Projects need attention"
                : "Everything is up to date"
            }
            warning={pendingProjects > 0}
          />
        </section>

        {/* =====================================================
            MAIN GRID
        ====================================================== */}

        <section className="dashboard-main-grid">
          {/* LEFT */}
          <div className="dashboard-main-column">
            {/* IMPACT CARD */}

            <div className="dashboard-impact-card">
              <div className="impact-card-top">
                <div>
                  <span className="dashboard-section-label">
                    IMPACT OVERVIEW
                  </span>

                  <h2>Coastal protection at work.</h2>

                  <p>
                    Your registered projects contribute to
                    measurable blue carbon protection.
                  </p>
                </div>

                <div className="impact-icon">
                  <TrendingUp size={21} />
                </div>
              </div>

              <div className="impact-chart">
                <div className="chart-y-axis">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>

                <div className="chart-area">
                  <div className="chart-grid-lines">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className="chart-bars">
                    <ChartBar
                      label="Jan"
                      value={34}
                    />
                    <ChartBar
                      label="Feb"
                      value={47}
                    />
                    <ChartBar
                      label="Mar"
                      value={42}
                    />
                    <ChartBar
                      label="Apr"
                      value={61}
                    />
                    <ChartBar
                      label="May"
                      value={72}
                    />
                    <ChartBar
                      label="Jun"
                      value={67}
                    />
                    <ChartBar
                      label="Jul"
                      value={81}
                    />
                    <ChartBar
                      label="Aug"
                      value={91}
                      active
                    />
                  </div>
                </div>
              </div>

              <div className="impact-chart-footer">
                <div>
                  <span className="chart-dot" />
                  Protected coastal area
                </div>

                <strong>
                  {totalArea.toLocaleString()} ha
                </strong>
              </div>
            </div>

            {/* RECENT PROJECTS */}

            <div className="dashboard-projects-card">
              <div className="dashboard-card-heading">
                <div>
                  <span className="dashboard-section-label">
                    REGISTRY
                  </span>

                  <h2>Recent projects</h2>
                </div>

                {projects.length > 5 && (
                  <Link to="/register-project">
                    View all
                    <ArrowUpRight size={15} />
                  </Link>
                )}
              </div>

              {loading ? (
                <div className="dashboard-loading">
                  <RefreshCw
                    size={18}
                    className="spin"
                  />
                  Loading projects...
                </div>
              ) : recentProjects.length === 0 ? (
                <div className="dashboard-empty">
                  <div className="empty-icon">
                    <Leaf size={22} />
                  </div>

                  <h3>No projects yet</h3>

                  <p>
                    Register your first blue carbon project
                    to start tracking its impact.
                  </p>

                  {user.role === "owner" && (
                    <Link
                      to="/register-project"
                      className="dashboard-empty-btn"
                    >
                      Register a project
                      <ArrowRightIcon />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="project-table">
                  <div className="project-table-head">
                    <span>PROJECT</span>
                    <span>ECOSYSTEM</span>
                    <span>AREA</span>
                    <span>STATUS</span>
                    <span />
                  </div>

                  {recentProjects.map((project) => (
                    <ProjectRow
                      key={project._id}
                      project={project}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <aside className="dashboard-side-column">
            {/* VERIFICATION */}

            <div className="verification-card">
              <div className="verification-icon">
                <ShieldCheck size={22} />
              </div>

              <span className="dashboard-section-label">
                MRV STATUS
              </span>

              <h3>
                {verifiedProjects}{" "}
                <span>
                  of {projects.length}
                </span>
              </h3>

              <p>
                projects have successfully passed
                verification.
              </p>

              <div className="verification-progress">
                <span
                  style={{
                    width: projects.length
                      ? `${Math.min(
                          (verifiedProjects /
                            projects.length) *
                            100,
                          100
                        )}%`
                      : "0%",
                  }}
                />
              </div>

              <div className="verification-bottom">
                <span>Verification rate</span>

                <strong>
                  {projects.length
                    ? Math.round(
                        (verifiedProjects /
                          projects.length) *
                          100
                      )
                    : 0}
                  %
                </strong>
              </div>
            </div>

            {/* ECOSYSTEM MIX */}

            <div className="ecosystem-card">
              <div className="dashboard-card-heading compact">
                <div>
                  <span className="dashboard-section-label">
                    PROJECT MIX
                  </span>

                  <h2>Ecosystems</h2>
                </div>

                <MoreHorizontal size={18} />
              </div>

              <div className="ecosystem-list">
                <EcosystemRow
                  label="Mangrove"
                  count={
                    projects.filter(
                      (p) => p.ecosystem === "mangrove"
                    ).length
                  }
                />

                <EcosystemRow
                  label="Seagrass"
                  count={
                    projects.filter(
                      (p) => p.ecosystem === "seagrass"
                    ).length
                  }
                />

                <EcosystemRow
                  label="Salt marsh"
                  count={
                    projects.filter(
                      (p) => p.ecosystem === "saltmarsh"
                    ).length
                  }
                />
              </div>
            </div>

            {/* QUICK ACTION */}

            {user.role === "owner" && (
              <div className="dashboard-quick-card">
                <div className="quick-leaf">
                  <Leaf size={20} />
                </div>

                <h3>Register a new project</h3>

                <p>
                  Add a new coastal restoration project
                  and submit its evidence for MRV.
                </p>

                <Link to="/register-project">
                  Start registration
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

/* ============================================================
   COMPONENTS
============================================================ */

function DashboardStat({
  icon,
  label,
  value,
  detail,
  positive,
  warning,
}) {
  return (
    <div className="dashboard-stat">
      <div className="dashboard-stat-top">
        <div className="dashboard-stat-icon">
          {icon}
        </div>

        {positive && (
          <span className="stat-positive">
            <TrendingUp size={12} />
          </span>
        )}

        {warning && (
          <span className="stat-warning">
            Attention
          </span>
        )}
      </div>

      <span className="dashboard-stat-label">
        {label}
      </span>

      <strong>{value}</strong>

      <small>{detail}</small>
    </div>
  );
}

function ChartBar({ label, value, active }) {
  return (
    <div className="chart-bar-column">
      <div className="chart-bar-value">
        <span
          className={
            active
              ? "chart-bar active"
              : "chart-bar"
          }
          style={{ height: `${value}%` }}
        />
      </div>

      <small>{label}</small>
    </div>
  );
}

function ProjectRow({ project }) {
  return (
    <div className="project-row">
      <div className="project-name-cell">
        <div className="project-leaf">
          <Leaf size={15} />
        </div>

        <div>
          <strong>{project.name}</strong>

          <small>
            {project.location || "Location not specified"}
          </small>
        </div>
      </div>

      <span className="ecosystem-name">
        {ECOSYSTEM_SHORT[project.ecosystem] ||
          project.ecosystem}
      </span>

      <span className="area-value">
        {Number(project.areaHa || 0).toLocaleString()} ha
      </span>

      <StatusPill status={project.mrvStatus} />

      <button className="project-more">
        <MoreHorizontal size={17} />
      </button>
    </div>
  );
}

function EcosystemRow({ label, count }) {
  return (
    <div className="ecosystem-row">
      <div className="ecosystem-name-wrap">
        <span className="ecosystem-dot" />
        <span>{label}</span>
      </div>

      <strong>{count}</strong>
    </div>
  );
}

function ArrowRightIcon() {
  return <ArrowUpRight size={16} />;
}