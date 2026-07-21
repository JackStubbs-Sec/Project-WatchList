import type { WatchType } from "../types/watch";

type Tone = "red" | "green" | "blue" | "purple";

type LogoSize = "compact" | "small" | "medium" | "large";

export function MediaLogo({ type, size, tone }: { type: WatchType; size: LogoSize; tone: Tone }) {
  const box =
    size === "compact"
      ? { width: 40, height: 40, radius: 11, icon: 16, stroke: 1.6 }
      : size === "small"
      ? { width: 66, height: 66, radius: 14, icon: 26, stroke: 1.8 }
      : size === "medium"
        ? { width: 52, height: 52, radius: 12, icon: 20, stroke: 1.8 }
        : { width: 84, height: 84, radius: 16, icon: 30, stroke: 2.2 };

  const toneMap = {
    red: "linear-gradient(140deg,#b9333f,#602237)",
    green: "linear-gradient(140deg,#4f8b35,#244f2d)",
    blue: "linear-gradient(140deg,#2f5db3,#1f3568)",
    purple: "linear-gradient(140deg,#6f4acb,#40246b)"
  };

  return (
    <span
      style={{
        width: `${box.width}px`,
        height: `${box.height}px`,
        borderRadius: `${box.radius}px`,
        background: toneMap[tone],
        display: "grid",
        placeItems: "center",
        border: "1px solid var(--chip-border)",
        boxShadow: "0 8px 18px rgba(0,0,0,0.3)"
      }}
    >
      {type === "tv" ? <TvGlyph size={box.icon} stroke={box.stroke} /> : <FilmGlyph size={box.icon} stroke={box.stroke} />}
    </span>
  );
}

export function ShuffleLogo() {
  return (
    <span
      style={{
        width: "70px",
        height: "70px",
        borderRadius: "14px",
        background: "linear-gradient(150deg,#7c5d04,#3c3107)",
        display: "grid",
        placeItems: "center",
        border: "1px solid var(--chip-border)"
      }}
    >
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 7h4.5l9 9" stroke="#f7c942" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 17h4.5l9-9" stroke="#f7c942" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 6h5v5" stroke="#f7c942" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 6l-3.9 3.9" stroke="#f7c942" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 18h5v-5" stroke="#f7c942" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 18l-3.9-3.9" stroke="#f7c942" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function TvGlyph({ size, stroke }: { size: number; stroke: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="rgba(245,248,255,0.95)" strokeWidth={stroke} />
      <path d="M9.5 21h5" stroke="rgba(245,248,255,0.95)" strokeWidth={stroke} strokeLinecap="round" />
      <path d="M8.5 3.5l3 2" stroke="rgba(245,248,255,0.95)" strokeWidth={stroke} strokeLinecap="round" />
      <path d="M15.5 3.5l-3 2" stroke="rgba(245,248,255,0.95)" strokeWidth={stroke} strokeLinecap="round" />
    </svg>
  );
}

function FilmGlyph({ size, stroke }: { size: number; stroke: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="rgba(245,248,255,0.95)" strokeWidth={stroke} />
      <path d="M3 11h18" stroke="rgba(245,248,255,0.95)" strokeWidth={stroke} />
      <path d="M7 7l2.5 4" stroke="rgba(245,248,255,0.95)" strokeWidth={stroke} />
      <path d="M13 7l2.5 4" stroke="rgba(245,248,255,0.95)" strokeWidth={stroke} />
      <path d="M7.5 16.5h5" stroke="rgba(245,248,255,0.95)" strokeWidth={stroke} strokeLinecap="round" />
    </svg>
  );
}
