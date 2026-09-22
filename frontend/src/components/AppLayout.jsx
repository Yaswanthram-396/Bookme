import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { getme } from "../api/auth";

const navItems = [
  { label: "Dashboard", to: "/" },
  { label: "Profile", to: "/profile" },
  { label: "Services", to: "/services" },
  { label: "Bookings", to: "/bookings" },
  { label: "Availability", to: "/availability" },
  { label: "Payments", to: "/payments" },
];

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7ff 0%, #eef4ff 100%)",
    color: "#14213d",
    fontFamily: "Inter, Arial, sans-serif",
  },
  sidebar: {
    width: "260px",
    background: "rgba(14, 30, 75, 0.95)",
    color: "#f8fbff",
    padding: "28px 18px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "12px 0 30px rgba(15, 23, 42, 0.12)",
    zIndex: 10,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 10px 22px",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    marginBottom: "18px",
  },
  logo: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    objectFit: "cover",
    background: "#ffffff",
    padding: "4px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 14px",
    borderRadius: "12px",
    color: "rgba(255,255,255,0.8)",
    textDecoration: "none",
    fontWeight: 600,
    transition: "all 0.2s ease",
  },
  navLinkActive: {
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#ffffff",
    boxShadow: "0 10px 24px rgba(99, 102, 241, 0.35)",
  },
  logoutButton: {
    border: "none",
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "12px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "22px 28px 18px",
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(148, 163, 184, 0.22)",
    position: "sticky",
    top: 0,
    zIndex: 9,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  mobileToggle: {
    display: "none",
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background: "#ffffff",
    color: "#1f2937",
    fontSize: "24px",
    cursor: "pointer",
  },
  headerTitle: {
    fontSize: "24px",
    fontWeight: 800,
    margin: 0,
  },
  userMenu: {
    position: "relative",
  },
  avatarButton: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#ffffff",
    border: "1px solid rgba(148, 163, 184, 0.28)",
    borderRadius: "14px",
    padding: "8px 12px",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
    cursor: "pointer",
  },
  avatar: {
    width: "38px",
    height: "38px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
  },
  userMeta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    lineHeight: 1.2,
  },
  userName: {
    fontWeight: 700,
    color: "#0f172a",
  },
  userRole: {
    fontSize: "12px",
    color: "#64748b",
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "calc(100% + 10px)",
    width: "220px",
    background: "#ffffff",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    borderRadius: "14px",
    boxShadow: "0 24px 45px rgba(15, 23, 42, 0.12)",
    padding: "10px",
  },
  dropdownItem: {
    display: "block",
    width: "100%",
    border: "none",
    background: "transparent",
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: "10px",
    color: "#0f172a",
    fontWeight: 600,
    cursor: "pointer",
  },
  content: {
    flex: 1,
    padding: "28px",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.35)",
    display: "none",
    zIndex: 8,
  },
};

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const hasToken = Boolean(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (hasToken) {
      getme()
        .then((res) => {
          setUser(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [hasToken]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const displayName = user?.bussinessName || user?.name || "My Business";
  const avatarInitial = displayName.slice(0, 1).toUpperCase();

  return (
    <div style={styles.page}>
      <div
        style={{
          ...styles.overlay,
          display: mobileMenuOpen ? "block" : "none",
        }}
        onClick={() => setMobileMenuOpen(false)}
      />

      <aside
        style={{
          ...styles.sidebar,
          position: mobileMenuOpen ? "fixed" : "relative",
          left: mobileMenuOpen ? 0 : "auto",
          top: 0,
          bottom: 0,
          width: mobileMenuOpen ? "260px" : "260px",
          transform: mobileMenuOpen ? "translateX(0)" : "translateX(0)",
        }}
      >
        <div>
          <div style={styles.brand}>
            <img src={logo} alt="BookMe logo" style={styles.logo} />
            <div>
              <div style={{ fontSize: "18px", fontWeight: 800 }}>BookMe</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                Business Suite
              </div>
            </div>
          </div>

          <nav style={styles.nav}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                end={item.to === "/"}
                style={({ isActive }) => ({
                  ...styles.navLink,
                  ...(isActive ? styles.navLinkActive : {}),
                })}
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={styles.logoutButton}
        >
          Logout
        </button>
      </aside>

      <div style={styles.main}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button
              type="button"
              style={styles.mobileToggle}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              ☰
            </button>
            <h1 style={styles.headerTitle}>Overview</h1>
          </div>

          <div ref={dropdownRef} style={styles.userMenu}>
            <button
              type="button"
              style={styles.avatarButton}
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              <div style={styles.avatar}>{avatarInitial}</div>
              <div style={styles.userMeta}>
                <span style={styles.userName}>{displayName}</span>
                <span style={styles.userRole}>Business owner</span>
              </div>
              <span style={{ fontSize: "18px", color: "#64748b" }}>▾</span>
            </button>

            {dropdownOpen && (
              <div style={styles.dropdown}>
                <button
                  type="button"
                  style={styles.dropdownItem}
                  onClick={() => navigate("/profile")}
                >
                  Edit profile
                </button>
                <button
                  type="button"
                  style={styles.dropdownItem}
                  onClick={() => navigate("/settings")}
                >
                  Account settings
                </button>
                <button
                  type="button"
                  style={{ ...styles.dropdownItem, color: "#dc2626" }}
                  onClick={handleLogout}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main style={styles.content}>{children}</main>
      </div>
    </div>
  );
}
