import React from "react";

const MAP = {
  Pending: { bg: "#EFEAE0", fg: "#8A6D2A" },
  "Auto-Verified": { bg: "#E4F1EC", fg: "#0A463C" },
  "Flagged for Review": { bg: "#F6E7E2", fg: "#A6432F" },
  "Verifier Approved": { bg: "#DCEFE5", fg: "#0A463C" },
  Rejected: { bg: "#F3DCD8", fg: "#A6432F" },
};

export default function StatusPill({ status }) {
  const s = MAP[status] || MAP.Pending;
  return (
    <span className="pill" style={{ background: s.bg, color: s.fg }}>
      {status}
    </span>
  );
}
