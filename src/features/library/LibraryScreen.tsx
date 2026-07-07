import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PlatformLogo, platformLabel } from "../../components/icons";
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

  const grouped = useMemo(() => {
    const lowered = query.toLowerCase();
    const filtered = entries
      .filter((entry) => entry.title.toLowerCase().includes(lowered))
      .filter((entry) => segment === "all" || entry.type === segment);

    return statuses.map((status) => ({
      status,
      items: filtered.filter((entry) => entry.status === status)
    }));
  }, [entries, query, segment]);

  return (
    <main>
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

      {grouped.map((group) => {
        const meta = statusMeta[group.status];
        return (
          <section key={group.status} className="card" style={{ padding: "14px" }}>
            <div className="row">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                <div>
                  <p style={{ fontWeight: 700 }}>{meta.label}</p>
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    {group.items.length} {group.items.length === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
              <span style={{ color: "var(--muted)", fontSize: "0.82rem", fontWeight: 650 }}>Top matches</span>
            </div>
            {group.items.length ? (
              <div style={{ marginTop: "10px", borderTop: "1px solid rgba(14,22,38,0.08)", paddingTop: "10px" }}>
                {group.items.slice(0, 2).map((entry) => (
                  <p key={entry.id} style={{ color: "var(--muted)", fontSize: "0.83rem" }}>
                    <Link to={`/library/${entry.id}`}>{entry.title}</Link>
                    {` • ${entry.type === "series" ? "TV Series" : "Movie"}`}
                    {entry.type === "series" && entry.totalSeasons ? ` • ${entry.totalSeasons} season${entry.totalSeasons > 1 ? "s" : ""}` : ""}
                    {entry.platform ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginLeft: "8px", color: "var(--text-strong)" }}>
                        <PlatformLogo platform={entry.platform} compact />
                        <span>{platformLabel(entry.platform)}</span>
                      </span>
                    ) : null}
                  </p>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </main>
  );
}
