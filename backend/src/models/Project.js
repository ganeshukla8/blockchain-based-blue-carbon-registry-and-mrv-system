const mongoose = require("mongoose");

const mrvRuleResultSchema = new mongoose.Schema(
  {
    key: String,
    pass: Boolean,
    detail: String,
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    ecosystem: { type: String, enum: ["mangrove", "seagrass", "saltmarsh"], required: true },
    location: { type: String, required: true },
    areaHa: { type: Number, required: true, min: 0.01 },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    satelliteItemId: { type: String, default: null },
    satelliteAcquisitionDate: { type: Date, default: null },

    ownerUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ownerWallet: { type: String, required: true },

    docHash: { type: String, default: null }, // IPFS CID of supporting documents
    docName: { type: String, default: null },

    // mirrors the on-chain Status enum (Pending, AutoVerified, Flagged, Approved, Rejected)
    mrvStatus: {
      type: String,
      enum: ["Pending", "Auto-Verified", "Flagged for Review", "Verifier Approved", "Rejected"],
      default: "Pending",
    },
    mrvIndices: {
      vegIndex: Number,
      canopyPct: Number,
      areaConsistencyPct: Number,
    },
    mrvRules: [mrvRuleResultSchema],
    mrvReportHash: { type: String, default: null },
    verifierNote: { type: String, default: "" },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    creditsIssued: { type: Boolean, default: false },
    creditsAmount: { type: Number, default: 0 },

    // on-chain linkage
    chainProjectId: { type: Number, default: null },
    txHashes: {
      registration: String,
      mrv: String,
      verifierDecision: String,
      issuance: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
