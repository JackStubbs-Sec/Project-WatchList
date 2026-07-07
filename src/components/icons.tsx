import type { StreamingPlatform, WatchType } from "../types/watch";

type Tone = "red" | "green" | "blue" | "purple";

type LogoSize = "small" | "medium" | "large";

export function MediaLogo({ type, size, tone }: { type: WatchType; size: LogoSize; tone: Tone }) {
  const box =
    size === "small"
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
      {type === "series" ? <TvGlyph size={box.icon} stroke={box.stroke} /> : <FilmGlyph size={box.icon} stroke={box.stroke} />}
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

const platformMeta: Record<StreamingPlatform, { label: string; background: string; mark: string; color?: string; letterSpacing?: string }> = {
  netflix: { label: "Netflix", background: "linear-gradient(140deg,#161616,#000000)", mark: "N", color: "#e50914" },
  prime: { label: "Amazon Prime", background: "linear-gradient(140deg,#11375d,#0b2037)", mark: "prime", color: "#7fd6ff", letterSpacing: "0.02em" },
  nowtv: { label: "NowTV", background: "linear-gradient(140deg,#7b1cff,#35008f)", mark: "NOW", color: "#ffffff" },
  appletv: { label: "AppleTV", background: "linear-gradient(140deg,#2a2a2a,#090909)", mark: "tv+", color: "#ffffff" },
  paramount: { label: "Paramount Plus", background: "linear-gradient(140deg,#1f63ff,#0e2c8b)", mark: "P+", color: "#ffffff" },
  itvx: { label: "ITVX", background: "linear-gradient(140deg,#ff5f8a,#8d2eff)", mark: "ITVX", color: "#ffffff", letterSpacing: "0.04em" },
  channel4: { label: "Channel 4", background: "linear-gradient(140deg,#1f7f47,#0b4d27)", mark: "4", color: "#ffffff" },
  disney: { label: "Disney+", background: "linear-gradient(140deg,#13265f,#06132f)", mark: "Disney+", color: "#ffffff" }
};

export function platformLabel(platform: StreamingPlatform) {
  return platformMeta[platform].label;
}

export function PlatformLogo({ platform, compact = false }: { platform: StreamingPlatform; compact?: boolean }) {
  const meta = platformMeta[platform];
  const size = compact ? 34 : 44;

  return (
    <span
      aria-hidden="true"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: compact ? "10px" : "12px",
        background: meta.background,
        border: "1px solid var(--chip-border)",
        display: "grid",
        placeItems: "center",
        boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
        color: meta.color ?? "#fff",
        fontWeight: 800,
        fontSize: compact ? "0.72rem" : "0.82rem",
        lineHeight: 1,
        letterSpacing: meta.letterSpacing ?? "0"
      }}
    >
      {meta.mark}
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
