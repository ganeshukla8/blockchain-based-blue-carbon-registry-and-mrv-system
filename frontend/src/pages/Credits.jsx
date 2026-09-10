import React, { useEffect, useMemo, useState } from "react";
import {
  Coins,
  Leaf,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  MoreHorizontal,
  Activity,
  CheckCircle2,
} from "lucide-react";

import client from "../api/client";

export default function Credits() {
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCredits = async () => {
    try {
      setLoading(true);
      setError("");

      const [txRes, projectRes] = await Promise.all([
        client.get("/credits/transactions"),
        client.get("/projects"),
      ]);

      setTransactions(txRes.data.transactions || []);
      setProjects(projectRes.data.projects || []);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Could not load credit registry data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredits();
  }, []);

  const totalIssued = useMemo(() => {
    return projects.reduce(
      (sum, project) =>
        sum + Number(project.creditsAmount || 0),
      0
    );
  }, [projects]);

  const projectCredits = useMemo(() => {
    return [...projects]
      .filter(
        (project) =>
          Number(project.creditsAmount || 0) > 0
      )
      .sort(
        (a, b) =>
          Number(b.creditsAmount || 0) -
          Number(a.creditsAmount || 0)
      );
  }, [projects]);

  const totalTransactions = transactions.length;

  const retiredCredits = transactions.reduce(
    (sum, transaction) => {
      const type = String(
        transaction.type || ""
      ).toLowerCase();

      if (type.includes("retir")) {
        return (
          sum +
          Number(
            transaction.amount ||
              transaction.quantity ||
              0
          )
        );
      }

      return sum;
    },
    0
  );

  const activeCredits = Math.max(
    totalIssued - retiredCredits,
    0
  );

  return (
    <main className="credits-page">
      <div className="credits-content">

        {/* HEADER */}

        <section className="credits-header">
          <div>
            <span className="credits-kicker">
              CARBON CREDIT REGISTRY
            </span>

            <h1>
              Credit oversight
              <br />
              <em>& transparency.</em>
            </h1>

            <p>
              Review issued carbon credits, project
              allocations and registry transactions.
            </p>
          </div>

          <button
            className="credits-refresh"
            onClick={loadCredits}
            disabled={loading}
          >
            <RefreshCw
              size={15}
              className={
                loading ? "spin" : ""
              }
            />

            Refresh registry
          </button>
        </section>

        {/* ERROR */}

        {error && (
          <div className="credits-error">
            <span>!</span>
            {error}
          </div>
        )}

        {/* KPI */}

        <section className="credits-overview">

          <CreditStat
            icon={<Coins size={19} />}
            label="Total issued"
            value={totalIssued.toLocaleString()}
            detail="tCO₂e credits"
          />

          <CreditStat
            icon={<Activity size={19} />}
            label="Active credits"
            value={activeCredits.toLocaleString()}
            detail="Available in registry"
            positive
          />

          <CreditStat
            icon={<CheckCircle2 size={19} />}
            label="Retired credits"
            value={retiredCredits.toLocaleString()}
            detail="Permanently retired"
          />

          <CreditStat
            icon={<ShieldCheck size={19} />}
            label="Transactions"
            value={totalTransactions}
            detail="Recorded on registry"
          />

        </section>

        {/* MAIN */}

        <section className="credits-grid">

          {/* PROJECT DISTRIBUTION */}

          <div className="credits-main-card">
            <div className="credits-card-header">
              <div>
                <span className="credits-section-label">
                  REGISTRY ALLOCATION
                </span>

                <h2>Credits by project</h2>

                <p>
                  Carbon credits currently recorded
                  against registered projects.
                </p>
              </div>

              <div className="credits-card-icon">
                <Leaf size={19} />
              </div>
            </div>

            {loading ? (
              <div className="credits-loading">
                <RefreshCw
                  size={18}
                  className="spin"
                />
                Loading registry...
              </div>
            ) : projectCredits.length === 0 ? (
              <div className="credits-empty">
                <Coins size={23} />

                <strong>
                  No issued credits yet
                </strong>

                <span>
                  Credits will appear here after
                  projects are approved and issued.
                </span>
              </div>
            ) : (
              <div className="credit-project-list">
                {projectCredits.map((project) => {
                  const amount = Number(
                    project.creditsAmount || 0
                  );

                  const percentage =
                    totalIssued > 0
                      ? (amount / totalIssued) * 100
                      : 0;

                  return (
                    <div
                      className="credit-project-row"
                      key={project._id}
                    >
                      <div className="credit-project-icon">
                        <Leaf size={16} />
                      </div>

                      <div className="credit-project-info">
                        <strong>
                          {project.name}
                        </strong>

                        <span>
                          {project.location ||
                            "Location unavailable"}
                        </span>

                        <div className="credit-progress">
                          <span
                            style={{
                              width: `${Math.min(
                                percentage,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="credit-project-number">
                        <strong>
                          {amount.toLocaleString()}
                        </strong>

                        <span>tCO₂e</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* REGISTRY SUMMARY */}

          <aside className="credits-side-card">

            <div className="credits-side-icon">
              <ShieldCheck size={22} />
            </div>

            <span className="credits-section-label">
              REGISTRY STATUS
            </span>

            <h2>
              Transparent
              <br />
              carbon accounting.
            </h2>

            <p>
              Every credit recorded in the registry is
              associated with a project and its verification
              history.
            </p>

            <div className="credits-side-divider" />

            <CreditSummary
              label="Registered projects"
              value={projects.length}
            />

            <CreditSummary
              label="Issued credits"
              value={totalIssued.toLocaleString()}
            />

            <CreditSummary
              label="Retired credits"
              value={retiredCredits.toLocaleString()}
            />

          </aside>
        </section>

        {/* TRANSACTIONS */}

        <section className="credits-history-card">

          <div className="credits-card-header">
            <div>
              <span className="credits-section-label">
                ACTIVITY
              </span>

              <h2>Credit transactions</h2>

              <p>
                A transparent record of credit activity
                across the registry.
              </p>
            </div>

            <TrendingUp size={20} />
          </div>

          {loading ? (
            <div className="credits-loading">
              <RefreshCw
                size={18}
                className="spin"
              />
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="credits-empty">
              <Activity size={23} />

              <strong>
                No transactions recorded
              </strong>

              <span>
                Registry activity will appear here.
              </span>
            </div>
          ) : (
            <div className="credits-table">

              <div className="credits-table-head">
                <span>TRANSACTION</span>
                <span>PROJECT</span>
                <span>AMOUNT</span>
                <span>STATUS</span>
                <span>DATE</span>
                <span />
              </div>

              {transactions.map(
                (transaction, index) => (
                  <CreditTransaction
                    key={
                      transaction._id ||
                      transaction.id ||
                      index
                    }
                    transaction={transaction}
                  />
                )
              )}

            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* ========================================================= */

function CreditStat({
  icon,
  label,
  value,
  detail,
  positive,
}) {
  return (
    <div className="credit-stat">
      <div className="credit-stat-top">
        <div className="credit-stat-icon">
          {icon}
        </div>

        {positive && (
          <span className="credit-stat-trend">
            <TrendingUp size={12} />
          </span>
        )}
      </div>

      <span>{label}</span>

      <strong>{value}</strong>

      <small>{detail}</small>
    </div>
  );
}

/* ========================================================= */

function CreditSummary({ label, value }) {
  return (
    <div className="credit-summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* ========================================================= */

function CreditTransaction({
  transaction,
}) {
  const type =
    transaction.type ||
    transaction.action ||
    "Credit activity";

  const amount = Number(
    transaction.amount ||
      transaction.quantity ||
      0
  );

  const project =
    transaction.project?.name ||
    transaction.projectName ||
    "Registry transaction";

  const date = transaction.createdAt
    ? new Date(
        transaction.createdAt
      ).toLocaleDateString()
    : "—";

  return (
    <div className="credit-transaction-row">

      <div className="transaction-type">
        <div>
          <Coins size={15} />
        </div>

        <strong>{type}</strong>
      </div>

      <span className="transaction-project">
        {project}
      </span>

      <strong className="transaction-amount">
        {amount.toLocaleString()} tCO₂e
      </strong>

      <span className="transaction-status">
        <span />
        Recorded
      </span>

      <span className="transaction-date">
        {date}
      </span>

      <button className="transaction-more">
        <MoreHorizontal size={16} />
      </button>
    </div>
  );
}