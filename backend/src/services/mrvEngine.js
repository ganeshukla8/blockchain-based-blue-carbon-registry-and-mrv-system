const { computeSatelliteMrv } = require("./satelliteService");

function runRules(satellite, hasDoc) {
  const rules = [
    {
      key: "Mean NDVI from Sentinel-2",
      pass: satellite.meanNdvi >= 0.40,
      detail: `${satellite.meanNdvi.toFixed(3)} >= 0.40 required`,
    },
    {
      key: "Vegetation coverage",
      pass: satellite.vegetationCoveragePct >= 30,
      detail: `${satellite.vegetationCoveragePct.toFixed(1)}% >= 30% required`,
    },
    {
      key: "Satellite sensed area consistency",
      pass: satellite.areaConsistencyPct >= 85 && satellite.areaConsistencyPct <= 115,
      detail: `${satellite.areaConsistencyPct.toFixed(1)}% (85-115% band)`,
    },
    {
      key: "Supporting document on IPFS",
      pass: !!hasDoc,
      detail: hasDoc ? "Real IPFS CID present" : "Missing",
    },
    {
      key: "Satellite cloud cover",
      pass: satellite.cloudCoverPct <= 20,
      detail: `${satellite.cloudCoverPct.toFixed(1)}% <= 20% required`,
    },
  ];

  return { rules, allPass: rules.every((rule) => rule.pass) };
}

async function evaluateProject(project) {
  if (!project.latitude || !project.longitude) {
    throw new Error("Project latitude and longitude are required for satellite MRV");
  }

  const satellite = await computeSatelliteMrv({
    latitude: project.latitude,
    longitude: project.longitude,
    areaHa: project.areaHa,
    maxCloud: 20,
  });

  const { rules, allPass } = runRules(satellite, !!project.docHash);
  return { satellite, indices: {
    vegIndex: satellite.meanNdvi,
    canopyPct: satellite.vegetationCoveragePct,
    areaConsistencyPct: satellite.areaConsistencyPct,
  }, rules, allPass };
}

module.exports = { evaluateProject };
