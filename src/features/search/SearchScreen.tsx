import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MediaLogo } from "../../components/icons";
import { useWatchStore } from "../../store/useWatchStore";

export function SearchScreen() {
  const entries = useWatchStore((state) => state.entries);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"" | "movie" | "series">("");
  const [status, setStatus] = useState<"" | "watchlist" | "watching" | "completed" | "dropped">("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [minRating, setMinRating] = useState<"" | number>("");

  const results = useMemo(() => {
    const needle = query.toLowerCase();

    return entries.filter((entry) => {
      const haystack = [entry.title, entry.genre, entry.review, entry.notes].filter(Boolean).join(" ").toLowerCase();
      const queryMatch = !needle.trim() || haystack.includes(needle);
      const typeMatch = !type || entry.type === type;
      const statusMatch = !status || entry.status === status;
      const favoriteMatch = !favoriteOnly || entry.isFavorite;
      const recommendedMatch = !recommendedOnly || entry.isRecommended;
      const ratingMatch = !minRating || (entry.rating ?? 0) >= Number(minRating);

      return queryMatch && typeMatch && statusMatch && favoriteMatch && recommendedMatch && ratingMatch;
    });
  }, [entries, query, type, status, favoriteOnly, recommendedOnly, minRating]);

  return (
    <main>
      <section className="stack">
        <div>
          <h1 className="screen-title">Search</h1>
          <p style={{ color: "var(--muted)", marginTop: "4px" }}>Find anything in your watch journal</p>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find in your personal library"
          className="soft-input"
        />

        <section className="card" style={{ padding: "10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "10px" }}>
            <button type="button" onClick={() => setType("")} style={{ ...segmentStyle, ...(type === "" ? segmentActiveStyle : {}) }}>
              All
            </button>
            <button type="button" onClick={() => setType("movie")} style={{ ...segmentStyle, ...(type === "movie" ? segmentActiveStyle : {}) }}>
              Film
            </button>
            <button type="button" onClick={() => setType("series")} style={{ ...segmentStyle, ...(type === "series" ? segmentActiveStyle : {}) }}>
              TV
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as "" | "watchlist" | "watching" | "completed" | "dropped")}
              style={filterStyle}
            >
              <option value="">All statuses</option>
              <option value="watchlist">Watchlist</option>
              <option value="watching">Watching</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
            </select>

            <select
              value={minRating}
              onChange={(event) => setMinRating(event.target.value ? Number(event.target.value) : "")}
              style={filterStyle}
            >
              <option value="">Any rating</option>
              <option value="3">3★ and up</option>
              <option value="4">4★ and up</option>
              <option value="5">5★ only</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setFavoriteOnly((value) => !value)}
              style={{ ...chipToggleStyle, ...(favoriteOnly ? chipToggleActiveStyle : {}) }}
            >
              ❤ Favourite
            </button>
            <button
              type="button"
              onClick={() => setRecommendedOnly((value) => !value)}
              style={{ ...chipToggleStyle, ...(recommendedOnly ? chipToggleActiveStyle : {}) }}
            >
              👍 Recommended
            </button>
          </div>
        </section>
      </section>

      <section className="card" style={{ padding: "14px" }}>
        <h2 className="section-title" style={{ marginBottom: "8px" }}>Results</h2>
        {!results.length ? <p style={{ color: "var(--muted)" }}>No matches for this search/filter combination yet.</p> : null}
        {results.map((entry) => (
          <Link
            key={entry.id}
            to={`/library/${entry.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              borderTop: "1px solid rgba(14,22,38,0.08)",
              padding: "12px 0"
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <MediaLogo type={entry.type} size="medium" tone={entry.type === "series" ? "purple" : "blue"} />
              <div>
                <p style={{ fontWeight: 650 }}>{entry.title}</p>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", textTransform: "capitalize" }}>
                  {entry.type} • {entry.status} • {entry.rating ? `${entry.rating}/5` : "No rating"}
                </p>
              </div>
            </div>
            <span style={{ color: "var(--muted)", fontSize: "1.3rem" }}>›</span>
          </Link>
        ))}
      </section>
    </main>
  );
}

const filterStyle: CSSProperties = {
  border: "1px solid var(--input-border)",
  borderRadius: "10px",
  background: "var(--input-bg)",
  color: "var(--fg)",
  padding: "10px"
};

const segmentStyle: CSSProperties = {
  border: "1px solid var(--input-border)",
  borderRadius: "999px",
  background: "var(--input-bg)",
  color: "var(--muted)",
  padding: "10px",
  fontWeight: 650,
  cursor: "pointer"
};

const segmentActiveStyle: CSSProperties = {
  background: "var(--accent)",
  color: "var(--text-inverse)",
  borderColor: "transparent"
};

const chipToggleStyle: CSSProperties = {
  border: "1px solid var(--input-border)",
  borderRadius: "999px",
  background: "var(--input-bg)",
  color: "var(--muted)",
  padding: "8px 12px",
  fontWeight: 600,
  cursor: "pointer"
};

const chipToggleActiveStyle: CSSProperties = {
  background: "rgba(10,132,255,0.16)",
  color: "#0a4f96",
  borderColor: "rgba(10,132,255,0.42)"
};
