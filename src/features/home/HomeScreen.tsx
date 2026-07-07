import type { CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWatchStore } from "../../store/useWatchStore";
import { MediaLogo, PlatformLogo, ShuffleLogo, platformLabel } from "../../components/icons";

function greetingByHour(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Day";
  return "Good Night";
}

function recommendationMetaByHour(date: Date) {
  const hour = date.getHours();

  if (hour < 12) {
    return {
      title: "This Morning's Recommendation",
      subtitle: "Start your morning with something great.",
      actionLine1: "Pick this",
      actionLine2: "morning's watch"
    };
  }

  if (hour < 18) {
    return {
      title: "Today's Recommendation",
      subtitle: "Find something for your day.",
      actionLine1: "Pick today's",
      actionLine2: "watch"
    };
  }

  return {
    title: "Tonight's Recommendation",
    subtitle: "Settle in with a great evening pick.",
    actionLine1: "Pick tonight's",
    actionLine2: "watch"
  };
}

export function HomeScreen() {
  const navigate = useNavigate();
  const entries = useWatchStore((state) => state.entries);
  const rerollTonight = useWatchStore((state) => state.rerollTonight);
  const now = new Date();
  const greeting = greetingByHour(now);
  const recommendationMeta = recommendationMetaByHour(now);
  const recentlyAdded = entries.slice(0, 4);
  const continueWatching = entries.find((entry) => entry.status === "watching");
  const recentlyWatched = entries.filter((entry) => entry.status === "completed").slice(0, 2);

  function getSeasonProgressPercent(episode?: number) {
    if (!episode) return 0;
    return Math.min(Math.round((episode / 10) * 100), 100);
  }

  function ratingToStars(rating?: number) {
    if (!rating) return "☆☆☆☆☆";
    const rounded = Math.round(rating);
    return `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}`;
  }

  function timeAgo(isoDate?: string) {
    if (!isoDate) return "Watched recently";
    const deltaDays = Math.max(1, Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000));
    if (deltaDays < 7) return `Watched ${deltaDays} day${deltaDays > 1 ? "s" : ""} ago`;
    const weeks = Math.floor(deltaDays / 7);
    if (weeks < 5) return `Watched ${weeks} week${weeks > 1 ? "s" : ""} ago`;
    const months = Math.floor(deltaDays / 30);
    return `Watched ${months} month${months > 1 ? "s" : ""} ago`;
  }

  function handlePick() {
    rerollTonight();
    navigate("/pick");
  }

  return (
    <main>
      <section className="stack" style={{ gap: "6px" }}>
        <h1 style={{ fontSize: "2.1rem", marginBottom: 0 }}>{`${greeting}, Jack 👋`}</h1>
        <p style={{ color: "var(--muted)" }}>Here&apos;s your watch overview</p>
      </section>

      <section className="stack">
        <div className="row">
          <h2 className="section-title" style={{ marginBottom: 0 }}>Continue Watching</h2>
          <Link to="/library" className="subtle-link">See All</Link>
        </div>
        {continueWatching ? (
          <Link to={`/library/${continueWatching.id}`} className="card" style={{ display: "flex", gap: "14px", alignItems: "center", padding: "12px" }}>
            <MediaLogo type={continueWatching.type} size="large" tone="purple" />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 750, fontSize: "1.05rem", marginBottom: "2px" }}>{continueWatching.title}</p>
              {continueWatching.platform ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <PlatformLogo platform={continueWatching.platform} compact />
                  <span style={{ color: "var(--text-strong)", fontSize: "0.84rem", fontWeight: 650 }}>{platformLabel(continueWatching.platform)}</span>
                </div>
              ) : null}
              <p style={{ color: "var(--muted)", marginBottom: "6px" }}>
                {continueWatching.type === "series" ? "TV Series" : "Movie"}
                {continueWatching.type === "series" && continueWatching.season
                  ? ` • Season ${continueWatching.season}${continueWatching.totalSeasons ? ` of ${continueWatching.totalSeasons}` : ""}`
                  : ""}
              </p>
              {continueWatching.type === "series" ? (
                <>
                  <p style={{ color: "var(--text-strong)", marginBottom: "8px" }}>
                    Episode {continueWatching.episode ?? "-"}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "10px" }}>
                    <div style={{ height: "8px", borderRadius: "999px", background: "var(--divider)", overflow: "hidden" }}>
                      <div style={{ width: `${getSeasonProgressPercent(continueWatching.episode)}%`, height: "100%", background: "var(--accent)" }} />
                    </div>
                    <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                      {continueWatching.episode ?? 0} of 10 episodes
                    </p>
                  </div>
                </>
              ) : (
                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No episodic progress for films</p>
              )}
            </div>
          </Link>
        ) : (
          <p style={{ color: "var(--muted)" }}>Nothing in progress yet.</p>
        )}
      </section>

      <section className="stack">
        <h2 className="section-title" style={{ marginBottom: 0 }}>{`✨ ${recommendationMeta.title}`}</h2>
        <p style={{ color: "var(--muted)", marginTop: "-6px" }}>{recommendationMeta.subtitle}</p>
        <button type="button" onClick={handlePick} style={pickButtonStyle}>
          <ShuffleLogo />
          <div style={{ display: "grid", gap: "2px", textAlign: "left" }}>
            <span style={{ fontSize: "1.55rem", lineHeight: 0.9, fontWeight: 700 }}>{recommendationMeta.actionLine1}</span>
            <span style={{ fontSize: "1.55rem", lineHeight: 0.9, fontWeight: 700 }}>{recommendationMeta.actionLine2}</span>
            <span style={{ color: "var(--muted)", fontSize: "1.05rem" }}>I&apos;ll choose for you</span>
          </div>
          <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: "1.4rem" }}>›</span>
        </button>
      </section>

      <section className="stack">
        <div className="row">
          <h2 className="section-title" style={{ marginBottom: 0 }}>Recently Added</h2>
          <Link to="/library" className="subtle-link">See All</Link>
        </div>
        {recentlyAdded.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
            {recentlyAdded.map((entry) => (
              <Link key={entry.id} to={`/library/${entry.id}`} style={recentlyAddedCardStyle}>
                <div style={recentlyAddedTopStyle}>
                  <div style={recentlyAddedMediaWrapStyle}>
                    <MediaLogo type={entry.type} size="small" tone={tileToneByIndex(entry.id)} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    {entry.platform ? <PlatformLogo platform={entry.platform} compact /> : <span style={recentlyAddedEmptyPlatformStyle}>?</span>}
                  </div>
                </div>
                <div style={{ display: "grid", gap: "8px" }}>
                  <div style={{ minHeight: "2.6em" }}>
                    <p style={recentlyAddedTitleStyle}>{entry.title}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={recentlyAddedTypePillStyle}>{entry.type === "series" ? "TV" : "Film"}</span>
                    <span style={{ color: "var(--muted)", fontSize: "1rem", lineHeight: 1 }}>›</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--muted)" }}>Your library is waiting for its first title.</p>
        )}
      </section>

      <section className="stack">
        <div className="row">
          <h2 className="section-title" style={{ marginBottom: 0 }}>Recently Watched</h2>
          <Link to="/library" className="subtle-link">See All</Link>
        </div>
        {recentlyWatched.length ? (
          <div style={{ display: "grid", gap: "10px" }}>
            {recentlyWatched.map((entry) => (
              <Link key={entry.id} to={`/library/${entry.id}`} style={wideCardStyle}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <MediaLogo type={entry.type} size="medium" tone={entry.type === "series" ? "green" : "blue"} />
                  <div>
                    <p style={{ fontWeight: 700 }}>{entry.title}</p>
                    {entry.platform ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <PlatformLogo platform={entry.platform} compact />
                        <span style={{ color: "var(--text-strong)", fontSize: "0.84rem", fontWeight: 650 }}>{platformLabel(entry.platform)}</span>
                      </div>
                    ) : null}
                    <p style={{ color: "#0a84ff", marginTop: "2px" }}>{ratingToStars(entry.rating)}</p>
                    <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "2px" }}>{timeAgo(entry.lastWatchedAt ?? entry.updatedAt)}</p>
                  </div>
                </div>
                <p style={{ color: "var(--muted)", fontSize: "1.35rem" }}>›</p>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--muted)" }}>Complete titles to build your journal history.</p>
        )}
      </section>
    </main>
  );
}

const pickButtonStyle: CSSProperties = {
  width: "100%",
  border: "1px solid var(--card-border)",
  borderRadius: "14px",
  background: "var(--card-bg)",
  color: "var(--fg)",
  padding: "12px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  textAlign: "left",
  cursor: "pointer"
};

const wideCardStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderRadius: "12px",
  border: "1px solid var(--card-border)",
  background: "var(--bg-panel)",
  padding: "12px"
};

const recentlyAddedCardStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  borderRadius: "18px",
  border: "1px solid var(--card-border)",
  background: "linear-gradient(180deg, color-mix(in srgb, var(--bg-panel) 88%, transparent), var(--card-bg))",
  padding: "14px",
  minHeight: "176px",
  alignContent: "space-between"
};

const recentlyAddedTopStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "start",
  gap: "10px"
};

const recentlyAddedMediaWrapStyle: CSSProperties = {
  width: "82px",
  height: "82px",
  borderRadius: "18px",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
  border: "1px solid var(--card-border)"
};

const recentlyAddedTitleStyle: CSSProperties = {
  color: "var(--text-strong)",
  fontSize: "1rem",
  fontWeight: 760,
  lineHeight: 1.3,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden"
};

const recentlyAddedTypePillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "28px",
  padding: "0 10px",
  borderRadius: "999px",
  background: "var(--input-bg)",
  border: "1px solid var(--input-border)",
  color: "var(--muted)",
  fontSize: "0.78rem",
  fontWeight: 700,
  letterSpacing: "0.02em"
};

const recentlyAddedEmptyPlatformStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "10px",
  border: "1px dashed var(--input-border)",
  color: "var(--muted)",
  display: "grid",
  placeItems: "center",
  fontSize: "0.8rem",
  fontWeight: 700
};

function tileToneByIndex(id: string): "red" | "green" | "blue" | "purple" {
  const tones: Array<"red" | "green" | "blue" | "purple"> = ["red", "green", "blue", "purple"];
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % tones.length;
  return tones[hash];
}
