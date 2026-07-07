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

const platformMeta: Record<StreamingPlatform, { label: string; background: string }> = {
  netflix: { label: "Netflix", background: "linear-gradient(145deg,#141414,#020202)" },
  prime: { label: "Amazon Prime", background: "linear-gradient(145deg,#163b63,#0a1e33)" },
  nowtv: { label: "NowTV", background: "linear-gradient(145deg,#8b2cff,#4a08a7)" },
  appletv: { label: "AppleTV", background: "linear-gradient(145deg,#2b2b2b,#070707)" },
  paramount: { label: "Paramount Plus", background: "linear-gradient(145deg,#2970ff,#0d3597)" },
  itvx: { label: "ITVX", background: "linear-gradient(145deg,#ff5e86,#8b2eff)" },
  channel4: { label: "Channel 4", background: "linear-gradient(145deg,#20a05d,#0c5d33)" },
  disney: { label: "Disney+", background: "linear-gradient(145deg,#18306d,#07142f)" }
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
        overflow: "hidden"
      }}
    >
      <PlatformGlyph platform={platform} compact={compact} />
    </span>
  );
}

function PlatformGlyph({ platform, compact }: { platform: StreamingPlatform; compact: boolean }) {
  const fontSize = compact ? "0.68rem" : "0.82rem";

  if (platform === "netflix") {
    return <span style={{ color: "#e50914", fontWeight: 900, fontSize: compact ? "1.05rem" : "1.35rem", lineHeight: 1 }}>N</span>;
  }

  if (platform === "prime") {
    return (
      <span style={{ display: "grid", justifyItems: "center", gap: compact ? "1px" : "2px", color: "#ffffff", lineHeight: 1 }}>
        <span style={{ fontSize, fontWeight: 800, letterSpacing: "0.01em" }}>prime</span>
        <span style={{ width: compact ? "16px" : "22px", height: compact ? "6px" : "7px" }}>
          <svg width="100%" height="100%" viewBox="0 0 24 8" fill="none" aria-hidden="true">
            <path d="M2 2.5c4 3 12 3 20 0" stroke="#46c7f4" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M18 1.6l4 .9-2.7 2.2" fill="#46c7f4" />
          </svg>
        </span>
      </span>
    );
  }

  if (platform === "nowtv") {
    return <span style={{ color: "#ffffff", fontWeight: 900, fontSize, letterSpacing: "0.06em", lineHeight: 1 }}>NOW</span>;
  }

  if (platform === "appletv") {
    return <span style={{ color: "#ffffff", fontWeight: 800, fontSize, lineHeight: 1 }}>tv+</span>;
  }

  if (platform === "paramount") {
    return (
      <span style={{ display: "grid", justifyItems: "center", color: "#ffffff", lineHeight: 1 }}>
        <span style={{ width: compact ? "15px" : "18px", height: compact ? "8px" : "10px" }}>
          <svg width="100%" height="100%" viewBox="0 0 24 12" fill="none" aria-hidden="true">
            <path d="M4 10c2.2-3.8 4.8-6.7 8-8 3.2 1.3 5.8 4.2 8 8" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span style={{ fontSize: compact ? "0.6rem" : "0.72rem", fontWeight: 800 }}>P+</span>
      </span>
    );
  }

  if (platform === "itvx") {
    return <span style={{ color: "#ffffff", fontWeight: 900, fontSize, letterSpacing: "0.04em", lineHeight: 1 }}>ITVX</span>;
  }

  if (platform === "channel4") {
    return <Channel4Glyph compact={compact} />;
  }

  return (
    <span style={{ display: "grid", justifyItems: "center", gap: compact ? "1px" : "2px", color: "#ffffff", lineHeight: 1 }}>
      <span style={{ fontSize: compact ? "0.58rem" : "0.7rem", fontStyle: "italic", fontWeight: 700 }}>Disney</span>
      <span style={{ width: compact ? "18px" : "24px", height: compact ? "6px" : "7px" }}>
        <svg width="100%" height="100%" viewBox="0 0 24 8" fill="none" aria-hidden="true">
          <path d="M1.5 6C5 2.2 10.3.8 17.5 1.8c2 .3 3.8.8 5 1.3" stroke="#68b6ff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
    </span>
  );
}

function Channel4Glyph({ compact }: { compact: boolean }) {
  const size = compact ? 16 : 20;
  return (
    <span style={{ width: `${size}px`, height: `${size}px`, display: "grid", placeItems: "center" }}>
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 5v9h4V9h4v10h4V5h-4v4H8V5H4Z" fill="#ffffff" />
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
