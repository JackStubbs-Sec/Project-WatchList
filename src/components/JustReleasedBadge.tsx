import type { CSSProperties } from "react";

export function JustReleasedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span style={{ ...badgeStyle, fontSize: compact ? "0.6rem" : "0.68rem", padding: compact ? "2px 7px" : "3px 8px" }}>
      🆕 Just Released
    </span>
  );
}

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  fontWeight: 700,
  color: "#221a04",
  background: "var(--accent-secondary)",
  whiteSpace: "nowrap"
};
