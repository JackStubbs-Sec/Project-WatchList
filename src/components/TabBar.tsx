import { NavLink, useNavigate } from "react-router-dom";
import { useWatchStore } from "../store/useWatchStore";

const tabs = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/discover", label: "Discover", icon: "discover" },
  { to: "/library", label: "Library", icon: "library" },
  { to: "/profile", label: "Profile", icon: "profile" }
];

export function TabBar() {
  const navigate = useNavigate();
  const rerollShuffle = useWatchStore((state) => state.rerollShuffle);

  function onShuffle() {
    rerollShuffle();
    navigate("/pick");
  }

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
      {tabs.slice(0, 2).map((tab) => (
        <TabLink key={tab.to} to={tab.to} label={tab.label} icon={tab.icon} />
      ))}

      <button
        type="button"
        onClick={onShuffle}
        aria-label="Shuffle a random watchlist pick"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0",
          border: "none",
          background: "transparent",
          color: "var(--muted)",
          fontWeight: 550,
          fontSize: "0.64rem"
        }}
      >
        <span
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "999px",
            display: "grid",
            placeItems: "center",
            background: "var(--accent)",
            color: "#ffffff",
            marginTop: "-12px",
            boxShadow: "0 8px 18px color-mix(in srgb, var(--accent) 45%, transparent)"
          }}
        >
          <ShuffleIcon />
        </span>
        <span style={{ height: "0.68rem" }} />
      </button>

      {tabs.slice(2).map((tab) => (
        <TabLink key={tab.to} to={tab.to} label={tab.label} icon={tab.icon} />
      ))}
    </nav>
  );
}

function TabLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      style={({ isActive }) => ({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "3px",
        color: isActive ? "var(--accent)" : "var(--muted)",
        fontWeight: isActive ? 700 : 550,
        fontSize: "0.64rem"
      })}
    >
      <span style={{ fontSize: "1rem", lineHeight: 1, width: "18px", height: "18px", display: "grid", placeItems: "center" }}>
        <TabIcon kind={icon} />
      </span>
      <span>{label}</span>
    </NavLink>
  );
}

function ShuffleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7h4.5l9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 17h4.5l9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 6h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 6l-3.9 3.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 18h5v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 18l-3.9-3.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TabIcon({ kind }: { kind: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {kind === "home" ? (
        <>
          <path d="M3.5 10.5L12 4l8.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 9.5v10h12v-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
      {kind === "discover" ? (
        <>
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : null}
      {kind === "library" ? (
        <>
          <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 5v14" stroke="currentColor" strokeWidth="1.8" />
          <path d="M13 9h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : null}
      {kind === "profile" ? (
        <>
          <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4.5 20c1.5-3.8 5-5.5 7.5-5.5s6 1.7 7.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : null}
    </svg>
  );
}
