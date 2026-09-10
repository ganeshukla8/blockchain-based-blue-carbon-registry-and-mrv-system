import React, { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Plus,
  Search,
  Leaf,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import { Link } from "react-router-dom";
import client from "../api/client";

const images = {
  mangrove:
    "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1000&q=85",

  seagrass:
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=85",

  saltmarsh:
    "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=85",
};

const ecosystemNames = {
  mangrove: "Mangrove Forest",
  seagrass: "Seagrass Meadow",
  saltmarsh: "Salt Marsh",
};

function normalizeStatus(status) {
  if (!status) return "Pending";

  if (
    status === "Auto-Verified" ||
    status === "Verifier Approved" ||
    status === "Verified" ||
    status === "Approved"
  ) {
    return "Verified";
  }

  if (
    status === "Flagged for Review" ||
    status === "Rejected"
  ) {
    return "Flagged";
  }

  return "Pending";
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);

  if (normalized === "Verified") {
    return (
      <span className="registry-status registry-status-verified">
        <CheckCircle2 size={10} />
        Verified
      </span>
    );
  }

  if (normalized === "Flagged") {
    return (
      <span className="registry-status registry-status-flagged">
        <AlertCircle size={10} />
        Flagged
      </span>
    );
  }

  return (
    <span className="registry-status registry-status-pending">
      <Clock3 size={10} />
      Pending
    </span>
  );
}

export default function Registry() {
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await client.get("/projects");

      setProjects(
        response.data.projects || []
      );
    } catch (err) {
      console.error(
        "Registry loading error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Could not load registry projects."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     REGIONS
  ========================================================= */

  const regions = useMemo(() => {
    const values = projects
      .map((project) => project.location)
      .filter(Boolean)
      .map((location) => {
        const parts =
          location
            .split(",")
            .map((x) => x.trim());

        return parts[parts.length - 1];
      });

    return [
      ...new Set(values),
    ];
  }, [projects]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredProjects = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return projects.filter(
      (project) => {
        const searchable = [
          project.name,
          project.location,
          project.ecosystem,
          ecosystemNames[
            project.ecosystem
          ],
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !query ||
          searchable.includes(query);

        const projectRegion =
          project.location
            ?.split(",")
            .pop()
            ?.trim();

        const matchesRegion =
          region === "all" ||
          projectRegion === region;

        const normalized =
          normalizeStatus(
            project.mrvStatus
          );

        const matchesStatus =
          status === "all" ||
          normalized === status;

        return (
          matchesSearch &&
          matchesRegion &&
          matchesStatus
        );
      }
    );
  }, [
    projects,
    search,
    region,
    status,
  ]);

  return (
    <div className="page-shell">

      <main className="registry-content">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <section className="registry-header">

          <div>

            <div className="registry-eyebrow">
              BLUE CARBON REGISTRY
            </div>

            <h1>
              Blue Carbon Projects
            </h1>

            <p>
              Explore verified blue carbon
              projects creating real
              environmental and social impact.
            </p>

          </div>

          <Link
            to="/register-project"
            className="btn btn-primary registry-add"
          >
            <Plus size={13} />
            Add Project
          </Link>

        </section>


        {/* =====================================================
            SEARCH / FILTER BAR
        ===================================================== */}

        <section className="registry-toolbar">

          <div className="registry-search">

            <Search size={14} />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search projects..."
            />

          </div>


          <select
            value={region}
            onChange={(e) =>
              setRegion(
                e.target.value
              )
            }
          >

            <option value="all">
              All Regions
            </option>

            {regions.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}

          </select>


          <select
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value
              )
            }
          >

            <option value="all">
              All Status
            </option>

            <option value="Verified">
              Verified
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Flagged">
              Flagged
            </option>

          </select>

        </section>


        {/* =====================================================
            SUMMARY
        ===================================================== */}

        <div className="registry-summary">

          <span>
            Showing{" "}
            <strong>
              {filteredProjects.length}
            </strong>{" "}
            of{" "}
            <strong>
              {projects.length}
            </strong>{" "}
            projects
          </span>

          <span>
            <Leaf size={12} />
            Transparent conservation registry
          </span>

        </div>


        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="registry-error">
            <AlertCircle size={15} />
            {error}
          </div>
        )}


        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading ? (

          <div className="registry-empty">

            <div className="loading-spinner" />

            <strong>
              Loading registry...
            </strong>

          </div>

        ) : filteredProjects.length === 0 ? (

          /* ===================================================
             EMPTY
          =================================================== */

          <div className="registry-empty">

            <div className="registry-empty-icon">
              <Leaf size={25} />
            </div>

            <h3>
              No projects found
            </h3>

            <p>
              Try changing your search
              or filters.
            </p>

            {projects.length === 0 && (
              <Link
                to="/register-project"
                className="btn btn-primary"
              >
                Register First Project
                <ArrowRight size={12} />
              </Link>
            )}

          </div>

        ) : (

          /* ===================================================
             PROJECT GRID
          =================================================== */

          <section className="registry-grid">

            {filteredProjects.map(
              (project) => (
                <RegistryCard
                  key={project._id}
                  project={project}
                />
              )
            )}

          </section>

        )}

      </main>

    </div>
  );
}


/* ===========================================================
   REGISTRY CARD
=========================================================== */

function RegistryCard({
  project,
}) {
  const ecosystem =
    project.ecosystem ||
    "mangrove";

  const image =
    images[ecosystem] ||
    images.mangrove;

  const credits = Number(
    project.creditsAmount || 0
  );

  const area = Number(
    project.areaHa || 0
  );

  const location =
    project.location ||
    "Blue Carbon Site";

  return (
    <article className="registry-card">

      {/* IMAGE */}

      <div
        className="registry-card-image"
        style={{
          backgroundImage: `
            linear-gradient(
              180deg,
              rgba(3,48,60,.03),
              rgba(3,48,60,.3)
            ),
            url("${image}")
          `,
        }}
      >

        <StatusBadge
          status={
            project.mrvStatus
          }
        />

        <span className="registry-ecosystem">
          {ecosystemNames[
            ecosystem
          ] || "Blue Carbon"}
        </span>

      </div>


      {/* BODY */}

      <div className="registry-card-body">

        <h2>
          {project.name}
        </h2>

        <div className="registry-location">

          <MapPin size={11} />

          <span>
            {location}
          </span>

        </div>


        <div className="registry-card-description">
          Blue carbon conservation
          project focused on{" "}
          {ecosystemNames[
            ecosystem
          ]?.toLowerCase() ||
            "coastal ecosystem"}{" "}
          restoration.
        </div>


        {/* METRICS */}

        <div className="registry-metrics">

          <div>
            <strong>
              {credits.toLocaleString()}
            </strong>

            <span>
              Credits issued
            </span>
          </div>

          <div>
            <strong>
              {area.toLocaleString()}
            </strong>

            <span>
              Hectares
            </span>
          </div>

        </div>


        {/* FOOTER */}

        <div className="registry-card-footer">

          <span>
            Project Registry
          </span>

          <button
            type="button"
            className="registry-details"
            onClick={() =>
              window.alert(
                "Project details page can be connected here."
              )
            }
          >
            View Details
            <ArrowRight size={11} />
          </button>

        </div>

      </div>

    </article>
  );
}