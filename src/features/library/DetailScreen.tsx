import { useMemo, useState, type CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EntryEditor } from "../../components/EntryEditor";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { MediaLogo, PlatformLogo, platformLabel } from "../../components/icons";
import type { EntryEditorValue } from "../../components/EntryEditor";
import { useWatchStore } from "../../store/useWatchStore";
import { streamingPlatforms, type StreamingPlatform, type WatchEntry, type WatchStatus, type WatchType } from "../../types/watch";

export function DetailScreen() {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const entries = useWatchStore((state) => state.entries);
  const updateEntry = useWatchStore((state) => state.updateEntry);
  const removeEntry = useWatchStore((state) => state.removeEntry);
  const [editing, setEditing] = useState(false);
  const [useRecoveryEditor, setUseRecoveryEditor] = useState(false);
  const [editAttempt, setEditAttempt] = useState(0);

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

  async function onSave(value: EntryEditorValue) {
    await updateEntry(currentEntry.id, {
      ...value,
      updatedAt: new Date().toISOString()
    });
    setEditing(false);
  }

  async function onDelete() {
    const accepted = confirm("Delete this title from your journal?");
    if (!accepted) return;
    await removeEntry(currentEntry.id);
    navigate("/library");
  }

  async function onToggleWatching() {
    const now = new Date().toISOString();
    const nextStatus = currentEntry.status === "watching" ? "watchlist" : "watching";
    await updateEntry(currentEntry.id, {
      status: nextStatus,
      lastWatchedAt: nextStatus === "watching" ? now : undefined,
      updatedAt: now
    });
  }

  return (
    <main>
      <section className="row" style={{ marginBottom: "4px" }}>
        <button
          type="button"
          aria-label="Go back"
          onClick={goBack}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "999px",
            border: "1px solid rgba(14,22,38,0.15)",
            background: "transparent",
            color: "var(--muted)",
            fontSize: "1.1rem",
            cursor: "pointer"
          }}
        >
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
          <section style={{ display: "grid", placeItems: "center", textAlign: "center", gap: "10px", marginTop: "2px" }}>
            <MediaLogo type={entry.type} size="large" tone={entry.type === "series" ? "purple" : "red"} />
            <h1 style={{ fontSize: "3rem", lineHeight: 1.1, margin: 0 }}>{entry.title}</h1>
            <p style={{ color: "var(--muted)", fontSize: "1.15rem" }}>{entry.type === "movie" ? "Movie" : "TV Series"}</p>
            {entry.platform ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                <PlatformLogo platform={entry.platform} compact />
                <span style={{ color: "var(--text-strong)", fontWeight: 650 }}>{platformLabel(entry.platform)}</span>
              </div>
            ) : null}
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            <Link to={`/library/${entry.id}/review`} className="card" style={{ padding: "10px", textAlign: "center" }}>
              <p style={{ color: "#0a84ff", letterSpacing: "1px" }}>{ratingToStars(entry.rating)}</p>
              <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginTop: "5px" }}>Your Rating</p>
            </Link>
            <Link to={`/library/${entry.id}/review`} className="card" style={{ padding: "10px", textAlign: "center" }}>
              <p style={{ fontSize: "1.15rem" }}>❤</p>
              <p style={{ color: entry.isFavorite ? "#f25769" : "var(--muted)", fontSize: "0.95rem", marginTop: "5px" }}>Favourite</p>
            </Link>
            <Link to={`/library/${entry.id}/review`} className="card" style={{ padding: "10px", textAlign: "center" }}>
              <p style={{ fontSize: "1.15rem" }}>👍</p>
              <p style={{ color: entry.isRecommended ? "#e8ba31" : "var(--muted)", fontSize: "0.95rem", marginTop: "5px" }}>Recommend</p>
            </Link>
          </section>

          <section className="card" style={{ padding: "0", overflow: "hidden" }}>
            <InfoRow icon="bookmark" label="Status" value={capitalize(entry.status)} accent={entry.status === "watchlist" ? "#e94e55" : undefined} />
            <InfoRow icon="calendar" label="Date Added" value={formatDate(entry.createdAt)} divider />
            {entry.type === "series" ? (
              <InfoRow
                icon="tv"
                label="Progress"
                value={`Season ${entry.season ?? "-"}${entry.totalSeasons ? ` of ${entry.totalSeasons}` : ""} • Episode ${entry.episode ?? "-"}`}
                divider
              />
            ) : null}
            <InfoRow icon="note" label="Notes" value={entry.notes || "No notes yet"} multiline />
          </section>
        </>
      )}

      {!editing ? (
        <section style={{ marginTop: "4px" }}>
          <button
            type="button"
            onClick={() => void onToggleWatching()}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "999px",
              padding: "14px",
              background: "var(--accent)",
              color: "var(--text-inverse)",
              fontWeight: 700,
              marginBottom: "10px"
            }}
          >
            {entry.status === "watching" ? "Mark as Watchlist" : "Mark as Watching"}
          </button>
          <button
            type="button"
            onClick={() => void onDelete()}
            style={{
              width: "100%",
              border: "1px solid #7e3e3e",
              borderRadius: "999px",
              padding: "12px",
              background: "#2b1515",
              color: "#ffc6c6"
            }}
          >
            Delete Title
          </button>
        </section>
      ) : null}
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
    <div style={{ padding: "14px 16px", borderBottom: divider ? "1px solid var(--divider)" : "none" }}>
      <div className="row" style={{ alignItems: multiline ? "flex-start" : "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-strong)" }}>
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
  const [title, setTitle] = useState(entry.title);
  const [type, setType] = useState<WatchType>(entry.type === "series" ? "series" : "movie");
  const [status, setStatus] = useState<WatchStatus>(entry.status);
  const [genre, setGenre] = useState(entry.genre ?? "");
  const [platform, setPlatform] = useState<StreamingPlatform | "">(entry.platform ?? "");
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <section className="card" style={{ display: "grid", gap: "12px" }}>
      <div style={{ display: "grid", gap: "4px" }}>
        <h2 style={{ fontSize: "1.2rem" }}>Recovered editor</h2>
        <p style={{ color: "var(--muted)" }}>The full editor failed, so a safe fallback editor is shown for this item.</p>
      </div>

      <label style={fieldBlockStyle}>
        <span style={fieldLabelStyle}>Title</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} style={fieldInputStyle} />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <label style={fieldBlockStyle}>
          <span style={fieldLabelStyle}>Type</span>
          <select value={type} onChange={(event) => setType(event.target.value as WatchType)} style={fieldInputStyle}>
            <option value="movie">Movie</option>
            <option value="series">TV Series</option>
          </select>
        </label>
        <label style={fieldBlockStyle}>
          <span style={fieldLabelStyle}>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as WatchStatus)} style={fieldInputStyle}>
            <option value="watchlist">Watchlist</option>
            <option value="watching">Watching</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
          </select>
        </label>
      </div>

      <label style={fieldBlockStyle}>
        <span style={fieldLabelStyle}>Genre</span>
        <input value={genre} onChange={(event) => setGenre(event.target.value)} style={fieldInputStyle} />
      </label>

      <label style={fieldBlockStyle}>
        <span style={fieldLabelStyle}>Streaming Service</span>
        <select value={platform} onChange={(event) => setPlatform(event.target.value as StreamingPlatform | "")} style={fieldInputStyle}>
          <option value="">Not set</option>
          {streamingPlatforms.map((item) => (
            <option key={item} value={item}>
              {platformLabel(item)}
            </option>
          ))}
        </select>
      </label>

      <label style={fieldBlockStyle}>
        <span style={fieldLabelStyle}>Notes</span>
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} style={fieldInputStyle} />
      </label>

      <div style={{ display: "grid", gap: "8px" }}>
        <button
          type="button"
          disabled={saving || !title.trim()}
          onClick={async () => {
            setSaving(true);
            try {
              await onSubmit({
                title: title.trim(),
                type,
                status,
                genre: genre.trim(),
                platform: platform || undefined,
                totalSeasons: type === "series" ? entry.totalSeasons : undefined,
                season: type === "series" ? entry.season : undefined,
                episode: type === "series" ? entry.episode : undefined,
                isFavorite: Boolean(entry.isFavorite),
                isRecommended: Boolean(entry.isRecommended),
                rating: entry.rating,
                review: entry.review,
                notes: notes.trim() || undefined,
                seriesLength: type === "series" ? entry.seriesLength : undefined,
                lastWatchedAt: entry.lastWatchedAt
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
  fontSize: "0.83rem",
  fontWeight: 600
};

const fieldInputStyle: CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid var(--input-border)",
  background: "var(--input-bg)",
  color: "var(--fg)"
};

const primaryActionStyle: CSSProperties = {
  borderRadius: "999px",
  border: "none",
  padding: "12px",
  background: "var(--accent)",
  color: "var(--text-inverse)",
  fontWeight: 700
};

const secondaryActionStyle: CSSProperties = {
  borderRadius: "10px",
  border: "1px solid var(--input-border)",
  padding: "10px",
  background: "var(--input-bg)",
  color: "var(--fg)",
  fontWeight: 650,
  cursor: "pointer"
};
