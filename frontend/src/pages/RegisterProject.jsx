import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Leaf,
  Upload,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import client from "../api/client";
import { useWeb3 } from "../context/Web3Context.jsx";

export default function RegisterProject() {
  const navigate = useNavigate();
  const { address, connect } = useWeb3();

  const [form, setForm] = useState({
    name: "",
    ecosystem: "mangrove",
    location: "",
    areaHa: "",
    latitude: "",
    longitude: "",
  });

  const [document, setDocument] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    setError("");

    if (!document) {
      setError("Please upload the supporting PDF.");
      return;
    }

    if (!address) {
      setError("Please connect your blockchain wallet first.");
      return;
    }

    try {
      setBusy(true);

      const data = new FormData();

      data.append("name", form.name);
      data.append("ecosystem", form.ecosystem);
      data.append("location", form.location);
      data.append("areaHa", form.areaHa);
      data.append("latitude", form.latitude);
      data.append("longitude", form.longitude);
      data.append("wallet", address);
      data.append("document", document);

      await client.post("/projects", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not register the project."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="registry-page">
      <div className="registry-content">

        {/* HEADER */}

        <div className="registry-top">
          <div>
            <Link to="/" className="registry-back">
              <ArrowLeft size={15} />
              Back to dashboard
            </Link>

            <span className="registry-kicker">
              PROJECT REGISTRY
            </span>

            <h1>Register a new project</h1>

            <p>
              Add your coastal conservation project to the
              Blue Carbon Registry.
            </p>
          </div>

          <div className="registry-step-indicator">
            <span className="active">01</span>
            <i />
            <span>02</span>
            <i />
            <span>03</span>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="registry-error">
            <span>!</span>
            {error}
          </div>
        )}

        {/* FORM */}

        <form
          className="registry-layout"
          onSubmit={submit}
        >
          <div className="registry-form-column">

            {/* BASIC INFORMATION */}

            <section className="registry-card">
              <div className="registry-card-heading">
                <div className="registry-number">
                  01
                </div>

                <div>
                  <h2>Project information</h2>
                  <p>
                    Tell us about the project you want to
                    register.
                  </p>
                </div>
              </div>

              <div className="registry-fields">

                <label className="registry-field full">
                  <span>Project name</span>

                  <input
                    required
                    type="text"
                    placeholder="e.g. Sundarbans Mangrove Restoration"
                    value={form.name}
                    onChange={(e) =>
                      update("name", e.target.value)
                    }
                  />
                </label>

                <label className="registry-field full">
                  <span>Ecosystem type</span>

                  <select
                    value={form.ecosystem}
                    onChange={(e) =>
                      update(
                        "ecosystem",
                        e.target.value
                      )
                    }
                  >
                    <option value="mangrove">
                      Mangrove
                    </option>

                    <option value="seagrass">
                      Seagrass
                    </option>

                    <option value="saltmarsh">
                      Salt Marsh
                    </option>
                  </select>
                </label>

                <label className="registry-field full">
                  <span>Project location</span>

                  <div className="registry-input-icon">
                    <MapPin size={16} />

                    <input
                      required
                      type="text"
                      placeholder="District, State, Country"
                      value={form.location}
                      onChange={(e) =>
                        update(
                          "location",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </label>

                <label className="registry-field">
                  <span>Area</span>

                  <div className="registry-unit-input">
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.areaHa}
                      onChange={(e) =>
                        update(
                          "areaHa",
                          e.target.value
                        )
                      }
                    />

                    <span>hectares</span>
                  </div>
                </label>
              </div>
            </section>

            {/* LOCATION */}

            <section className="registry-card">
              <div className="registry-card-heading">
                <div className="registry-number">
                  02
                </div>

                <div>
                  <h2>Geographic coordinates</h2>
                  <p>
                    Provide the coordinates of your project
                    area for satellite verification.
                  </p>
                </div>
              </div>

              <div className="registry-fields">
                <label className="registry-field">
                  <span>Latitude</span>

                  <input
                    required
                    type="number"
                    step="any"
                    placeholder="e.g. 21.9497"
                    value={form.latitude}
                    onChange={(e) =>
                      update(
                        "latitude",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label className="registry-field">
                  <span>Longitude</span>

                  <input
                    required
                    type="number"
                    step="any"
                    placeholder="e.g. 89.1833"
                    value={form.longitude}
                    onChange={(e) =>
                      update(
                        "longitude",
                        e.target.value
                      )
                    }
                  />
                </label>
              </div>

              <div className="registry-map-placeholder">
                <MapPin size={22} />

                <div>
                  <strong>Project location</strong>
                  <span>
                    Satellite verification will use these
                    coordinates.
                  </span>
                </div>
              </div>
            </section>

            {/* DOCUMENT */}

            <section className="registry-card">
              <div className="registry-card-heading">
                <div className="registry-number">
                  03
                </div>

                <div>
                  <h2>Supporting evidence</h2>
                  <p>
                    Upload the documentation required for
                    project verification.
                  </p>
                </div>
              </div>

              <label className="registry-upload">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) =>
                    setDocument(
                      e.target.files?.[0] || null
                    )
                  }
                />

                <div className="upload-icon">
                  <Upload size={21} />
                </div>

                {document ? (
                  <>
                    <strong>{document.name}</strong>
                    <span>
                      {(document.size / 1024 / 1024).toFixed(
                        2
                      )}{" "}
                      MB
                    </span>
                  </>
                ) : (
                  <>
                    <strong>
                      Upload project documentation
                    </strong>

                    <span>
                      PDF format · Click to browse
                    </span>
                  </>
                )}
              </label>
            </section>

            {/* WALLET */}

            <section className="registry-card">
              <div className="registry-card-heading">
                <div className="registry-number">
                  04
                </div>

                <div>
                  <h2>Blockchain wallet</h2>
                  <p>
                    Connect the wallet that will be associated
                    with this project.
                  </p>
                </div>
              </div>

              {address ? (
                <div className="wallet-connected">
                  <div className="wallet-success-icon">
                    <CheckCircle2 size={19} />
                  </div>

                  <div>
                    <strong>Wallet connected</strong>
                    <span>{address}</span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="connect-wallet-btn"
                  onClick={connect}
                >
                  <Wallet size={17} />
                  Connect wallet
                </button>
              )}
            </section>

            {/* SUBMIT */}

            <div className="registry-submit-area">
              <button
                disabled={busy}
                type="submit"
                className="registry-submit"
              >
                {busy
                  ? "Registering project..."
                  : "Submit project"}

                {!busy && <ArrowRight size={17} />}
              </button>

              <p>
                Your project will be reviewed through the
                registry verification workflow.
              </p>
            </div>
          </div>

          {/* SIDE PANEL */}

          <aside className="registry-side">

            <div className="registry-info-card">
              <div className="registry-info-icon">
                <Leaf size={21} />
              </div>

              <span className="registry-kicker">
                BLUE CARBON
              </span>

              <h3>
                Protecting coastal ecosystems
              </h3>

              <p>
                Blue carbon ecosystems such as mangroves,
                seagrasses and salt marshes capture and store
                carbon while protecting coastal communities.
              </p>

              <div className="registry-info-line" />

              <div className="registry-info-stat">
                <strong>01</strong>
                <span>
                  Register your conservation project
                </span>
              </div>

              <div className="registry-info-stat">
                <strong>02</strong>
                <span>
                  Submit evidence for verification
                </span>
              </div>

              <div className="registry-info-stat">
                <strong>03</strong>
                <span>
                  Receive verified carbon credits
                </span>
              </div>
            </div>

          </aside>
        </form>
      </div>
    </main>
  );
}