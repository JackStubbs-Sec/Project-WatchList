import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MediaLogo } from "../../components/icons";
import { useWatchStore } from "../../store/useWatchStore";

const MAX_REVIEW_CHARS = 500;

export function ReviewScreen() {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const entries = useWatchStore((state) => state.entries);
  const updateEntry = useWatchStore((state) => state.updateEntry);

  const entry = useMemo(() => entries.find((item) => item.id === entryId), [entries, entryId]);

  const [rating, setRating] = useState<number>(entry?.rating ? Math.round(entry.rating) : 0);
  const [isRecommended, setIsRecommended] = useState<boolean>(entry?.isRecommended ?? true);
  const [isFavorite, setIsFavorite] = useState<boolean>(entry?.isFavorite ?? true);
  const [review, setReview] = useState(entry?.review ?? "");

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
    await updateEntry(currentEntry.id, {
      rating: rating > 0 ? rating : undefined,
      isRecommended,
      isFavorite,
      review: review.trim() ? review.trim() : undefined,
      updatedAt: new Date().toISOString()
    });
    navigate(`/library/${currentEntry.id}`);
  }

  return (
    <main>
      <section className="row">
        <button
          type="button"
          aria-label="Close review"
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
        <p style={{ color: "var(--muted)" }}>How was it?</p>
      </section>

      <section style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <MediaLogo type={currentEntry.type} size="small" tone={currentEntry.type === "series" ? "purple" : "red"} />
        <div>
          <p style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1 }}>{currentEntry.title}</p>
          <p style={{ color: "var(--muted)", marginTop: "4px" }}>{currentEntry.type === "movie" ? "Movie" : "TV Series"}</p>
        </div>
      </section>

      <section className="stack" style={{ gap: "10px" }}>
        <p style={{ fontWeight: 650 }}>Your Rating</p>
        <div style={{ display: "flex", gap: "8px" }}>
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
                  fontSize: "2.35rem",
                  color: active ? "#0a84ff" : "#8190a8",
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

      <section className="stack" style={{ gap: "10px" }}>
        <p style={{ fontWeight: 650 }}>Would you recommend it?</p>
        <div style={segmentWrapStyle}>
          <button type="button" onClick={() => setIsRecommended(true)} style={{ ...segmentStyle, ...(isRecommended ? segmentActiveStyle : {}) }}>
            👍 Yes
          </button>
          <button type="button" onClick={() => setIsRecommended(false)} style={{ ...segmentStyle, ...(!isRecommended ? segmentActiveStyle : {}) }}>
            👎 No
          </button>
        </div>
      </section>

      <section className="stack" style={{ gap: "10px" }}>
        <p style={{ fontWeight: 650 }}>Favourite?</p>
        <div style={segmentWrapStyle}>
          <button type="button" onClick={() => setIsFavorite(true)} style={{ ...segmentStyle, ...(isFavorite ? segmentActiveStyle : {}) }}>
            ❤ Yes
          </button>
          <button type="button" onClick={() => setIsFavorite(false)} style={{ ...segmentStyle, ...(!isFavorite ? segmentActiveStyle : {}) }}>
            ♡ No
          </button>
        </div>
      </section>

      <section className="stack" style={{ gap: "10px" }}>
        <p style={{ fontWeight: 650 }}>Your Review (optional)</p>
        <div className="card" style={{ padding: "0" }}>
          <textarea
            value={review}
            onChange={(event) => setReview(event.target.value.slice(0, MAX_REVIEW_CHARS))}
            rows={5}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "var(--fg)",
              resize: "none",
              padding: "14px"
            }}
            placeholder="Share your thoughts"
          />
          <p style={{ textAlign: "right", color: "var(--muted)", fontSize: "0.8rem", padding: "0 12px 10px" }}>
            {review.length}/{MAX_REVIEW_CHARS}
          </p>
        </div>
      </section>
    </main>
  );
}

const segmentWrapStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px"
};

const segmentStyle: React.CSSProperties = {
  borderRadius: "12px",
  border: "1px solid var(--input-border)",
  background: "var(--input-bg)",
  color: "var(--text-strong)",
  padding: "12px",
  fontWeight: 650,
  cursor: "pointer"
};

const segmentActiveStyle: React.CSSProperties = {
  background: "var(--accent)",
  color: "var(--text-inverse)",
  borderColor: "transparent"
};
