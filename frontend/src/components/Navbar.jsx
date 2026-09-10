import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Leaf,
  ShieldCheck,
  Coins,
  Wallet,
  LogOut,
  Menu,
  X,
  Waves,
  ArrowUpRight,
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import { useWeb3 } from "../context/Web3Context.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { address, connect, connecting } = useWeb3();

  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  /*
   * Authentication pages use their own full-screen design.
   */
  if (
    location.pathname === "/login" ||
    location.pathname === "/register"
  ) {
    return null;
  }

  /*
   * PUBLIC NAVBAR
   */
  if (!user) {
    return (
      <header className="public-navbar">
        <Link to="/" className="public-brand">
          <span className="public-brand-icon">
            <Waves size={18} />
          </span>

          <span>Blue Carbon Registry</span>
        </Link>

        <nav className="public-nav-links">
          <a href="/#about">About</a>
          <a href="/#how-it-works">How it works</a>
          <a href="/#impact">Impact</a>
        </nav>

        <div className="public-nav-actions">
          <Link to="/login" className="nav-login">
            Log in
          </Link>

          <Link to="/register" className="nav-get-started">
            Get Started
            <ArrowUpRight size={15} />
          </Link>
        </div>

        <button
          className="mobile-menu-button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </button>

        {mobileOpen && (
          <div className="mobile-public-menu">
            <a href="/#about">About</a>
            <a href="/#how-it-works">
              How it works
            </a>
            <a href="/#impact">Impact</a>

            <Link to="/login">Log in</Link>

            <Link
              to="/register"
              className="mobile-menu-cta"
            >
              Get Started
            </Link>
          </div>
        )}
      </header>
    );
  }

  /*
   * ROLE-BASED WORKSPACE
   */

  const role = user.role;

  const navigation = [
    {
      label: "Workspace",
      items: [
        {
          name: "Dashboard",
          path: "/",
          icon: LayoutDashboard,
          roles: ["owner", "verifier", "regulator"],
        },
      ],
    },

    {
      label: "Registry",
      items: [
        {
          name: "Register Project",
          path: "/register-project",
          icon: Leaf,
          roles: ["owner"],
        },
      ],
    },

    {
      label: "Verification",
      items: [
        {
          name: "MRV Data",
          path: "/mrv",
          icon: ShieldCheck,
          roles: ["verifier"],
        },
      ],
    },

    {
      label: "Carbon Market",
      items: [
        {
          name: "Carbon Credits",
          path: "/credits",
          icon: Coins,
          roles: ["regulator"],
        },
      ],
    },
  ];

  const visibleGroups = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.roles.includes(role)
      ),
    }))
    .filter((group) => group.items.length > 0);

  const roleLabel = {
    owner: "Project Owner",
    verifier: "Verifier",
    regulator: "Regulator",
  };

  return (
    <>
      {/* DESKTOP SIDEBAR */}

      <aside className="workspace-sidebar">
        <Link
          to="/"
          className="workspace-brand"
        >
          <span className="workspace-brand-icon">
            <Waves size={18} />
          </span>

          <div>
            <strong>Blue Carbon</strong>
            <span>Registry</span>
          </div>
        </Link>

        <div className="workspace-role">
          <span className="workspace-role-dot" />

          <div>
            <small>ACCOUNT</small>
            <strong>
              {roleLabel[role] || role}
            </strong>
          </div>
        </div>

        <nav className="workspace-navigation">
          {visibleGroups.map((group) => (
            <div
              className="workspace-nav-group"
              key={group.label}
            >
              <span className="workspace-nav-label">
                {group.label}
              </span>

              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      isActive
                        ? "workspace-nav-item active"
                        : "workspace-nav-item"
                    }
                  >
                    <Icon size={17} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="workspace-sidebar-bottom">
          <div className="sidebar-wallet">
            <div className="sidebar-wallet-icon">
              <Wallet size={15} />
            </div>

            <div>
              <small>WALLET</small>

              <strong>
                {address
                  ? `${address.slice(
                      0,
                      6
                    )}...${address.slice(-4)}`
                  : "Not connected"}
              </strong>
            </div>
          </div>

          <button
            className="sidebar-logout"
            onClick={logout}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}

      <header className="workspace-mobile-header">
        <Link
          to="/"
          className="workspace-brand"
        >
          <span className="workspace-brand-icon">
            <Waves size={17} />
          </span>

          <div>
            <strong>Blue Carbon</strong>
            <span>Registry</span>
          </div>
        </Link>

        <button
          className="workspace-mobile-toggle"
          onClick={() =>
            setMobileOpen(!mobileOpen)
          }
        >
          {mobileOpen ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </button>
      </header>

      {/* MOBILE MENU */}

      {mobileOpen && (
        <div className="workspace-mobile-menu">
          <div className="workspace-mobile-role">
            <span>{roleLabel[role]}</span>
          </div>

          {visibleGroups.flatMap(
            (group) => group.items
          ).map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={() =>
                  setMobileOpen(false)
                }
                className={({ isActive }) =>
                  isActive
                    ? "workspace-nav-item active"
                    : "workspace-nav-item"
                }
              >
                <Icon size={17} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          <button
            className="sidebar-logout"
            onClick={logout}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      )}
    </>
  );
}