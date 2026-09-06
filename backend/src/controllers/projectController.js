const crypto = require("crypto");
const Project = require("../models/Project");
const { storeDocument } = require("../services/ipfs");
const chain = require("../services/blockchain");

function pseudoWallet(seed) {
  return (
    "0x" +
    crypto
      .createHash("sha256")
      .update(seed)
      .digest("hex")
      .slice(0, 40)
  );
}

// ============================================================
// POST /api/projects
// Role: owner
// multipart/form-data
// Optional field: document
// ============================================================
exports.createProject = async (req, res) => {
  try {
    const {
      name,
      ecosystem,
      location,
      areaHa,
      latitude,
      longitude,
    } = req.body;

    // ----------------------------------------------------------
    // Validate required fields
    // ----------------------------------------------------------
    if (
      !name ||
      !ecosystem ||
      !location ||
      !areaHa ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        message:
          "name, ecosystem, location, areaHa, latitude and longitude are required",
      });
    }

    // ----------------------------------------------------------
    // Validate ecosystem
    // ----------------------------------------------------------
    if (
      ![
        "mangrove",
        "seagrass",
        "saltmarsh",
      ].includes(ecosystem)
    ) {
      return res.status(400).json({
        message:
          "ecosystem must be mangrove, seagrass or saltmarsh",
      });
    }

    // ----------------------------------------------------------
    // Validate coordinates
    // ----------------------------------------------------------
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lon) ||
      lon < -180 ||
      lon > 180
    ) {
      return res.status(400).json({
        message:
          "latitude must be -90..90 and longitude must be -180..180",
      });
    }

    // ----------------------------------------------------------
    // Supporting document is required
    // ----------------------------------------------------------
    if (!req.file) {
      return res.status(400).json({
        message:
          "A supporting document is required for MRV",
      });
    }

    // ----------------------------------------------------------
    // Store document on IPFS
    // ----------------------------------------------------------
    let docHash = null;
    let docName = null;

    const stored = await storeDocument(
      req.file.buffer,
      req.file.originalname
    );

    docHash = stored.cid;
    docName = req.file.originalname;

    // ----------------------------------------------------------
    // Blockchain wallet requirement
    // ----------------------------------------------------------
    if (
      process.env.REQUIRE_BLOCKCHAIN ===
        "true" &&
      !req.user.walletAddress
    ) {
      return res.status(400).json({
        message:
          "Connect your blockchain wallet before registering a project",
      });
    }

    const ownerWallet =
      req.user.walletAddress ||
      pseudoWallet(
        `owner:${req.user._id}`
      );

    // ----------------------------------------------------------
    // Create project
    // ----------------------------------------------------------
    const project =
      await Project.create({
        name,
        ecosystem,
        location,
        areaHa: Number(areaHa),
        latitude: lat,
        longitude: lon,

        ownerUser: req.user._id,
        ownerWallet,

        docHash,
        docName,

        mrvStatus: "Pending",
      });

    // ----------------------------------------------------------
    // Best-effort blockchain registration
    // ----------------------------------------------------------
    if (
      process.env
        .REGISTRY_CONTRACT_ADDRESS
    ) {
      try {
        const {
          txHash,
          chainProjectId,
        } =
          await chain.registerProjectOnChain(
            {
              name,
              ecosystem,
              location,
              areaHa,
              docHash,
              projectOwner:
                ownerWallet,
            }
          );

        project.txHashes.registration =
          txHash;

        if (
          chainProjectId != null
        ) {
          project.chainProjectId =
            chainProjectId;
        }

        await project.save();
      } catch (chainErr) {
        console.warn(
          "On-chain registration skipped:",
          chainErr.message
        );

        if (
          process.env
            .REQUIRE_BLOCKCHAIN ===
          "true"
        ) {
          throw chainErr;
        }
      }
    }

    return res.status(201).json({
      project,
    });
  } catch (err) {
    console.error(
      "Create project error:",
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        "Could not create project",
    });
  }
};


// ============================================================
// GET /api/projects
//
// Any authenticated role.
//
// Owner:
//   ?mine=true -> only own projects
//
// Verifier / regulator:
//   can see registry projects according to existing auth rules
// ============================================================
exports.listProjects = async (
  req,
  res
) => {
  try {
    const filter =
      req.query.mine === "true"
        ? {
            ownerUser:
              req.user._id,
          }
        : {};

    const projects =
      await Project.find(filter)
        .sort({
          createdAt: -1,
        })
        .populate(
          "ownerUser",
          "name email"
        );

    return res.json({
      projects,
    });
  } catch (err) {
    console.error(
      "List projects error:",
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        "Could not load projects",
    });
  }
};


// ============================================================
// GET /api/projects/:id
// ============================================================
exports.getProject = async (
  req,
  res
) => {
  try {
    const project =
      await Project.findById(
        req.params.id
      ).populate(
        "ownerUser",
        "name email"
      );

    if (!project) {
      return res.status(404).json({
        message:
          "Project not found",
      });
    }

    return res.json({
      project,
    });
  } catch (err) {
    console.error(
      "Get project error:",
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        "Could not load project",
    });
  }
};


// ============================================================
// POST /api/projects/:id/resubmit
//
// Role: owner
//
// multipart/form-data
// Field:
//   document = corrected PDF
//
// Workflow:
//
// Flagged for Review
//        ↓
// Owner uploads corrected document
//        ↓
// New document stored on IPFS
//        ↓
// Old MRV result cleared
//        ↓
// Status = Pending
//        ↓
// Verifier runs Automated MRV again
// ============================================================
exports.resubmitProject = async (
  req,
  res
) => {
  try {
    // ----------------------------------------------------------
    // 1. Find project
    // ----------------------------------------------------------
    const project =
      await Project.findById(
        req.params.id
      );

    if (!project) {
      return res.status(404).json({
        message:
          "Project not found",
      });
    }

    // ----------------------------------------------------------
    // 2. Security:
    // Only the owner of this project can resubmit it.
    // ----------------------------------------------------------
    if (
      project.ownerUser.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "You can only resubmit your own project",
      });
    }

    // ----------------------------------------------------------
    // 3. Only flagged projects can be resubmitted
    // ----------------------------------------------------------
    if (
      project.mrvStatus !==
      "Flagged for Review"
    ) {
      return res.status(400).json({
        message:
          `Only a project flagged for review can be resubmitted. Current status: ${project.mrvStatus}`,
      });
    }

    // ----------------------------------------------------------
    // 4. New document required
    // ----------------------------------------------------------
    if (!req.file) {
      return res.status(400).json({
        message:
          "A corrected supporting PDF is required",
      });
    }

    // ----------------------------------------------------------
    // 5. Validate PDF
    // ----------------------------------------------------------
    const isPdf =
      req.file.mimetype ===
        "application/pdf" ||
      req.file.originalname
        ?.toLowerCase()
        .endsWith(".pdf");

    if (!isPdf) {
      return res.status(400).json({
        message:
          "Only PDF documents are accepted",
      });
    }

    // ----------------------------------------------------------
    // 6. Store NEW document on IPFS
    // ----------------------------------------------------------
    const stored =
      await storeDocument(
        req.file.buffer,
        req.file.originalname
      );

    if (!stored?.cid) {
      return res.status(500).json({
        message:
          "Corrected document could not be stored",
      });
    }

    // ----------------------------------------------------------
    // 7. Update document information
    // ----------------------------------------------------------
    project.docHash =
      stored.cid;

    project.docName =
      req.file.originalname;

    // ----------------------------------------------------------
    // 8. Clear previous MRV results
    //
    // This is important.
    //
    // We don't want the old failed result to remain
    // attached to the new submission.
    // ----------------------------------------------------------
    project.satelliteItemId =
      null;

    project.satelliteAcquisitionDate =
      null;

    project.mrvIndices = undefined;

    project.mrvRules = [];

    project.mrvReportHash =
      null;

    // ----------------------------------------------------------
    // 9. Reset status to Pending
    //
    // The verifier must run Automated MRV again.
    // ----------------------------------------------------------
    project.mrvStatus =
      "Pending";

    // ----------------------------------------------------------
    // 10. Clear previous verifier information
    // ----------------------------------------------------------
    project.verifierNote =
      "";

    project.verifiedBy =
      null;

    // ----------------------------------------------------------
    // 11. Save MongoDB
    // ----------------------------------------------------------
    await project.save();

    // ----------------------------------------------------------
    // 12. Return updated project
    //
    // Frontend can update immediately without refresh.
    // ----------------------------------------------------------
    return res.json({
      message:
        "Corrected evidence uploaded successfully. Project has been resubmitted for automated MRV.",

      project,
    });
  } catch (err) {
    console.error(
      "Project resubmission error:",
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        "Could not resubmit project",
    });
  }
};