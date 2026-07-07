import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MediaLogo, PlatformLogo, platformLabel } from "../../components/icons";
import { useWatchStore } from "../../store/useWatchStore";
import type { WatchStatus } from "../../types/watch";

const statuses: WatchStatus[] = ["watchlist", "watching", "completed", "dropped"];

const statusMeta: Record<WatchStatus, { label: string; icon: string; tone: string }> = {
  watchlist: { label: "Watchlist", icon: "🔖", tone: "#f25f6a" },
  watching: { label: "Watching", icon: "▶", tone: "#e9b432" },
  completed: { label: "Completed", icon: "✓", tone: "#8ad36d" },
  dropped: { label: "Dropped", icon: "✕", tone: "#8892a8" }
};

type Segment = "all" | "movie" | "series";

export function LibraryScreen() {
  const entries = useWatchStore((state) => state.entries);
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");
  const [collapsed, setCollapsed] = useState<Record<WatchStatus, boolean>>({
    watchlist: false,
    watching: false,
    completed: false,
    dropped: false
  });

  const genreOptions = useMemo(() => {
    const values = new Set<string>();
    for (const entry of entries) {
      const trimmed = entry.genre.trim();
      if (trimmed) values.add(trimmed);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const platformOptions = useMemo(() => {
    const values = new Set<string>();
    for (const entry of entries) {
      if (entry.platform) values.add(entry.platform);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const grouped = useMemo(() => {
    const lowered = query.toLowerCase();
    const filtered = entries
      .filter((entry) => entry.title.toLowerCase().includes(lowered))
      .filter((entry) => segment === "all" || entry.type === segment)
      .filter((entry) => !genre || entry.genre.trim().toLowerCase() === genre.toLowerCase())
      .filter((entry) => !platform || entry.platform === platform);

    return statuses.map((status) => ({
      status,
      items: filtered.filter((entry) => entry.status === status)
    }));
  }, [entries, genre, platform, query, segment]);

  return (
    <main style={{ paddingBottom: "calc(var(--tab-height) + env(safe-area-inset-bottom) + var(--space-4))" }}>
      <section className="screen-header">
        <div>
          <h1 className="screen-title">Library</h1>
          <p style={{ color: "var(--muted)" }}>All your shows and movies</p>
        </div>
      </section>

      <section className="card" style={{ padding: "8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
          {[
            { id: "all", label: "All" },
            { id: "movie", label: "Movies" },
            { id: "series", label: "TV Shows" }
          ].map((item) => {
            const active = segment === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSegment(item.id as Segment)}
                style={{
                  border: "none",
                  borderRadius: "999px",
                  padding: "10px",
                  background: active ? "var(--accent)" : "transparent",
                  color: active ? "var(--text-inverse)" : "var(--muted)",
                  fontWeight: 650,
                  cursor: "pointer"
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles" className="soft-input" />

      <section className="card" style={{ padding: "10px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <select value={genre} onChange={(event) => setGenre(event.target.value)} style={filterStyle}>
            <option value="">All genres</option>
            {genreOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select value={platform} onChange={(event) => setPlatform(event.target.value)} style={filterStyle}>
            <option value="">All services</option>
            {platformOptions.map((item) => (
              <option key={item} value={item}>
                {platformLabel(item as Parameters<typeof platformLabel>[0])}
              </option>
            ))}
          </select>
        </div>
      </section>

      {grouped.map((group) => {
        const meta = statusMeta[group.status];
        return (
          <section key={group.status} className="card" style={{ padding: "14px" }}>
            <button type="button" onClick={() => setCollapsed((state) => ({ ...state, [group.status]: !state[group.status] }))} style={sectionToggleStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <span
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    display: "grid",
                    placeItems: "center",
                    background: meta.tone,
                    color: "#fff",
                    fontWeight: 800
                  }}
                >
                  {meta.icon}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700 }}>{meta.label}</p>
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    {group.items.length} {group.items.length === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
              <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)", fontSize: "0.82rem", fontWeight: 650 }}>
                <span>{collapsed[group.status] ? "Show" : "Hide"}</span>
                <span style={{ fontSize: "1rem", lineHeight: 1 }}>{collapsed[group.status] ? "▾" : "▴"}</span>
              </span>
            </button>
            {!collapsed[group.status] && group.items.length ? (
              <div style={{ marginTop: "10px", borderTop: "1px solid var(--divider)", paddingTop: "10px", display: "grid", gap: "10px" }}>
                {group.items.map((entry) => (
                  <Link
                    key={entry.id}
                    to={`/library/${entry.id}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto auto 1fr auto",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 2px"
                    }}
                  >
                    <MediaLogo type={entry.type} size="medium" tone={entry.type === "series" ? "purple" : "red"} />
                    {entry.platform ? <PlatformLogo platform={entry.platform} compact /> : <span style={emptyPlatformStyle}>?</span>}
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", color: "var(--text-strong)", fontSize: "0.98rem", fontWeight: 720, lineHeight: 1.2, overflowWrap: "anywhere" }}>
                        {entry.title}
                      </span>
                      <span style={{ display: "block", color: "var(--muted)", fontSize: "0.84rem", marginTop: "3px", overflowWrap: "anywhere" }}>
                        {entry.type === "series" ? "TV Series" : "Movie"}
                        {entry.genre.trim() ? ` • ${entry.genre.trim()}` : ""}
                        {entry.type === "series" && entry.totalSeasons ? ` • ${entry.totalSeasons} season${entry.totalSeasons > 1 ? "s" : ""}` : ""}
                      </span>
                    </span>
                    <span style={{ color: "var(--muted)", fontSize: "1.2rem" }}>›</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </main>
  );
}

const filterStyle: React.CSSProperties = {
  border: "1px solid var(--input-border)",
  borderRadius: "10px",
  background: "var(--input-bg)",
  color: "var(--fg)",
  padding: "10px"
};

const emptyPlatformStyle: React.CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "10px",
  border: "1px dashed var(--input-border)",
  color: "var(--muted)",
  display: "grid",
  placeItems: "center",
  fontSize: "0.85rem",
  fontWeight: 700
};

const sectionToggleStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: "transparent",
  color: "var(--fg)",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  textAlign: "left",
  minHeight: "unset"
};
