import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWatchStore } from "../../store/useWatchStore";
import type { TonightStatusFilter } from "../../types/watch";

export function TonightPickScreen() {
  const navigate = useNavigate();
  const entries = useWatchStore((state) => state.entries);
  const tonight = useWatchStore((state) => state.tonight);
  const tonightFilter = useWatchStore((state) => state.tonightFilter);
  const setTonightFilter = useWatchStore((state) => state.setTonightFilter);
  const rerollTonight = useWatchStore((state) => state.rerollTonight);

  const genreOptions = useMemo(() => {
    const genres = new Set<string>();
    for (const entry of entries) {
      if (entry.genre?.trim()) {
        genres.add(entry.genre.trim());
      }
    }
    return Array.from(genres).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  useEffect(() => {
    if (!tonight) {
      rerollTonight();
    }
  }, [tonight, rerollTonight]);

  useEffect(() => {
    rerollTonight();
  }, [tonightFilter.type, tonightFilter.genre, tonightFilter.status, rerollTonight]);

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  }

  return (
    <main>
      <section className="screen-header">
        <button
          type="button"
          aria-label="Close tonight pick"
          onClick={goBack}
          style={{ width: "32px", height: "32px", borderRadius: "999px", border: "1px solid rgba(14,22,38,0.18)", background: "transparent", color: "var(--muted)" }}
        >
          ✕
        </button>
        <div style={{ flex: 1, minWidth: 0, marginLeft: "12px" }}>
          <h1 className="screen-title">Tonight&apos;s Pick</h1>
          <p style={{ color: "var(--muted)" }}>Let&apos;s find something to watch</p>
        </div>
      </section>

      <section className="card" style={{ padding: "10px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", alignItems: "center" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
            <button
              type="button"
              onClick={() => setTonightFilter({ type: undefined })}
              style={{
                border: "1px solid var(--input-border)",
                borderRadius: "10px",
                background: !tonightFilter.type ? "var(--accent)" : "var(--input-bg)",
                color: !tonightFilter.type ? "var(--text-inverse)" : "var(--muted)",
                padding: "10px",
                fontWeight: 650,
                cursor: "pointer"
              }}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTonightFilter({ type: "movie" })}
              style={{
                border: "1px solid var(--input-border)",
                borderRadius: "10px",
                background: tonightFilter.type === "movie" ? "var(--accent)" : "var(--input-bg)",
                color: tonightFilter.type === "movie" ? "var(--text-inverse)" : "var(--muted)",
                padding: "10px",
                fontWeight: 650,
                cursor: "pointer"
              }}
            >
              Film
            </button>
            <button
              type="button"
              onClick={() => setTonightFilter({ type: "series" })}
              style={{
                border: "1px solid var(--input-border)",
                borderRadius: "10px",
                background: tonightFilter.type === "series" ? "var(--accent)" : "var(--input-bg)",
                color: tonightFilter.type === "series" ? "var(--text-inverse)" : "var(--muted)",
                padding: "10px",
                fontWeight: 650,
                cursor: "pointer"
              }}
            >
              TV
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <select
              value={tonightFilter.genre ?? ""}
              onChange={(event) => setTonightFilter({ genre: event.target.value || undefined })}
              style={{
                width: "100%",
                minWidth: 0,
                border: "1px solid var(--input-border)",
                borderRadius: "10px",
                background: "var(--input-bg)",
                color: "var(--fg)",
                padding: "10px"
              }}
            >
              <option value="">All Genres</option>
              {genreOptions.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>

            <select
              value={tonightFilter.status ?? ""}
              onChange={(event) =>
                setTonightFilter({
                  status: event.target.value ? (event.target.value as TonightStatusFilter) : undefined
                })
              }
              style={{
                width: "100%",
                minWidth: 0,
                border: "1px solid var(--input-border)",
                borderRadius: "10px",
                background: "var(--input-bg)",
                color: "var(--fg)",
                padding: "10px"
              }}
            >
              <option value="">Default (Not watched + Watching)</option>
              <option value="not_watched">Not Watched</option>
              <option value="watching">Watching</option>
              <option value="watched">Watched</option>
              <option value="dropped">Dropped</option>
              <option value="recommended">Recommended</option>
              <option value="favourite">Favourite</option>
            </select>
          </div>
        </div>
      </section>

      <section className="card" style={{ borderColor: "rgba(255, 159, 10, 0.45)", background: "linear-gradient(180deg, rgba(255, 159, 10, 0.16), var(--bg-panel))" }}>
        {tonight ? (
          <div style={{ textAlign: "center", display: "grid", gap: "14px" }}>
            <p style={{ color: "var(--muted)" }}>Your pick is...</p>
            <h2 style={{ fontSize: "1.9rem", lineHeight: 1.15, overflowWrap: "anywhere" }}>{tonight.title}</h2>
            <p style={{ color: "var(--muted)", textTransform: "capitalize" }}>{tonight.type}</p>
            <Link
              to={`/library/${tonight.id}`}
              style={{ borderRadius: "999px", background: "var(--accent-secondary)", color: "#14100b", padding: "12px", fontWeight: 700, overflowWrap: "anywhere" }}
            >
              View Details
            </Link>
            <button
              type="button"
              onClick={rerollTonight}
              style={{ borderRadius: "999px", border: "1px solid rgba(14,22,38,0.18)", background: "transparent", color: "var(--fg)", padding: "12px", fontWeight: 650 }}
            >
              Pick Again
            </button>
          </div>
        ) : (
          <p style={{ color: "var(--muted)" }}>Add more titles to your watchlist and try again.</p>
        )}
      </section>
    </main>
  );
}
