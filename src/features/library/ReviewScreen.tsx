import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MediaLogo } from "../../components/icons";
import { SegmentedControl } from "../../components/SegmentedControl";
import { useWatchStore } from "../../store/useWatchStore";
import { isFavorite, isRecommended, withTag } from "../../lib/entryTags";

const MAX_NOTES_CHARS = 500;

export function ReviewScreen() {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const entries = useWatchStore((state) => state.entries);
  const updateEntry = useWatchStore((state) => state.updateEntry);

  const entry = useMemo(() => entries.find((item) => item.id === entryId), [entries, entryId]);

  const [rating, setRating] = useState<number>(entry?.rating ? Math.round(entry.rating) : 0);
  const [recommended, setRecommended] = useState<boolean>(entry ? isRecommended(entry) : true);
  const [favorite, setFavorite] = useState<boolean>(entry ? isFavorite(entry) : true);
  const [notes, setNotes] = useState(entry?.notes ?? "");

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/library");
  }

  if (!entry) {
    return (
      <main>
        <section className="card">
          <h1 style={{ fontSize: "1.5rem", marginBottom: "var(--space-3)" }}>Title not found</h1>
          <button type="button" className="chip" onClick={() => navigate("/library")}>
            Back to Library
          </button>
        </section>
      </main>
    );
  }

  const currentEntry = entry;

  async function onSave() {
    let tags = withTag(currentEntry.tags, "recommended", recommended);
    tags = withTag(tags, "favorite", favorite);

    await updateEntry(currentEntry.id, {
      rating: rating > 0 ? rating : undefined,
      tags,
      notes: notes.trim() ? notes.trim() : undefined,
      updatedAt: new Date().toISOString()
    });
    navigate(`/library/${currentEntry.id}`);
  }

  return (
    <main>
      <section className="row">
        <button type="button" aria-label="Close review" onClick={goBack} className="icon-btn">
          ✕
        </button>
        <button
          type="button"
          onClick={() => void onSave()}
          style={{ background: "transparent", border: "none", color: "var(--accent)", fontWeight: 700, cursor: "pointer" }}
        >
          Save
        </button>
      </section>

      <section style={{ display: "grid", gap: "4px" }}>
        <h1 className="screen-title" style={{ marginBottom: 0 }}>Review</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>How was it?</p>
      </section>

      <section style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <MediaLogo type={currentEntry.type} size="small" tone={currentEntry.type === "tv" ? "purple" : "red"} />
        <div>
          <p style={{ fontSize: "1.4rem", fontWeight: 700, lineHeight: 1.1 }}>{currentEntry.title}</p>
          <p style={{ color: "var(--muted)", marginTop: "3px", fontSize: "0.82rem" }}>{currentEntry.type === "movie" ? "Movie" : "TV Series"}</p>
        </div>
      </section>

      <section className="stack" style={{ gap: "8px" }}>
        <p style={{ fontWeight: 650, fontSize: "0.88rem" }}>Your Rating</p>
        <div style={{ display: "flex", gap: "6px" }}>
          {Array.from({ length: 5 }, (_, index) => {
            const star = index + 1;
            const active = star <= rating;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "1.8rem",
                  color: active ? "var(--accent-secondary)" : "var(--muted)",
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1
                }}
              >
                ★
              </button>
            );
          })}
        </div>
      </section>

      <section className="stack" style={{ gap: "8px" }}>
        <p style={{ fontWeight: 650, fontSize: "0.88rem" }}>Would you recommend it?</p>
        <SegmentedControl
          ariaLabel="Would you recommend it?"
          value={recommended ? "yes" : "no"}
          onChange={(value) => setRecommended(value === "yes")}
          options={[
            { value: "yes", label: "👍 Yes" },
            { value: "no", label: "👎 No" }
          ]}
        />
      </section>

      <section className="stack" style={{ gap: "8px" }}>
        <p style={{ fontWeight: 650, fontSize: "0.88rem" }}>Favourite?</p>
        <SegmentedControl
          ariaLabel="Favourite?"
          value={favorite ? "yes" : "no"}
          onChange={(value) => setFavorite(value === "yes")}
          options={[
            { value: "yes", label: "❤ Yes" },
            { value: "no", label: "♡ No" }
          ]}
        />
      </section>

      <section className="stack" style={{ gap: "8px" }}>
        <p style={{ fontWeight: 650, fontSize: "0.88rem" }}>Your Notes (optional)</p>
        <div className="card" style={{ padding: "0" }}>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value.slice(0, MAX_NOTES_CHARS))}
            rows={4}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "var(--fg)",
              resize: "none",
              padding: "11px",
              fontSize: "16px"
            }}
            placeholder="Share your thoughts"
          />
          <p style={{ textAlign: "right", color: "var(--muted)", fontSize: "0.72rem", padding: "0 10px 8px" }}>
            {notes.length}/{MAX_NOTES_CHARS}
          </p>
        </div>
      </section>
    </main>
  );
}
