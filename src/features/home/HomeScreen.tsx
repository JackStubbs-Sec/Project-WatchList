import { useEffect, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWatchStore } from "../../store/useWatchStore";
import { AvailableOn } from "../../components/AvailableOn";
import { HeartIcon, MediaLogo } from "../../components/icons";
import { JustReleasedBadge } from "../../components/JustReleasedBadge";
import { isFavorite, withTag } from "../../lib/entryTags";
import { isJustReleased } from "../../lib/justReleased";
import { getInitials, getProfileName } from "../../lib/profile";
import { getRegion } from "../../lib/region";
import { getWatchProviders, type WatchProviders } from "../../lib/tmdb";
import type { WatchEntry } from "../../types/watch";

function greetingByHour(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function timeAgo(isoDate?: string) {
  if (!isoDate) return "recently";
  const deltaDays = Math.max(1, Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000));
  if (deltaDays < 7) return `${deltaDays} day${deltaDays > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(deltaDays / 7);
  if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  const months = Math.floor(deltaDays / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

function watchedEpisodeCount(entry: WatchEntry) {
  return entry.episodeProgress.filter((row) => row.watched).length;
}

function currentSeason(entry: WatchEntry): number | undefined {
  if (!entry.episodeProgress.length) return undefined;
  return entry.episodeProgress[entry.episodeProgress.length - 1].season;
}

export function HomeScreen() {
  const navigate = useNavigate();
  const entries = useWatchStore((state) => state.entries);
  const updateEntry = useWatchStore((state) => state.updateEntry);
  const tonight = useWatchStore((state) => state.tonight);
  const tonightReasoning = useWatchStore((state) => state.tonightReasoning);
  const tonightLoading = useWatchStore((state) => state.tonightLoading);
  const tonightError = useWatchStore((state) => state.tonightError);
  const rerollTonight = useWatchStore((state) => state.rerollTonight);
  const notifications = useWatchStore((state) => state.notifications);

  const [profileName] = useState(getProfileName());
  const [tonightProviders, setTonightProviders] = useState<WatchProviders | undefined>(undefined);
  const [tonightProvidersLoading, setTonightProvidersLoading] = useState(false);

  const now = new Date();
  const greeting = greetingByHour(now);
  const continuing = entries.filter((entry) => entry.status === "watching" && entry.type === "tv");
  const recentlyAdded = entries.slice(0, 6);

  useEffect(() => {
    if (!tonight) {
      void rerollTonight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof tonight?.tmdbId !== "number") {
      setTonightProviders(undefined);
      return;
    }
    let cancelled = false;
    setTonightProvidersLoading(true);
    getWatchProviders(tonight.tmdbId, tonight.mediaType, getRegion())
      .then((result) => {
        if (!cancelled) setTonightProviders(result);
      })
      .catch(() => {
        if (!cancelled) setTonightProviders(undefined);
      })
      .finally(() => {
        if (!cancelled) setTonightProvidersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tonight?.tmdbId, tonight?.mediaType]);

  async function onToggleFavorite(entry: WatchEntry, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    await updateEntry(entry.id, { tags: withTag(entry.tags, "favorite", !isFavorite(entry)) });
  }

  function handleReroll() {
    void rerollTonight();
  }

  return (
    <main style={homeMainStyle}>
      <section style={headerRowStyle}>
        <div>
          <h1 style={{ fontSize: "1.42rem", marginBottom: "3px", letterSpacing: "-0.02em" }}>{`${greeting}${profileName.trim() ? `, ${profileName.trim()}` : ""} 👋`}</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Here&apos;s what&apos;s happening in your world</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link to="/notifications" style={bellStyle} aria-label={notifications.length ? `${notifications.length} new season notifications` : "Notifications"}>
            🔔
            {notifications.length ? <span style={notificationDotStyle} /> : null}
          </Link>
          <Link to="/profile" style={avatarStyle}>
            {getInitials(profileName)}
          </Link>
        </div>
      </section>

      <section style={sectionStyle}>
        <div className="row">
          <h2 style={sectionTitleStyle}>▶️ Pick up where you left off</h2>
          <Link to="/library" className="subtle-link" style={{ fontSize: "0.78rem" }}>View all</Link>
        </div>
        {continuing.length ? (
          <div style={continueRailStyle}>
            {continuing.map((entry) => {
              const watched = watchedEpisodeCount(entry);
              const season = currentSeason(entry);
              const percent = entry.totalEpisodes ? Math.min(Math.round((watched / entry.totalEpisodes) * 100), 100) : 0;
              return (
                <div key={entry.id} style={continueCardStyle}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={continuePosterWrapStyle}>
                      {entry.posterUrl ? (
                        <img src={entry.posterUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <MediaLogo type={entry.type} size="medium" tone="purple" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 760, fontSize: "1.04rem", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.title}</p>
                      {season ? <p style={{ color: "var(--accent)", fontWeight: 650, fontSize: "0.8rem", marginBottom: "3px" }}>Season {season}</p> : null}
                      {entry.totalEpisodes ? (
                        <>
                          <p style={{ color: "var(--text-strong)", fontSize: "0.84rem", marginBottom: "6px" }}>
                            {watched < entry.totalEpisodes ? `Episode ${watched + 1} next` : "Season complete"}
                          </p>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "6px" }}>
                            <div style={{ height: "5px", borderRadius: "999px", background: "var(--divider)", overflow: "hidden" }}>
                              <div style={{ width: `${percent}%`, height: "100%", background: "var(--accent)" }} />
                            </div>
                            <span style={{ color: "var(--muted)", fontSize: "0.7rem" }}>
                              {watched} of {entry.totalEpisodes}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{watched ? `${watched} episodes watched` : "Not tracked yet"}</p>
                      )}
                      <p style={{ color: "var(--muted)", fontSize: "0.72rem", marginTop: "5px" }}>
                        <span style={{ marginRight: "3px" }}>📅</span>
                        Last watched {timeAgo(entry.watchHistory[0]?.watchedDate ?? entry.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/library/${entry.id}`)}
                      className="btn btn-primary"
                      style={{ flex: 1, fontSize: "0.85rem", padding: "10px" }}
                    >
                      ▶ Resume Tracking
                    </button>
                    <Link to={`/library/${entry.id}`} aria-label="More options" className="icon-btn" style={{ width: "36px" }}>
                      ⋯
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "var(--muted)" }}>Nothing in progress yet.</p>
        )}
      </section>

      <section style={sectionStyle}>
        <div className="row">
          <h2 style={sectionTitleStyle}>⭐ Tonight&apos;s recommendation</h2>
          <span style={{ color: "var(--accent-secondary)", fontSize: "0.72rem", fontWeight: 650, flexShrink: 0 }}>New pick every night</span>
        </div>
        {tonight ? (
          <div className="card" style={{ ...tonightCardStyle, opacity: tonightLoading ? 0.6 : 1 }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={tonightPosterWrapStyle}>
                {tonight.posterUrl ? (
                  <img src={tonight.posterUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <MediaLogo type={tonight.mediaType} size="medium" tone="purple" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 760, fontSize: "1.08rem", lineHeight: 1.2 }}>{tonight.title}</p>
                <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "2px" }}>
                  {tonight.year ?? ""}
                  {tonight.runtimeMinutes ? ` • ${tonight.runtimeMinutes}m` : ""}
                  {tonight.mediaType === "tv" ? " • TV Series" : ""}
                </p>
                {isJustReleased(tonight.releaseDate) ? (
                  <div style={{ marginTop: "4px" }}>
                    <JustReleasedBadge compact />
                  </div>
                ) : null}
                {tonight.genres.length ? (
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "7px" }}>
                    {tonight.genres.slice(0, 3).map((genre) => (
                      <span key={genre} className="chip">
                        {genre}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              {typeof tonightReasoning?.predictedRating === "number" ? (
                <div style={predictedBadgeStyle}>
                  <span style={{ fontSize: "1.05rem" }}>★ {tonightReasoning.predictedRating.toFixed(1)}</span>
                  <span style={{ color: "var(--muted)", fontSize: "0.6rem", textAlign: "center", lineHeight: 1.2 }}>Your predicted rating</span>
                </div>
              ) : null}
            </div>

            {tonightReasoning?.basedOnTitles.length ? (
              <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                Because you loved{" "}
                <span style={{ color: "var(--accent-secondary)", fontWeight: 650 }}>{tonightReasoning.basedOnTitles.join(" • ")}</span>
              </p>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Trending now, picked to match your taste.</p>
            )}

            {tonight.synopsis ? (
              <p style={{ color: "var(--muted)", fontSize: "0.78rem", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {tonight.synopsis}
              </p>
            ) : null}

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "8px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <AvailableOn providers={tonightProviders} loading={tonightProvidersLoading} compact limit={3} mediaType={tonight.mediaType} />
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button type="button" onClick={handleReroll} disabled={tonightLoading} aria-label="Reroll" className="icon-btn">
                  ↻
                </button>
                <Link
                  to={`/discover/${tonight.mediaType}/${tonight.tmdbId}`}
                  className="btn btn-primary"
                  style={{ fontSize: "0.82rem", padding: "9px 14px" }}
                >
                  Details
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: "var(--muted)" }}>
            {tonightLoading ? "Finding something for you..." : tonightError ?? "No recommendation available right now."}
          </p>
        )}
      </section>

      <section style={sectionStyle}>
        <div className="row">
          <h2 style={sectionTitleStyle}>➕ Recently added</h2>
          <Link to="/library" className="subtle-link" style={{ fontSize: "0.78rem" }}>View all</Link>
        </div>
        {recentlyAdded.length ? (
          <div style={recentlyAddedRailStyle}>
            {recentlyAdded.map((entry) => (
              <Link key={entry.id} to={`/library/${entry.id}`} style={recentlyAddedCardStyle}>
                <div style={recentlyAddedPosterWrapStyle}>
                  {entry.posterUrl ? (
                    <img src={entry.posterUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <MediaLogo type={entry.type} size="medium" tone={entry.type === "tv" ? "purple" : "red"} />
                  )}
                  <button type="button" onClick={(event) => void onToggleFavorite(entry, event)} style={heartButtonStyle} aria-label="Toggle favourite">
                    <HeartIcon filled={isFavorite(entry)} size={13} />
                  </button>
                </div>
                <p style={recentlyAddedTitleStyle}>{entry.title}</p>
                <div className="row" style={{ marginTop: "0" }}>
                  <span style={{ color: "var(--muted)", fontSize: "0.7rem" }}>{entry.year ?? ""}</span>
                  {entry.rating ? (
                    <span style={{ color: "#34c759", fontSize: "0.7rem", fontWeight: 650 }}>★ {entry.rating.toFixed(1)}</span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--muted)" }}>Your library is waiting for its first title.</p>
        )}
      </section>
    </main>
  );
}

const homeMainStyle: CSSProperties = {
  gap: "14px",
  paddingTop: "max(10px, env(safe-area-inset-top))"
};

const sectionStyle: CSSProperties = {
  display: "grid",
  gap: "7px"
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "0.92rem",
  fontWeight: 700,
  marginBottom: 0
};

const headerRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "8px"
};

const bellStyle: CSSProperties = {
  position: "relative",
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  display: "grid",
  placeItems: "center",
  background: "var(--input-bg)",
  border: "1px solid var(--card-border)",
  fontSize: "0.84rem"
};

const notificationDotStyle: CSSProperties = {
  position: "absolute",
  top: "-1px",
  right: "-1px",
  width: "9px",
  height: "9px",
  borderRadius: "999px",
  background: "var(--accent)",
  border: "1.5px solid var(--bg)"
};

const avatarStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  display: "grid",
  placeItems: "center",
  background: "var(--accent)",
  color: "var(--text-inverse)",
  fontWeight: 700,
  fontSize: "0.68rem",
  border: "2px solid var(--accent-soft)"
};

const continueRailStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  overflowX: "auto",
  overscrollBehaviorX: "contain",
  paddingBottom: "2px"
};

const continueCardStyle: CSSProperties = {
  flex: "0 0 min(300px, 86vw)",
  borderRadius: "16px",
  border: "1px solid var(--card-border)",
  background: "var(--card-bg)",
  padding: "13px"
};

const continuePosterWrapStyle: CSSProperties = {
  width: "74px",
  height: "104px",
  borderRadius: "11px",
  overflow: "hidden",
  flexShrink: 0,
  display: "grid",
  placeItems: "center",
  background: "var(--input-bg)"
};

const tonightCardStyle: CSSProperties = {
  display: "grid",
  gap: "11px",
  padding: "15px",
  borderColor: "color-mix(in srgb, var(--accent-secondary) 35%, var(--card-border))",
  background: "linear-gradient(180deg, color-mix(in srgb, var(--accent-secondary) 12%, transparent), var(--bg-panel))",
  transition: "opacity 0.2s ease"
};

const tonightPosterWrapStyle: CSSProperties = {
  width: "80px",
  height: "114px",
  borderRadius: "11px",
  overflow: "hidden",
  flexShrink: 0,
  display: "grid",
  placeItems: "center",
  background: "var(--input-bg)"
};

const predictedBadgeStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "2px",
  padding: "8px 9px",
  borderRadius: "11px",
  background: "var(--input-bg)",
  border: "1px solid var(--card-border)",
  color: "var(--accent-secondary)",
  fontWeight: 700,
  height: "fit-content",
  maxWidth: "76px"
};

const recentlyAddedRailStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  overflowX: "auto",
  overscrollBehaviorX: "contain",
  paddingBottom: "2px"
};

const recentlyAddedCardStyle: CSSProperties = {
  flex: "0 0 clamp(78px, 23vw, 96px)",
  display: "grid",
  gap: "6px"
};

const recentlyAddedPosterWrapStyle: CSSProperties = {
  position: "relative",
  aspectRatio: "2 / 3",
  borderRadius: "12px",
  overflow: "hidden",
  background: "var(--input-bg)",
  border: "1px solid var(--card-border)",
  display: "grid",
  placeItems: "center"
};

const heartButtonStyle: CSSProperties = {
  position: "absolute",
  top: "5px",
  right: "5px",
  width: "24px",
  height: "24px",
  borderRadius: "999px",
  border: "none",
  background: "rgba(10,10,16,0.55)",
  color: "#fff",
  display: "grid",
  placeItems: "center",
  fontSize: "0.82rem",
  minHeight: "unset"
};

const recentlyAddedTitleStyle: CSSProperties = {
  color: "var(--text-strong)",
  fontSize: "0.8rem",
  fontWeight: 720,
  lineHeight: 1.2,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  overflowWrap: "anywhere"
};
