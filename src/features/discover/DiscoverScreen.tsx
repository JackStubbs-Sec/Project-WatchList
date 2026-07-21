import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { SegmentedControl } from "../../components/SegmentedControl";
import { getTmdbTrending, searchTmdb } from "../../lib/tmdb";
import { useWatchStore } from "../../store/useWatchStore";
import type { TmdbSearchItem, WatchType } from "../../types/watch";

type TypeFilter = "both" | WatchType;

const DEBOUNCE_MS = 300;

export function DiscoverScreen() {
  const navigate = useNavigate();
  const entries = useWatchStore((state) => state.entries);
  const loadCustomLists = useWatchStore((state) => state.loadCustomLists);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("both");
  const [results, setResults] = useState<TmdbSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    void loadCustomLists();
  }, [loadCustomLists]);

  useEffect(() => {
    let cancelled = false;
    setError(undefined);

    async function run() {
      setLoading(true);
      try {
        let next: TmdbSearchItem[];
        if (query.trim()) {
          const all = await searchTmdb(query);
          next = typeFilter === "both" ? all : all.filter((item) => item.mediaType === typeFilter);
        } else if (typeFilter === "both") {
          const [movies, tv] = await Promise.all([getTmdbTrending("movie"), getTmdbTrending("tv")]);
          next = [...movies.slice(0, 10), ...tv.slice(0, 10)];
        } else {
          next = await getTmdbTrending(typeFilter);
        }
        if (!cancelled) setResults(next);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong talking to TMDB.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timer = window.setTimeout(run, query.trim() ? DEBOUNCE_MS : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, typeFilter]);

  const existingByTmdbId = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of entries) {
      if (typeof entry.tmdbId === "number") {
        map.set(`${entry.type}-${entry.tmdbId}`, entry.id);
      }
    }
    return map;
  }, [entries]);

  function onSelectResult(item: TmdbSearchItem) {
    const existingEntryId = existingByTmdbId.get(`${item.mediaType}-${item.tmdbId}`);
    if (existingEntryId) {
      navigate(`/library/${existingEntryId}`);
      return;
    }
    navigate(`/discover/${item.mediaType}/${item.tmdbId}`);
  }

  return (
    <main>
      <section className="stack">
        <div>
          <h1 className="screen-title">Discover</h1>
          <p style={{ color: "var(--muted)", marginTop: "4px" }}>Search TMDB or browse what&apos;s trending</p>
        </div>

        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search movies and TV shows" className="soft-input" />

        <SegmentedControl
          ariaLabel="Filter by type"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "both", label: "All" },
            { value: "movie", label: "Film" },
            { value: "tv", label: "TV" }
          ]}
        />
      </section>

      {error ? (
        <section className="card" style={{ borderColor: "rgba(255,112,112,0.4)" }}>
          <p style={{ color: "var(--danger)" }}>{error}</p>
        </section>
      ) : null}

      <section className="card" style={{ padding: "11px" }}>
        <h2 className="section-title" style={{ marginBottom: "6px" }}>{query.trim() ? "Results" : "Trending"}</h2>
        {loading ? <p style={{ color: "var(--muted)" }}>Loading...</p> : null}
        {!loading && !results.length ? <p style={{ color: "var(--muted)" }}>No matches yet.</p> : null}
        <div style={resultsGridStyle}>
          {results.map((item) => {
            const alreadyAdded = existingByTmdbId.has(`${item.mediaType}-${item.tmdbId}`);
            return (
              <button key={`${item.mediaType}-${item.tmdbId}`} type="button" onClick={() => onSelectResult(item)} style={resultCardStyle}>
                <div style={resultPosterWrapStyle}>
                  {item.posterUrl ? (
                    <img src={item.posterUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>No image</span>
                  )}
                  {alreadyAdded ? <span style={inLibraryBadgeStyle}>In library</span> : null}
                </div>
                <p style={resultTitleStyle}>{item.title}</p>
                <p style={{ color: "var(--muted)", fontSize: "0.68rem" }}>
                  {item.mediaType === "tv" ? "TV" : "Film"}
                  {item.year ? ` • ${item.year}` : ""}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}

const resultsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(92px, 1fr))",
  gap: "9px"
};

const resultCardStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  border: "none",
  background: "transparent",
  color: "var(--fg)",
  padding: 0,
  textAlign: "left",
  minHeight: "unset"
};

const resultPosterWrapStyle: CSSProperties = {
  position: "relative",
  aspectRatio: "2 / 3",
  borderRadius: "12px",
  overflow: "hidden",
  background: "var(--input-bg)",
  border: "1px solid var(--card-border)",
  display: "grid",
  placeItems: "center"
};

const inLibraryBadgeStyle: CSSProperties = {
  position: "absolute",
  bottom: "6px",
  left: "6px",
  right: "6px",
  textAlign: "center",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--accent) 88%, black)",
  color: "#fff",
  fontSize: "0.68rem",
  fontWeight: 700,
  padding: "3px 6px"
};

const resultTitleStyle: CSSProperties = {
  fontSize: "0.76rem",
  fontWeight: 700,
  lineHeight: 1.2,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden"
};

