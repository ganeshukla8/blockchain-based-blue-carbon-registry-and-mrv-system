import React from "react";
import { ArrowRight, Leaf, ShieldCheck, Database } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="landing-page">

      <nav className="landing-nav">
        <Link to="/" className="landing-brand">
          <div className="landing-brand-mark">
            <Leaf size={17} />
          </div>

          <div>
            <strong>BLUE CARBON</strong>
            <span>REGISTRY</span>
          </div>
        </Link>

        <div className="landing-nav-links">
          <a href="#about">About</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#impact">Impact</a>

          <Link
            to="/login"
            className="landing-login"
          >
            Log In
          </Link>

          <Link
            to="/register"
            className="landing-signup"
          >
            Get Started
          </Link>
        </div>
      </nav>


      <section className="landing-hero">

        <div className="landing-overlay" />

        <div className="landing-hero-content">

          <div className="landing-pill">
            <span />
            BLOCKCHAIN-VERIFIED BLUE CARBON
          </div>

          <h1>
            Protecting our
            <br />
            <em>coastal future.</em>
          </h1>

          <p>
            A transparent blockchain registry for
            measuring, verifying and tracking blue
            carbon projects — from ecosystem to
            carbon credit.
          </p>

          <div className="landing-buttons">

            <Link
              to="/register"
              className="landing-primary-btn"
            >
              Get Started
              <ArrowRight size={14} />
            </Link>

            <a
              href="#how-it-works"
              className="landing-secondary-btn"
            >
              Explore the Registry
            </a>

          </div>

        </div>


        <div className="landing-stats">

          <div>
            <strong>01</strong>
            <span>
              Register
              <br />
              Projects
            </span>
          </div>

          <div>
            <strong>02</strong>
            <span>
              Automated
              <br />
              MRV
            </span>
          </div>

          <div>
            <strong>03</strong>
            <span>
              Verified
              <br />
              Credits
            </span>
          </div>

        </div>

      </section>


      <section
        id="about"
        className="landing-about"
      >

        <div className="landing-section-label">
          THE REGISTRY
        </div>

        <h2>
          From coastal ecosystems
          <br />
          to trusted carbon credits.
        </h2>

        <p>
          Blue Carbon Registry brings project
          registration, satellite-based MRV,
          verification and carbon credits into
          one transparent platform.
        </p>

      </section>


      <section
        id="how-it-works"
        className="landing-process"
      >

        <div className="landing-process-card">

          <div className="process-icon">
            <Database size={18} />
          </div>

          <span>01</span>

          <h3>
            Register
          </h3>

          <p>
            Submit your blue carbon project,
            ecosystem data and project evidence.
          </p>

        </div>


        <div className="landing-process-card">

          <div className="process-icon">
            <ShieldCheck size={18} />
          </div>

          <span>02</span>

          <h3>
            Verify
          </h3>

          <p>
            Automated MRV validates project
            evidence using predefined rules.
          </p>

        </div>


        <div className="landing-process-card">

          <div className="process-icon">
            <Leaf size={18} />
          </div>

          <span>03</span>

          <h3>
            Credit
          </h3>

          <p>
            Approved projects can issue and
            manage traceable carbon credits.
          </p>

        </div>

      </section>


      <section
        id="impact"
        className="landing-impact"
      >

        <div>
          <span>BLUE CARBON IMPACT</span>

          <h2>
            Every verified hectare
            <br />
            tells a story.
          </h2>
        </div>

        <Link
          to="/registry"
          className="landing-impact-btn"
        >
          View Registry
          <ArrowRight size={13} />
        </Link>

      </section>


      <footer className="landing-footer">

        <div className="landing-brand">
          <div className="landing-brand-mark">
            <Leaf size={14} />
          </div>

          <div>
            <strong>BLUE CARBON</strong>
            <span>REGISTRY</span>
          </div>
        </div>

        <span>
          Transparent · Verifiable · Sustainable
        </span>

      </footer>

    </main>
  );
}