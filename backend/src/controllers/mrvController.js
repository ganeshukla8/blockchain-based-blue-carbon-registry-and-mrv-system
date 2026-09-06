const Project = require("../models/Project");
const { evaluateProject } = require("../services/mrvEngine");
const { storeJson } = require("../services/ipfs");
const chain = require("../services/blockchain");

// ============================================================
// POST /api/mrv/:projectId/run
//
// Initial:
// Pending -> Automated MRV
//
// Rerun:
// Flagged for Review -> Automated MRV again
//
// Not allowed:
// Auto-Verified
// Verifier Approved
// Rejected
// ============================================================
exports.runAutomatedMrv = async (req, res) => {
  try {
    const project =
      await Project.findById(
        req.params.projectId
      );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // ----------------------------------------------------------
    // Allow initial MRV and rerun after flag
    // ----------------------------------------------------------
    if (
      project.mrvStatus !== "Pending" &&
      project.mrvStatus !==
        "Flagged for Review"
    ) {
      return res.status(400).json({
        message:
          `Automated MRV cannot be run from status: ${project.mrvStatus}`,
      });
    }

    // ----------------------------------------------------------
    // Run actual satellite MRV
    // ----------------------------------------------------------
    const {
      indices,
      rules,
      allPass,
      satellite,
    } =
      await evaluateProject(project);

    // ----------------------------------------------------------
    // Build MRV report
    // ----------------------------------------------------------
    const report = {
      projectId:
        project._id.toString(),

      generatedAt:
        new Date().toISOString(),

      methodology:
        "Sentinel-2 L2A B04/B08 NDVI screening + rule validation",

      satellite,

      indices,

      rules,

      allPass,
    };

    // ----------------------------------------------------------
    // Store report on IPFS
    // ----------------------------------------------------------
    const reportFile =
      await storeJson(
        report,
        `mrv-${project._id}.json`
      );

    // ----------------------------------------------------------
    // Save latest MRV result
    //
    // IMPORTANT:
    // If this was a rerun, these values replace the
    // previous MRV result with the NEW calculation.
    // ----------------------------------------------------------
    project.mrvIndices =
      indices;

    project.mrvRules =
      rules;

    project.mrvReportHash =
      reportFile.cid;

    project.satelliteItemId =
      satellite.itemId;

    project.satelliteAcquisitionDate =
      satellite.acquisitionDate;

    // ----------------------------------------------------------
    // Determine new status
    // ----------------------------------------------------------
    if (allPass) {
      project.mrvStatus =
        "Auto-Verified";
    } else {
      project.mrvStatus =
        "Flagged for Review";
    }

    // ----------------------------------------------------------
    // Blockchain requirement
    // ----------------------------------------------------------
    if (
      process.env.REQUIRE_BLOCKCHAIN ===
        "true" &&
      !(
        process.env.REGISTRY_CONTRACT_ADDRESS &&
        project.chainProjectId
      )
    ) {
      return res.status(503).json({
        message:
          "Blockchain is required but this project is not linked to a deployed registry contract",
      });
    }

    // ----------------------------------------------------------
    // Submit MRV result on blockchain
    // ----------------------------------------------------------
    if (
      process.env.REGISTRY_CONTRACT_ADDRESS &&
      project.chainProjectId
    ) {
      try {
        const result =
          await chain.submitMrvResultOnChain({
            chainProjectId:
              project.chainProjectId,

            passed:
              allPass,

            reportHash:
              reportFile.cid,
          });

        project.txHashes.mrv =
          result.txHash;
      } catch (chainErr) {
        console.warn(
          "On-chain MRV submission skipped:",
          chainErr.message
        );

        if (
          process.env.REQUIRE_BLOCKCHAIN ===
          "true"
        ) {
          throw chainErr;
        }
      }
    }

    // ----------------------------------------------------------
    // Save MongoDB
    // ----------------------------------------------------------
    await project.save();

    // ----------------------------------------------------------
    // Return updated project
    //
    // Frontend uses this to update immediately,
    // so refresh is NOT required.
    // ----------------------------------------------------------
    return res.json({
      message: allPass
        ? "Automated MRV completed successfully"
        : "Automated MRV completed and project flagged for review",

      project,
    });
  } catch (err) {
    console.error(
      "Automated MRV error:",
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        "Automated MRV failed",
    });
  }
};


// ============================================================
// POST /api/mrv/:projectId/decision
//
// Auto-Verified:
//     Approve OR Reject
//
// Flagged for Review:
//     Reject ONLY
//     Approve is NOT allowed.
//
// Flagged projects must be corrected and rerun first.
// ============================================================
exports.verifierDecision = async (
  req,
  res
) => {
  try {
    const {
      approve,
      note,
    } = req.body;

    // ----------------------------------------------------------
    // Find project
    // ----------------------------------------------------------
    const project =
      await Project.findById(
        req.params.projectId
      );

    if (!project) {
      return res.status(404).json({
        message:
          "Project not found",
      });
    }

    // ----------------------------------------------------------
    // Only these statuses can receive a decision
    // ----------------------------------------------------------
    if (
      ![
        "Auto-Verified",
        "Flagged for Review",
      ].includes(
        project.mrvStatus
      )
    ) {
      return res.status(400).json({
        message:
          "Project is not awaiting a verifier decision",
      });
    }

    // ----------------------------------------------------------
    // FLAGGED PROJECT:
    // APPROVAL IS NOT ALLOWED
    // ----------------------------------------------------------
    if (
      approve === true &&
      project.mrvStatus !==
        "Auto-Verified"
    ) {
      return res.status(400).json({
        message:
          "A flagged project cannot be approved. Correct the evidence and rerun automated MRV first.",
      });
    }

    // ----------------------------------------------------------
    // Approval note
    // ----------------------------------------------------------
    if (
      approve === true &&
      (
        !note ||
        note.trim().length < 10
      )
    ) {
      return res.status(400).json({
        message:
          "An approval note of at least 10 characters is required",
      });
    }

    // ----------------------------------------------------------
    // Blockchain requirement
    // ----------------------------------------------------------
    if (
      process.env.REQUIRE_BLOCKCHAIN ===
        "true" &&
      !(
        process.env.REGISTRY_CONTRACT_ADDRESS &&
        project.chainProjectId
      )
    ) {
      return res.status(503).json({
        message:
          "Blockchain is required but this project is not linked to a deployed registry contract",
      });
    }

    // ----------------------------------------------------------
    // Set final verifier status
    // ----------------------------------------------------------
    if (approve === true) {
      project.mrvStatus =
        "Verifier Approved";
    } else {
      project.mrvStatus =
        "Rejected";
    }

    project.verifierNote =
      note || "";

    project.verifiedBy =
      req.user._id;

    // ----------------------------------------------------------
    // Blockchain verifier decision
    // ----------------------------------------------------------
    if (
      process.env.REGISTRY_CONTRACT_ADDRESS &&
      project.chainProjectId
    ) {
      try {
        const result =
          await chain.verifierDecisionOnChain({
            chainProjectId:
              project.chainProjectId,

            approve,

            note:
              note || "",
          });

        project.txHashes.verifierDecision =
          result.txHash;
      } catch (chainErr) {
        console.warn(
          "On-chain verifier decision skipped:",
          chainErr.message
        );

        if (
          process.env.REQUIRE_BLOCKCHAIN ===
          "true"
        ) {
          throw chainErr;
        }
      }
    }

    // ----------------------------------------------------------
    // Save
    // ----------------------------------------------------------
    await project.save();

    return res.json({
      message:
        approve === true
          ? "Project approved by verifier"
          : "Project rejected by verifier",

      project,
    });
  } catch (err) {
    console.error(
      "Verifier decision error:",
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        "Verifier decision failed",
    });
  }
};