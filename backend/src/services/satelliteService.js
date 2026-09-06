const { fromUrl } = require("geotiff");

const STAC_URL =
  "https://planetarycomputer.microsoft.com/api/stac/v1/search";

const SIGN_URL =
  "https://planetarycomputer.microsoft.com/api/sas/v1/sign";

const COLLECTION = "sentinel-2-l2a";

function assertCoordinates(latitude, longitude) {
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error(
      "Valid latitude (-90 to 90) is required for satellite MRV"
    );
  }

  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      "Valid longitude (-180 to 180) is required for satellite MRV"
    );
  }
}


// ------------------------------------------------------------
// WGS84 latitude/longitude -> UTM metres
// ------------------------------------------------------------
function wgs84ToUtm(lat, lon) {
  const a = 6378137.0;
  const eccSquared = 0.00669438;
  const k0 = 0.9996;

  const zone = Math.floor((lon + 180) / 6) + 1;

  const lonOrigin =
    (zone - 1) * 6 - 180 + 3;

  const latRad =
    lat * Math.PI / 180;

  const lonRad =
    lon * Math.PI / 180;

  const lonOriginRad =
    lonOrigin * Math.PI / 180;

  const eccPrimeSquared =
    eccSquared / (1 - eccSquared);

  const N =
    a /
    Math.sqrt(
      1 -
      eccSquared *
      Math.sin(latRad) ** 2
    );

  const T =
    Math.tan(latRad) ** 2;

  const C =
    eccPrimeSquared *
    Math.cos(latRad) ** 2;

  const A =
    Math.cos(latRad) *
    (lonRad - lonOriginRad);

  const M =
    a *
    (
      (1 -
        eccSquared / 4 -
        3 * eccSquared ** 2 / 64 -
        5 * eccSquared ** 3 / 256) *
      latRad

      -
      (3 * eccSquared / 8 +
        3 * eccSquared ** 2 / 32 +
        45 * eccSquared ** 3 / 1024) *
      Math.sin(2 * latRad)

      +
      (15 * eccSquared ** 2 / 256 +
        45 * eccSquared ** 3 / 1024) *
      Math.sin(4 * latRad)

      -
      (35 * eccSquared ** 3 / 3072) *
      Math.sin(6 * latRad)
    );

  let easting =
    k0 *
    N *
    (
      A +
      (1 - T + C) *
      A ** 3 /
      6 +

      (5 -
        18 * T +
        T ** 2 +
        72 * C -
        58 * eccPrimeSquared) *
      A ** 5 /
      120
    ) +
    500000.0;

  let northing =
    k0 *
    (
      M +
      N *
      Math.tan(latRad) *
      (
        A ** 2 / 2 +

        (5 -
          T +
          9 * C +
          4 * C ** 2) *
        A ** 4 /
        24 +

        (61 -
          58 * T +
          T ** 2 +
          600 * C -
          330 * eccPrimeSquared) *
        A ** 6 /
        720
      )
    );

  if (lat < 0) {
    northing += 10000000.0;
  }

  return {
    easting,
    northing,
    zone,
  };
}


// ------------------------------------------------------------
// Date helper
// ------------------------------------------------------------
function daysAgoIso(days) {
  const d =
    new Date(
      Date.now() -
      days * 86400000
    );

  return d
    .toISOString()
    .slice(0, 10);
}


// ------------------------------------------------------------
// Sentinel-2 search
// ------------------------------------------------------------
async function searchSentinelItem({
  latitude,
  longitude,
  lookbackDays = 180,
  maxCloud = 20,
}) {
  assertCoordinates(
    latitude,
    longitude
  );

  // Approximate search area
  const delta = 0.02;

  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ];

  console.log(
    "STAC URL:",
    STAC_URL
  );

  console.log(
    "Sending STAC request..."
  );

  const response =
    await fetch(
      STAC_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          collections: [
            COLLECTION,
          ],

          bbox,

          datetime:
            `${daysAgoIso(
              lookbackDays
            )}/${new Date().toISOString()}`,

          limit: 20,

          query: {
            "eo:cloud_cover": {
              lt: maxCloud,
            },
          },

          sortby: [
            {
              field: "datetime",
              direction: "desc",
            },
          ],
        }),
      }
    );

  if (!response.ok) {
    throw new Error(
      `Planetary Computer STAC search failed (${response.status})`
    );
  }

  const data =
    await response.json();

  if (
    !data.features ||
    !data.features.length
  ) {
    throw new Error(
      "No suitable Sentinel-2 image found for this location/date/cloud threshold"
    );
  }

  return data.features[0];
}


// ------------------------------------------------------------
// Sign Planetary Computer asset
// ------------------------------------------------------------
async function signAssetHref(href) {
  const response =
    await fetch(
      `${SIGN_URL}?href=${encodeURIComponent(
        href
      )}`
    );

  if (!response.ok) {
    throw new Error(
      `Could not sign satellite asset (${response.status})`
    );
  }

  const data =
    await response.json();

  if (!data.href) {
    throw new Error(
      "Planetary Computer signing response did not contain href"
    );
  }

  return data.href;
}


// ------------------------------------------------------------
// Read Sentinel raster
// ------------------------------------------------------------
async function readBand(
  href,
  bboxUtm,
  width = 64,
  height = 64
) {
  const tiff =
    await fromUrl(href);

  const image =
    await tiff.getImage();

  const imageBox =
    image.getBoundingBox();

  const [
    minX,
    minY,
    maxX,
    maxY,
  ] = bboxUtm;

  const clipped = [
    Math.max(
      minX,
      imageBox[0]
    ),

    Math.max(
      minY,
      imageBox[1]
    ),

    Math.min(
      maxX,
      imageBox[2]
    ),

    Math.min(
      maxY,
      imageBox[3]
    ),
  ];

  if (
    clipped[0] >= clipped[2] ||
    clipped[1] >= clipped[3]
  ) {
    throw new Error(
      "Project coordinates are outside the selected Sentinel-2 scene"
    );
  }

  const raster =
    await image.readRasters({
      bbox: clipped,
      width,
      height,
      samples: [0],
      interleave: true,
    });

  return {
    data: raster,
    width,
    height,
    bbox: clipped,
    imageBox,
  };
}


// ============================================================
// MAIN SATELLITE MRV FUNCTION
// ============================================================
async function computeSatelliteMrv({
  latitude,
  longitude,
  areaHa,
  maxCloud = 20,
}) {
  assertCoordinates(
    latitude,
    longitude
  );

  if (
    !Number.isFinite(areaHa) ||
    areaHa <= 0
  ) {
    throw new Error(
      "areaHa must be positive"
    );
  }

  console.log(
    "1. Starting Sentinel search..."
  );

  // ----------------------------------------------------------
  // STEP 1: Search Sentinel-2
  // ----------------------------------------------------------
  const item =
    await searchSentinelItem({
      latitude,
      longitude,
      maxCloud,
    });

  console.log(
    "2. Sentinel search completed:",
    item.id
  );


  // ----------------------------------------------------------
  // STEP 2: Check B04 and B08
  // ----------------------------------------------------------
  if (
    !item.assets?.B04?.href ||
    !item.assets?.B08?.href
  ) {
    throw new Error(
      "Selected Sentinel-2 scene does not expose B04/B08 assets"
    );
  }

  console.log(
    "3. B04 and B08 assets found"
  );

  console.log(
    "4. Starting asset signing..."
  );


  // ----------------------------------------------------------
  // STEP 3: Create approximate AOI
  // ----------------------------------------------------------
  const center =
    wgs84ToUtm(
      latitude,
      longitude
    );

  /*
   * Convert hectares to square metres.
   *
   * 1 hectare = 10,000 m²
   */
  const areaM2 =
    areaHa * 10000;

  /*
   * Approximate circular radius.
   */
  const radiusM =
    Math.sqrt(
      areaM2 / Math.PI
    );

  const bboxUtm = [
    center.easting - radiusM,
    center.northing - radiusM,
    center.easting + radiusM,
    center.northing + radiusM,
  ];


  // ----------------------------------------------------------
  // STEP 4: Sign B04 and B08
  // ----------------------------------------------------------
  const [
    redHref,
    nirHref,
  ] =
    await Promise.all([
      signAssetHref(
        item.assets.B04.href
      ),

      signAssetHref(
        item.assets.B08.href
      ),
    ]);

  console.log(
    "5. B04 and B08 assets signed successfully"
  );


  // ----------------------------------------------------------
  // STEP 5: Download raster
  // ----------------------------------------------------------
  console.log(
    "6. Starting B04/B08 raster download..."
  );

  const downloadStart = Date.now();

  const [
    red,
    nir,
  ] =
    await Promise.all([
      readBand(
        redHref,
        bboxUtm,
        64,
        64
      ),

      readBand(
        nirHref,
        bboxUtm,
        64,
        64
      ),
    ]);

  console.log(
    `7. B04/B08 raster download completed in ${(
      (Date.now() - downloadStart) /
      1000
    ).toFixed(2)} seconds`
  );




  // ----------------------------------------------------------
  // STEP 6: Calculate NDVI
  // ----------------------------------------------------------
  const count =
    Math.min(
      red.data.length,
      nir.data.length
    );

  let valid = 0;

  let vegetationPixels = 0;

  let ndviSum = 0;


  for (
    let i = 0;
    i < count;
    i += 1
  ) {
    const r =
      Number(
        red.data[i]
      );

    const n =
      Number(
        nir.data[i]
      );


    // Ignore invalid pixels
    if (
      !Number.isFinite(r) ||
      !Number.isFinite(n) ||
      r <= 0 ||
      n <= 0
    ) {
      continue;
    }


    // --------------------------------------------------------
    // NDVI = (NIR - RED) / (NIR + RED)
    // Sentinel-2:
    // B04 = Red
    // B08 = Near Infrared
    // --------------------------------------------------------
    const ndvi =
      (n - r) /
      (n + r);


    if (
      !Number.isFinite(ndvi)
    ) {
      continue;
    }


    valid += 1;

    ndviSum += ndvi;


    // Vegetation threshold
    if (
      ndvi >= 0.40
    ) {
      vegetationPixels += 1;
    }
  }


  // ----------------------------------------------------------
  // STEP 7: Validate raster
  // ----------------------------------------------------------
  if (
    valid < 100
  ) {
    throw new Error(
      "Satellite raster returned too few valid pixels for reliable MRV"
    );
  }


  // ----------------------------------------------------------
  // STEP 8: Calculate MRV values
  // ----------------------------------------------------------

  const meanNdvi =
    ndviSum / valid;


  /*
   * Percentage of valid pixels
   * classified as vegetation.
   */
  const vegetationCoveragePct =
    (
      vegetationPixels /
      valid
    ) * 100;


  /*
   * IMPORTANT:
   *
   * Do NOT use vegetationCoveragePct
   * to calculate sensed project area.
   *
   * They are different measurements.
   */


  /*
   * Calculate how much of the requested
   * raster/AOI returned valid pixels.
   *
   * Example:
   *
   * 65536 total pixels
   * 65536 valid pixels
   *
   * = 100% sensed area
   */
  const rasterCoveragePct =
    (
      valid /
      count
    ) * 100;


  /*
   * Estimate sensed project area from
   * valid raster coverage.
   */
  const sensedAreaHa =
    areaHa *
    (
      rasterCoveragePct /
      100
    );


  /*
   * Declared vs sensed area consistency.
   *
   * If all requested pixels are valid:
   *
   * sensedAreaHa = declared area
   *
   * therefore:
   *
   * areaConsistencyPct = 100%
   */
  const areaConsistencyPct =
    (
      sensedAreaHa /
      areaHa
    ) * 100;


  console.log(
    "Satellite MRV calculation completed:"
  );

  console.log({
    meanNdvi,
    vegetationCoveragePct,
    rasterCoveragePct,
    sensedAreaHa,
    areaConsistencyPct,
    pixelCount: valid,
    totalPixels: count,
  });


  // ----------------------------------------------------------
  // STEP 9: Return MRV result
  // ----------------------------------------------------------
  return {
    source:
      "Microsoft Planetary Computer / Sentinel-2 L2A",

    collection:
      COLLECTION,

    itemId:
      item.id,

    acquisitionDate:
      item.properties?.datetime ||
      item.properties?.date ||
      null,

    cloudCoverPct:
      Number(
        item.properties?.[
        "eo:cloud_cover"
        ] ??
        item.properties?.[
        "s2:cloud_cover"
        ] ??
        0
      ),

    latitude,

    longitude,

    // --------------------------------------------------------
    // Project information
    // --------------------------------------------------------
    declaredAreaHa:
      areaHa,


    // --------------------------------------------------------
    // NDVI
    // --------------------------------------------------------
    meanNdvi:
      meanNdvi,


    ndviThreshold:
      0.40,


    // --------------------------------------------------------
    // Vegetation measurement
    // --------------------------------------------------------
    vegetationCoveragePct:
      vegetationCoveragePct,


    vegetationPixels:
      vegetationPixels,


    // --------------------------------------------------------
    // Satellite sensed area
    // --------------------------------------------------------
    sensedAreaHa:
      sensedAreaHa,


    rasterCoveragePct:
      rasterCoveragePct,


    // --------------------------------------------------------
    // Area consistency
    // --------------------------------------------------------
    areaConsistencyPct:
      areaConsistencyPct,


    // --------------------------------------------------------
    // Raster information
    // --------------------------------------------------------
    pixelCount:
      valid,

    totalPixelCount:
      count,


    // --------------------------------------------------------
    // Bands
    // --------------------------------------------------------
    bands: {
      red: "B04",
      nir: "B08",
    },
  };
}


// ------------------------------------------------------------
// Export
// ------------------------------------------------------------
module.exports = {
  computeSatelliteMrv,
};