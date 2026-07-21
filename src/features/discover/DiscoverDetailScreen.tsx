import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AvailableOn } from "../../components/AvailableOn";
import { MediaLogo } from "../../components/icons";
import { getRegion } from "../../lib/region";
import { getTmdbSimilar, getTmdbTitleDetail, getWatchProviders, type WatchProviders } from "../../lib/tmdb";
import { useWatchStore } from "../../store/useWatchStore";
import type { TmdbSearchItem, TmdbTitleDetail, WatchStatus, WatchType } from "../../types/watch";

export function DiscoverDetailScreen() {
  const { mediaType, tmdbId } = useParams<{ mediaType: string; tmdbId: string }>();
  const navigate = useNavigate();
  const entries = useWatchStore((state) => state.entries);
  const customLists = useWatchStore((state) => state.customLists);
  const loadCustomLists = useWatchStore((state) => state.loadCustomLists);
  const upsertEntry = useWatchStore((state) => state.upsertEntry);
  const assignListsToTitle = useWatchStore((state) => state.assignListsToTitle);

  const parsedMediaType: WatchType | undefined = mediaType === "movie" || mediaType === "tv" ? mediaType : undefined;
  const parsedTmdbId = tmdbId ? Number(tmdbId) : NaN;

  const [detail, setDetail] = useState<TmdbTitleDetail | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [similar, setSimilar] = useState<TmdbSearchItem[]>([]);
  const [providers, setProviders] = useState<WatchProviders | undefined>(undefined);
  const [providersLoading, setProvidersLoading] = useState(false);

  const [status, setStatus] = useState<WatchStatus>("want_to_watch");
  const [rating, setRating] = useState("");
  const [notes, setNotes] = useState("");
  const [listIds, setListIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadCustomLists();
  }, [loadCustomLists]);

  const existingEntryId = useMemo(() => {
    if (!parsedMediaType || !Number.isFinite(parsedTmdbId)) return undefined;
    return entries.find((entry) => entry.tmdbId === parsedTmdbId && entry.type === parsedMediaType)?.id;
  }, [entries, parsedMediaType, parsedTmdbId]);

  useEffect(() => {
    if (existingEntryId) {
      navigate(`/library/${existingEntryId}`, { replace: true });
    }
  }, [existingEntryId, navigate]);

  useEffect(() => {
    if (!parsedMediaType || !Number.isFinite(parsedTmdbId)) {
      setError("Title not found.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(undefined);

    getTmdbTitleDetail(parsedTmdbId, parsedMediaType)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load details from TMDB.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    getTmdbSimilar(parsedTmdbId, parsedMediaType)
      .then((result) => {
        if (!cancelled) setSimilar(result);
      })
      .catch(() => {
        if (!cancelled) setSimilar([]);
      });

    setProvidersLoading(true);
    getWatchProviders(parsedTmdbId, parsedMediaType, getRegion())
      .then((result) => {
        if (!cancelled) setProviders(result);
      })
      .catch(() => {
        if (!cancelled) setProviders(undefined);
      })
      .finally(() => {
        if (!cancelled) setProvidersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [parsedMediaType, parsedTmdbId]);

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/discover");
  }

  function toggleList(listId: string) {
    setListIds((current) => (current.includes(listId) ? current.filter((id) => id !== listId) : [...current, listId]));
  }

  async function onAdd() {
    if (!detail) return;
    setSaving(true);
    try {
      const parsedRating = Number(rating);
      const entryId = await upsertEntry({
        title: detail,
        status,
        rating: rating.trim() && Number.isFinite(parsedRating) ? parsedRating : undefined,
        notes: notes.trim() || undefined
      });
      if (listIds.length) {
        const titleId = `tmdb-${detail.mediaType}-${detail.tmdbId}`;
        await assignListsToTitle(titleId, listIds);
      }
      navigate(`/library/${entryId}`);
    } finally {
      setSaving(false);
    }
  }

  if (existingEntryId) {
    return null;
  }

  if (loading) {
    return (
      <main>
        <section className="row" style={{ marginBottom: "4px" }}>
          <button type="button" aria-label="Go back" onClick={goBack} className="icon-btn">
            ←
          </button>
        </section>
        <p style={{ color: "var(--muted)" }}>Loading details...</p>
      </main>
    );
  }

  if (error || !detail) {
    return (
      <main>
        <section className="row" style={{ marginBottom: "4px" }}>
          <button type="button" aria-label="Go back" onClick={goBack} className="icon-btn">
            ←
          </button>
        </section>
        <section className="card">
          <p style={{ color: "var(--danger)" }}>{error ?? "Title not found."}</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="row" style={{ marginBottom: "4px" }}>
        <button type="button" aria-label="Go back" onClick={goBack} className="icon-btn">
          ←
        </button>
      </section>

      <section style={{ display: "grid", placeItems: "center", textAlign: "center", gap: "8px", marginTop: "2px" }}>
        {detail.posterUrl ? (
          <img src={detail.posterUrl} alt="" style={{ width: "112px", borderRadius: "var(--radius-m)", boxShadow: "var(--shadow)" }} />
        ) : (
          <MediaLogo type={detail.mediaType} size="large" tone={detail.mediaType === "tv" ? "purple" : "red"} />
        )}
        <h1 style={{ fontSize: "1.5rem", lineHeight: 1.2, margin: 0 }}>{detail.title}</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.86rem" }}>
          {detail.mediaType === "movie" ? "Movie" : "TV Series"}
          {detail.year ? ` • ${detail.year}` : ""}
        </p>
        {detail.genres.length ? <p style={{ color: "var(--muted)", fontSize: "0.86rem" }}>{detail.genres.join(", ")}</p> : null}
      </section>

      <section className="card" style={{ padding: "0", overflow: "hidden" }}>
        {detail.synopsis ? <InfoRow label="Synopsis" value={detail.synopsis} multiline /> : null}
        {detail.directorOrCreator ? (
          <InfoRow label={detail.mediaType === "movie" ? "Director" : "Creator"} value={detail.directorOrCreator} divider />
        ) : null}
        {detail.cast.length ? <InfoRow label="Cast" value={detail.cast.join(", ")} divider multiline /> : null}
        {detail.mediaType === "movie" && detail.runtimeMinutes ? <InfoRow label="Runtime" value={`${detail.runtimeMinutes} min`} divider /> : null}
        {detail.mediaType === "tv" && detail.totalEpisodes ? <InfoRow label="Episodes" value={`${detail.totalEpisodes}`} divider /> : null}
      </section>

      <section className="stack">
        <h2 className="section-title" style={{ marginBottom: 0 }}>Available on</h2>
        <AvailableOn providers={providers} loading={providersLoading} />
      </section>

      {similar.length ? (
        <section className="stack">
          <h2 className="section-title" style={{ marginBottom: 0 }}>More like this</h2>
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "2px" }}>
            {similar.slice(0, 8).map((item) => (
              <div key={`${item.mediaType}-${item.tmdbId}`} style={{ flex: "0 0 76px", display: "grid", gap: "4px" }}>
                <div style={{ width: "76px", height: "114px", borderRadius: "8px", overflow: "hidden", background: "var(--input-bg)" }}>
                  {item.posterUrl ? <img src={item.posterUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                </div>
                <p style={{ fontSize: "0.7rem", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {item.title}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="card" style={{ display: "grid", gap: "10px" }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>Add to your watchlist</h2>

        <div>
          <p style={fieldLabelStyle}>Status</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
            {[
              { id: "want_to_watch" as const, label: "🔖 Want to Watch" },
              { id: "watching" as const, label: "▶ Watching" },
              { id: "watched" as const, label: "✓ Watched" }
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setStatus(option.id)}
                className={`chip${status === option.id ? " active" : ""}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label>
          <span style={fieldLabelStyle}>Rating (optional)</span>
          <input value={rating} onChange={(event) => setRating(event.target.value)} inputMode="decimal" placeholder="4.5" style={inputStyle} />
        </label>

        <label>
          <span style={fieldLabelStyle}>Notes (optional)</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} style={inputStyle} />
        </label>

        {customLists.length ? (
          <div>
            <p style={fieldLabelStyle}>Add to lists</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
              {customLists.map((list) => (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => toggleList(list.id)}
                  className={`chip${listIds.includes(list.id) ? " active" : ""}`}
                >
                  {list.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <button type="button" disabled={saving} onClick={() => void onAdd()} className="btn btn-primary btn-block">
        {saving ? "Adding..." : "Add to Watchlist"}
      </button>
    </main>
  );
}

function InfoRow({ label, value, divider, multiline }: { label: string; value: string; divider?: boolean; multiline?: boolean }) {
  return (
    <div style={{ padding: "10px 12px", borderBottom: divider ? "1px solid var(--divider)" : "none", fontSize: "0.86rem" }}>
      <div style={{ display: "grid", gap: "4px" }}>
        <span style={{ color: "var(--text-strong)", fontWeight: 600 }}>{label}</span>
        <span style={{ color: "var(--muted)", lineHeight: multiline ? 1.4 : undefined }}>{value}</span>
      </div>
    </div>
  );
}

const fieldLabelStyle: CSSProperties = {
  color: "var(--text-strong)",
  fontSize: "0.78rem",
  fontWeight: 600
};

const inputStyle: CSSProperties = {
  marginTop: "5px",
  width: "100%",
  padding: "9px",
  borderRadius: "10px",
  border: "1px solid var(--input-border)",
  background: "var(--input-bg)",
  color: "var(--fg)",
  fontSize: "16px"
};
