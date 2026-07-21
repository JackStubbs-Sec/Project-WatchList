import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AvailableOn } from "../../components/AvailableOn";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EntryEditor } from "../../components/EntryEditor";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { MediaLogo } from "../../components/icons";
import type { EntryEditorValue } from "../../components/EntryEditor";
import { useWatchStore } from "../../store/useWatchStore";
import { isFavorite, isRecommended, withTag } from "../../lib/entryTags";
import { getRegion } from "../../lib/region";
import { getTmdbSimilar, getWatchProviders, type WatchProviders } from "../../lib/tmdb";
import type { TmdbSearchItem, WatchEntry, WatchStatus } from "../../types/watch";

export function DetailScreen() {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const entries = useWatchStore((state) => state.entries);
  const updateEntry = useWatchStore((state) => state.updateEntry);
  const removeEntry = useWatchStore((state) => state.removeEntry);
  const addWatch = useWatchStore((state) => state.addWatch);
  const [editing, setEditing] = useState(false);
  const [useRecoveryEditor, setUseRecoveryEditor] = useState(false);
  const [editAttempt, setEditAttempt] = useState(0);
  const [similar, setSimilar] = useState<TmdbSearchItem[]>([]);
  const [providers, setProviders] = useState<WatchProviders | undefined>(undefined);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function enterEditMode() {
    setUseRecoveryEditor(false);
    setEditAttempt((prev) => prev + 1);
    setEditing(true);
  }

  function exitEditMode() {
    setEditing(false);
    setUseRecoveryEditor(false);
  }

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/library");
  }

  const entry = useMemo(() => entries.find((item) => item.id === entryId), [entries, entryId]);
  const tmdbId = entry?.tmdbId;
  const mediaType = entry?.type;

  useEffect(() => {
    if (typeof tmdbId !== "number" || !mediaType) {
      setSimilar([]);
      setProviders(undefined);
      return;
    }

    let cancelled = false;
    getTmdbSimilar(tmdbId, mediaType)
      .then((result) => {
        if (!cancelled) setSimilar(result);
      })
      .catch(() => {
        if (!cancelled) setSimilar([]);
      });

    setProvidersLoading(true);
    getWatchProviders(tmdbId, mediaType, getRegion())
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
  }, [tmdbId, mediaType]);

  if (!entry) {
    return (
      <main>
        <section className="card">
          <h1 style={{ fontSize: "1.5rem", marginBottom: "var(--space-3)" }}>Title not found</h1>
          <p style={{ color: "var(--muted)", marginBottom: "var(--space-4)" }}>
            This entry might have been deleted.
          </p>
          <Link to="/library" className="chip">
            Back to Library
          </Link>
        </section>
      </main>
    );
  }

  const currentEntry = entry;
  const watchedEpisodes = currentEntry.episodeProgress.filter((row) => row.watched).length;

  async function onSave(value: EntryEditorValue) {
    await updateEntry(currentEntry.id, {
      ...value,
      updatedAt: new Date().toISOString()
    });
    setEditing(false);
  }

  async function onDelete() {
    await removeEntry(currentEntry.id);
    navigate("/library");
  }

  async function onToggleWatching() {
    const nextStatus: WatchStatus = currentEntry.status === "watching" ? "want_to_watch" : "watching";
    await updateEntry(currentEntry.id, {
      status: nextStatus,
      updatedAt: new Date().toISOString()
    });
  }

  async function onMarkWatched() {
    const now = new Date().toISOString();
    await addWatch(currentEntry.id, now);
    await updateEntry(currentEntry.id, { status: "watched", updatedAt: now });
  }

  async function onToggleFavorite() {
    await updateEntry(currentEntry.id, {
      tags: withTag(currentEntry.tags, "favorite", !isFavorite(currentEntry)),
      updatedAt: new Date().toISOString()
    });
  }

  async function onToggleRecommended() {
    await updateEntry(currentEntry.id, {
      tags: withTag(currentEntry.tags, "recommended", !isRecommended(currentEntry)),
      updatedAt: new Date().toISOString()
    });
  }

  return (
    <main>
      <section className="row" style={{ marginBottom: "4px" }}>
        <button type="button" aria-label="Go back" onClick={goBack} className="icon-btn">
          ←
        </button>
        <button
          type="button"
          onClick={() => {
            if (editing) {
              exitEditMode();
              return;
            }
            enterEditMode();
          }}
          style={{ background: "transparent", border: "none", color: "var(--accent)", fontWeight: 650, cursor: "pointer" }}
        >
          {editing ? "Done" : "Edit"}
        </button>
      </section>

      {editing ? (
        useRecoveryEditor ? (
          <FallbackEditor
            entry={currentEntry}
            onCancel={exitEditMode}
            onSubmit={async (value) => {
              await onSave(value);
            }}
          />
        ) : (
          <ErrorBoundary
            resetKey={`${entry.id}-${editAttempt}`}
            fallback={
              <EditorRecoveryPrompt
                onRetry={() => setEditAttempt((prev) => prev + 1)}
                onUseRecovery={() => setUseRecoveryEditor(true)}
                onCancel={exitEditMode}
              />
            }
          >
            <EntryEditor initial={entry} submitLabel="Save Changes" onSubmit={onSave} />
          </ErrorBoundary>
        )
      ) : (
        <>
          <section style={{ display: "grid", placeItems: "center", textAlign: "center", gap: "8px", marginTop: "2px" }}>
            {entry.posterUrl ? (
              <img src={entry.posterUrl} alt="" style={{ width: "112px", borderRadius: "var(--radius-m)", boxShadow: "var(--shadow)" }} />
            ) : (
              <MediaLogo type={entry.type} size="large" tone={entry.type === "tv" ? "purple" : "red"} />
            )}
            <h1 style={{ fontSize: "1.5rem", lineHeight: 1.2, margin: 0 }}>{entry.title}</h1>
            <p style={{ color: "var(--muted)", fontSize: "0.86rem" }}>
              {entry.type === "movie" ? "Movie" : "TV Series"}
              {entry.year ? ` • ${entry.year}` : ""}
            </p>
            {entry.genres.length ? <p style={{ color: "var(--muted)", fontSize: "0.86rem" }}>{entry.genres.join(", ")}</p> : null}
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            <Link to={`/library/${entry.id}/review`} className="card" style={{ padding: "8px", textAlign: "center" }}>
              <p style={{ color: "var(--accent-secondary)", letterSpacing: "1px", fontSize: "0.85rem" }}>{ratingToStars(entry.rating)}</p>
              <p style={{ color: "var(--muted)", fontSize: "0.74rem", marginTop: "4px" }}>Your Rating</p>
            </Link>
            <button type="button" onClick={() => void onToggleFavorite()} className="card" style={{ padding: "8px", textAlign: "center", border: "1px solid var(--card-border)" }}>
              <p style={{ fontSize: "0.95rem" }}>❤</p>
              <p style={{ color: isFavorite(entry) ? "#f25769" : "var(--muted)", fontSize: "0.74rem", marginTop: "4px" }}>Favourite</p>
            </button>
            <button type="button" onClick={() => void onToggleRecommended()} className="card" style={{ padding: "8px", textAlign: "center", border: "1px solid var(--card-border)" }}>
              <p style={{ fontSize: "0.95rem" }}>👍</p>
              <p style={{ color: isRecommended(entry) ? "#e8ba31" : "var(--muted)", fontSize: "0.74rem", marginTop: "4px" }}>Recommend</p>
            </button>
          </section>

          <section className="card" style={{ padding: "0", overflow: "hidden" }}>
            <InfoRow icon="bookmark" label="Status" value={capitalize(entry.status.replaceAll("_", " "))} accent={entry.status === "want_to_watch" ? "var(--danger)" : undefined} />
            <InfoRow icon="calendar" label="Date Added" value={formatDate(entry.createdAt)} divider />
            {entry.type === "tv" ? (
              <InfoRow
                icon="tv"
                label="Progress"
                value={entry.totalEpisodes ? `${watchedEpisodes} of ${entry.totalEpisodes} episodes` : `${watchedEpisodes} episodes watched`}
                divider
              />
            ) : null}
            <InfoRow icon="note" label="Notes" value={entry.notes || "No notes yet"} multiline />
          </section>

          {entry.type === "tv" ? (
            <Link to={`/library/${entry.id}/episodes`} className="btn btn-secondary btn-block">
              📺 Track Episodes
            </Link>
          ) : null}

          {typeof entry.tmdbId === "number" ? (
            <section className="stack">
              <h2 className="section-title" style={{ marginBottom: 0 }}>Available on</h2>
              <AvailableOn providers={providers} loading={providersLoading} />
            </section>
          ) : null}

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
        </>
      )}

      {!editing ? (
        <section style={{ marginTop: "4px" }}>
          <button
            type="button"
            onClick={() => void onToggleWatching()}
            className="btn btn-primary btn-block"
            style={{ marginBottom: "10px" }}
          >
            {currentEntry.status === "watching" ? "Move to Want to Watch" : "Mark as Watching"}
          </button>
          {currentEntry.status !== "watched" ? (
            <button
              type="button"
              onClick={() => void onMarkWatched()}
              className="btn btn-secondary btn-block"
              style={{ marginBottom: "10px" }}
            >
              Mark as Watched
            </button>
          ) : null}
          <button type="button" onClick={() => setConfirmingDelete(true)} className="btn btn-destructive btn-block">
            Delete Title
          </button>
        </section>
      ) : null}

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this title?"
        message={`"${currentEntry.title}" will be removed from your journal. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setConfirmingDelete(false);
          void onDelete();
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </main>
  );
}

function InfoRow({
  icon,
  label,
  value,
  accent,
  divider,
  multiline
}: {
  icon: "bookmark" | "calendar" | "note" | "tv";
  label: string;
  value: string;
  accent?: string;
  divider?: boolean;
  multiline?: boolean;
}) {
  return (
    <div style={{ padding: "10px 12px", borderBottom: divider ? "1px solid var(--divider)" : "none", fontSize: "0.86rem" }}>
      <div className="row" style={{ alignItems: multiline ? "flex-start" : "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-strong)" }}>
          <InlineIcon type={icon} />
          <span>{label}</span>
        </div>
        <span style={{ color: accent ?? (multiline ? "var(--muted)" : "var(--text-strong)"), fontWeight: accent ? 700 : 500, textAlign: "right" }}>{value}</span>
      </div>
    </div>
  );
}

function InlineIcon({ type }: { type: "bookmark" | "calendar" | "note" | "tv" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {type === "bookmark" ? <path d="M7 4h10v16l-5-3-5 3V4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /> : null}
      {type === "calendar" ? (
        <>
          <rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 3.5v4M16 3.5v4M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : null}
      {type === "note" ? (
        <>
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : null}
      {type === "tv" ? (
        <>
          <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9.5 21h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : null}
    </svg>
  );
}

function ratingToStars(rating?: number) {
  if (!rating) return "☆☆☆☆☆";
  const rounded = Math.round(rating);
  return `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}`;
}

function formatDate(isoDate: string) {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function FallbackEditor({
  entry,
  onCancel,
  onSubmit
}: {
  entry: WatchEntry;
  onCancel: () => void;
  onSubmit: (value: EntryEditorValue) => Promise<void>;
}) {
  const [status, setStatus] = useState<WatchStatus>(entry.status);
  const [rating, setRating] = useState<string>(entry.rating ? String(entry.rating) : "");
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <section className="card" style={{ display: "grid", gap: "12px" }}>
      <div style={{ display: "grid", gap: "4px" }}>
        <h2 style={{ fontSize: "1.2rem" }}>Recovered editor</h2>
        <p style={{ color: "var(--muted)" }}>The full editor failed, so a safe fallback editor is shown for this item.</p>
      </div>

      <label style={fieldBlockStyle}>
        <span style={fieldLabelStyle}>Status</span>
        <select value={status} onChange={(event) => setStatus(event.target.value as WatchStatus)} style={fieldInputStyle}>
          <option value="want_to_watch">Want to Watch</option>
          <option value="watching">Watching</option>
          <option value="watched">Watched</option>
        </select>
      </label>

      <label style={fieldBlockStyle}>
        <span style={fieldLabelStyle}>Rating (0.5 to 5.0)</span>
        <input value={rating} onChange={(event) => setRating(event.target.value)} inputMode="decimal" style={fieldInputStyle} />
      </label>

      <label style={fieldBlockStyle}>
        <span style={fieldLabelStyle}>Notes</span>
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} style={fieldInputStyle} />
      </label>

      <div style={{ display: "grid", gap: "8px" }}>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              const parsedRating = Number(rating);
              await onSubmit({
                status,
                rating: rating.trim() && Number.isFinite(parsedRating) ? parsedRating : undefined,
                notes: notes.trim() || undefined,
                tags: entry.tags
              });
            } finally {
              setSaving(false);
            }
          }}
          style={primaryActionStyle}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button type="button" onClick={onCancel} style={secondaryActionStyle}>
          Back to Details
        </button>
      </div>
    </section>
  );
}

function EditorRecoveryPrompt({ onRetry, onUseRecovery, onCancel }: { onRetry: () => void; onUseRecovery: () => void; onCancel: () => void }) {
  return (
    <section className="card" style={{ display: "grid", gap: "12px" }}>
      <div style={{ display: "grid", gap: "4px" }}>
        <h2 style={{ fontSize: "1.2rem" }}>Editor error</h2>
        <p style={{ color: "var(--muted)" }}>The full editor hit an error for this item. You can retry it, or open the recovery editor.</p>
      </div>
      <button type="button" onClick={onRetry} style={primaryActionStyle}>
        Try full editor again
      </button>
      <button type="button" onClick={onUseRecovery} style={secondaryActionStyle}>
        Open recovery editor
      </button>
      <button type="button" onClick={onCancel} style={secondaryActionStyle}>
        Cancel
      </button>
    </section>
  );
}

const fieldBlockStyle: CSSProperties = {
  display: "grid",
  gap: "6px"
};

const fieldLabelStyle: CSSProperties = {
  color: "var(--text-strong)",
  fontSize: "0.78rem",
  fontWeight: 600
};

const fieldInputStyle: CSSProperties = {
  width: "100%",
  padding: "9px",
  borderRadius: "10px",
  border: "1px solid var(--input-border)",
  background: "var(--input-bg)",
  color: "var(--fg)",
  fontSize: "0.88rem"
};

const primaryActionStyle: CSSProperties = {
  borderRadius: "999px",
  border: "none",
  padding: "10px",
  background: "var(--accent)",
  color: "var(--text-inverse)",
  fontWeight: 700
};

const secondaryActionStyle: CSSProperties = {
  borderRadius: "10px",
  border: "1px solid var(--input-border)",
  padding: "9px",
  background: "var(--input-bg)",
  color: "var(--fg)",
  fontWeight: 650,
  cursor: "pointer"
};
