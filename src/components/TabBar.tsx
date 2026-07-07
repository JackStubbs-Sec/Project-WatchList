import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/library", label: "Library", icon: "library" },
  { to: "/add", label: "", icon: "plus", isPrimary: true },
  { to: "/search", label: "Search", icon: "search" },
  { to: "/settings", label: "More", icon: "more" }
];

export function TabBar() {
  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: "var(--tab-height)",
        background: "var(--nav-bg)",
        borderTop: "1px solid var(--nav-border)",
        backdropFilter: "blur(14px)",
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
        zIndex: 20
      }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          style={({ isActive }) => ({
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: tab.isPrimary ? "0" : "4px",
            color: isActive ? "var(--accent)" : "var(--muted)",
            fontWeight: isActive ? 700 : 550,
            fontSize: "0.7rem"
          })}
        >
          <span
            style={
              tab.isPrimary
                ? {
                    width: "42px",
                    height: "42px",
                    borderRadius: "999px",
                    display: "grid",
                    placeItems: "center",
                    background: "var(--accent)",
                    color: "#ffffff",
                    fontSize: "1.6rem",
                    fontWeight: 700,
                    marginTop: "-14px",
                    boxShadow: "0 10px 24px rgba(10, 132, 255, 0.34)"
                  }
                : { fontSize: "1.1rem", lineHeight: 1, width: "20px", height: "20px", display: "grid", placeItems: "center" }
            }
          >
            <TabIcon kind={tab.icon} active={!tab.isPrimary} />
          </span>
          {tab.label ? <span>{tab.label}</span> : <span style={{ height: "0.75rem" }} />}
        </NavLink>
      ))}
    </nav>
  );
}

function TabIcon({ kind, active }: { kind: string; active: boolean }) {
  if (kind === "plus") {
    return <span style={{ lineHeight: 1 }}>+</span>;
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {kind === "home" ? (
        <>
          <path d="M3.5 10.5L12 4l8.5 6.5" stroke={active ? "currentColor" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 9.5v10h12v-10" stroke={active ? "currentColor" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
      {kind === "library" ? (
        <>
          <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 5v14" stroke="currentColor" strokeWidth="1.8" />
          <path d="M13 9h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : null}
      {kind === "search" ? (
        <>
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : null}
      {kind === "more" ? (
        <>
          <circle cx="6" cy="12" r="1.4" fill="currentColor" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" />
          <circle cx="18" cy="12" r="1.4" fill="currentColor" />
        </>
      ) : null}
    </svg>
  );
}
