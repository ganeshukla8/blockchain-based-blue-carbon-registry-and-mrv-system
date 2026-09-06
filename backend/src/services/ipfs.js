const crypto = require("crypto");

/**
 * Real IPFS upload service.
 *
 * Supported backends:
 * 1) PINATA_JWT -> uploads to Pinata/IPFS.
 * 2) IPFS_API_URL -> uploads to a local Kubo IPFS node (/api/v0/add).
 *
 * There is intentionally NO mock-CID fallback. If IPFS is not configured,
 * the request fails so the final demo cannot accidentally claim that a file
 * was stored on IPFS when it was only hashed.
 */
async function storeDocument(fileBuffer, fileName, contentType = "application/octet-stream") {
  if (!fileBuffer?.length) throw new Error("Cannot store an empty document");

  if (process.env.PINATA_JWT) {
    const form = new FormData();
    const blob = new Blob([fileBuffer], { type: contentType });
    form.append("network", "public");
    form.append("file", blob, fileName);

    const response = await fetch("https://uploads.pinata.cloud/v3/files", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Pinata upload failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    const cid = data?.data?.cid;
    if (!cid) throw new Error("Pinata response did not contain a CID");

    return {
      cid,
      gatewayUrl: `${process.env.IPFS_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs"}/${cid}`,
      real: true,
      provider: "pinata",
    };
  }

  if (process.env.IPFS_API_URL) {
    const form = new FormData();
    form.append("file", new Blob([fileBuffer], { type: contentType }), fileName);

    const base = process.env.IPFS_API_URL.replace(/\/$/, "");
    const response = await fetch(`${base}/api/v0/add?pin=true`, {
      method: "POST",
      body: form,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`IPFS node upload failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    if (!data?.Hash) throw new Error("IPFS node response did not contain a CID");

    const gatewayBase = (process.env.IPFS_GATEWAY_URL || "http://127.0.0.1:8080/ipfs").replace(/\/$/, "");
    return {
      cid: data.Hash,
      gatewayUrl: `${gatewayBase}/${data.Hash}`,
      real: true,
      provider: "kubo",
    };
  }

  throw new Error("Real IPFS is not configured. Set PINATA_JWT or IPFS_API_URL.");
}

async function storeJson(obj, fileName = "mrv-report.json") {
  const json = JSON.stringify(obj, null, 2);
  return storeDocument(Buffer.from(json, "utf8"), fileName, "application/json");
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

module.exports = { storeDocument, storeJson, sha256 };
