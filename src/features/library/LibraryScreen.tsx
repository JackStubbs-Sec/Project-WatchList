import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MediaLogo } from "../../components/icons";
import { SegmentedControl } from "../../components/SegmentedControl";
import { useWatchStore } from "../../store/useWatchStore";
import { isDropped } from "../../lib/entryTags";
import type { WatchEntry, WatchStatus } from "../../types/watch";

type Group = WatchStatus | "dropped";

const groups: Group[] = ["want_to_watch", "watching", "watched", "dropped"];

const groupMeta: Record<Group, { label: string; icon: string; tone: string }> = {
  want_to_watch: { label: "Want to Watch", icon: "🔖", tone: "#f25f6a" },
  watching: { label: "Watching", icon: "▶", tone: "#e9b432" },
  watched: { label: "Watched", icon: "✓", tone: "#8ad36d" },
  dropped: { label: "Dropped", icon: "✕", tone: "#8892a8" }
};

type Segment = "all" | "movie" | "tv";

function entryGroup(entry: WatchEntry): Group {
  if (isDropped(entry)) return "dropped";
  return entry.status;
}

export function LibraryScreen() {
  const entries = useWatchStore((state) => state.entries);
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [genre, setGenre] = useState("");
  const [collapsed, setCollapsed] = useState<Record<Group, boolean>>({
    want_to_watch: false,
    watching: false,
    watched: false,
    dropped: false
  });

  const genreOptions = useMemo(() => {
    const values = new Set<string>();
    for (const entry of entries) {
      for (const value of entry.genres) {
        const trimmed = value.trim();
        if (trimmed) values.add(trimmed);
      }
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const grouped = useMemo(() => {
    const lowered = query.toLowerCase();
    const filtered = entries
      .filter((entry) => entry.title.toLowerCase().includes(lowered))
      .filter((entry) => segment === "all" || entry.type === segment)
      .filter((entry) => !genre || entry.genres.some((value) => value.toLowerCase() === genre.toLowerCase()));

    return groups.map((group) => ({
      group,
      items: filtered.filter((entry) => entryGroup(entry) === group)
    }));
  }, [entries, genre, query, segment]);

  return (
    <main style={{ paddingBottom: "calc(var(--tab-height) + env(safe-area-inset-bottom) + var(--space-4))", overflowX: "hidden" }}>
      <section className="screen-header">
        <div>
          <h1 className="screen-title">Library</h1>
          <p style={{ color: "var(--muted)" }}>All your shows and movies</p>
        </div>
        <Link to="/lists" className="subtle-link">My Lists</Link>
      </section>

      <SegmentedControl
        ariaLabel="Filter by type"
        value={segment}
        onChange={setSegment}
        options={[
          { value: "all", label: "All" },
          { value: "movie", label: "Movies" },
          { value: "tv", label: "TV Shows" }
        ]}
      />

      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles" className="soft-input" />

      <select value={genre} onChange={(event) => setGenre(event.target.value)} className="soft-input">
        <option value="">All genres</option>
        {genreOptions.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      {grouped.map(({ group, items }) => {
        const meta = groupMeta[group];
        return (
          <section key={group} className="card" style={{ padding: "11px" }}>
            <button type="button" onClick={() => setCollapsed((state) => ({ ...state, [group]: !state[group] }))} style={sectionToggleStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <span
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "10px",
                    display: "grid",
                    placeItems: "center",
                    background: meta.tone,
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "0.85rem"
                  }}
                >
                  {meta.icon}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: "0.88rem" }}>{meta.label}</p>
                  <p style={{ color: "var(--muted)", fontSize: "0.76rem" }}>
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--muted)", fontSize: "0.74rem", fontWeight: 650 }}>
                <span>{collapsed[group] ? "Show" : "Hide"}</span>
                <span style={{ fontSize: "0.9rem", lineHeight: 1 }}>{collapsed[group] ? "▾" : "▴"}</span>
              </span>
            </button>
            {!collapsed[group] && items.length ? (
              <div style={{ marginTop: "8px", borderTop: "1px solid var(--divider)", paddingTop: "8px", display: "grid", gap: "6px", minWidth: 0 }}>
                {items.map((entry) => (
                  <Link
                    key={entry.id}
                    to={`/library/${entry.id}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "34px minmax(0, 1fr) 12px",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 2px",
                      width: "100%",
                      maxWidth: "100%",
                      overflow: "hidden"
                    }}
                  >
                    <span style={libraryMediaIconWrapStyle}>
                      {entry.posterUrl ? (
                        <img src={entry.posterUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                      ) : (
                        <MediaLogo type={entry.type} size="compact" tone={entry.type === "tv" ? "purple" : "red"} />
                      )}
                    </span>
                    <span style={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
                      <span style={{ display: "block", color: "var(--text-strong)", fontSize: "0.86rem", fontWeight: 720, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.title}
                      </span>
                      <span
                        style={{
                          display: "-webkit-box",
                          color: "var(--muted)",
                          fontSize: "0.72rem",
                          marginTop: "2px",
                          overflow: "hidden",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          lineHeight: 1.25,
                          overflowWrap: "anywhere"
                        }}
                      >
                        {entry.type === "tv" ? "TV Series" : "Movie"}
                        {entry.genres.length ? ` • ${entry.genres.join(", ")}` : ""}
                      </span>
                    </span>
                    <span style={{ color: "var(--muted)", fontSize: "1rem", flexShrink: 0 }}>›</span>
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

const libraryMediaIconWrapStyle: React.CSSProperties = {
  width: "34px",
  height: "34px",
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
  overflow: "hidden",
  borderRadius: "8px"
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
