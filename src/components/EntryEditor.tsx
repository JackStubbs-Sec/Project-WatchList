import type { CSSProperties } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SeriesLength, WatchEntry, WatchStatus, WatchType } from "../types/watch";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  type: z.enum(["movie", "series"]),
  status: z.enum(["watchlist", "watching", "completed", "dropped"]),
  genre: z.string().default(""),
  totalSeasons: z.number().int().min(1).optional(),
  season: z.number().int().min(1).optional(),
  episode: z.number().int().min(1).optional(),
  favorite: z.boolean().default(false),
  recommended: z.boolean().default(false),
  rating: z.number().min(0.5).max(5).optional(),
  review: z.string().default(""),
  notes: z.string().default(""),
  seriesLength: z.enum(["short", "long"]).optional()
});

type EntryEditorData = z.infer<typeof schema>;

export interface EntryEditorValue {
  title: string;
  type: WatchType;
  status: WatchStatus;
  genre: string;
  totalSeasons?: number;
  season?: number;
  episode?: number;
  isFavorite: boolean;
  isRecommended: boolean;
  rating?: number;
  review?: string;
  notes?: string;
  seriesLength?: SeriesLength;
  lastWatchedAt?: string;
}

interface EntryEditorProps {
  initial?: Partial<WatchEntry>;
  submitLabel: string;
  onSubmit: (value: EntryEditorValue) => Promise<void>;
}

function toNumberOrUndefined(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function EntryEditor({ initial, submitLabel, onSubmit }: EntryEditorProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<EntryEditorData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? "",
      type: initial?.type ?? "movie",
      status: initial?.status ?? "watchlist",
      genre: initial?.genre ?? "",
      totalSeasons: initial?.totalSeasons,
      season: initial?.season,
      episode: initial?.episode,
      favorite: initial?.isFavorite ?? false,
      recommended: initial?.isRecommended ?? false,
      rating: initial?.rating,
      review: initial?.review ?? "",
      notes: initial?.notes ?? "",
      seriesLength: initial?.seriesLength
    }
  });

  const type = watch("type");
  const status = watch("status");
  const favorite = watch("favorite");

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        const isSeries = data.type === "series";
        await onSubmit({
          title: data.title.trim(),
          type: data.type,
          status: data.status,
          genre: data.genre.trim(),
          totalSeasons: isSeries ? data.totalSeasons : undefined,
          season: isSeries ? data.season : undefined,
          episode: isSeries ? data.episode : undefined,
          isFavorite: data.favorite,
          isRecommended: data.recommended,
          rating: data.rating,
          review: data.review.trim() || undefined,
          notes: data.notes.trim() || undefined,
          seriesLength: isSeries ? data.seriesLength : undefined,
          lastWatchedAt: data.status === "watching" || data.status === "completed" ? new Date().toISOString() : undefined
        });
      })}
      className="card"
      style={{ display: "grid", gap: "12px" }}
    >
      <label>
        <span style={fieldLabelStyle}>Title</span>
        <input {...register("title")} style={inputStyle} />
        {errors.title ? <small style={{ color: "var(--danger)" }}>{errors.title.message}</small> : null}
      </label>

      <div>
        <p style={fieldLabelStyle}>Type</p>
        <div style={segmentWrapStyle}>
          {[
            { id: "movie", label: "🎬 Movie" },
            { id: "series", label: "📺 TV Series" }
          ].map((item) => {
            const active = type === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setValue("type", item.id as WatchType, { shouldDirty: true })}
                style={{ ...segmentButtonStyle, ...(active ? segmentButtonActiveStyle : {}) }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p style={fieldLabelStyle}>Status</p>
        <div style={statusChipWrapStyle}>
          {[
            { id: "watchlist", label: "🔖 Watchlist" },
            { id: "watching", label: "▶ Watching" },
            { id: "completed", label: "✓ Completed" },
            { id: "dropped", label: "✕ Dropped" }
          ].map((item) => {
            const active = status === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setValue("status", item.id as WatchStatus, { shouldDirty: true })}
                style={{ ...statusChipStyle, ...(active ? statusChipActiveStyle : {}) }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <label>
        <span style={fieldLabelStyle}>Genre</span>
        <input {...register("genre")} placeholder="Drama, Sci-Fi, Thriller" style={inputStyle} />
      </label>

      {type === "series" ? (
        <>
          <label>
            <span style={fieldLabelStyle}>Total Seasons (optional)</span>
            <input
              {...register("totalSeasons", {
                setValueAs: (value: string) => toNumberOrUndefined(value)
              })}
              inputMode="numeric"
              style={inputStyle}
              placeholder="e.g. 5"
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <label>
              <span style={fieldLabelStyle}>Season</span>
              <input
                {...register("season", {
                  setValueAs: (value: string) => toNumberOrUndefined(value)
                })}
                inputMode="numeric"
                style={inputStyle}
                placeholder="1"
              />
            </label>
            <label>
              <span style={fieldLabelStyle}>Episode</span>
              <input
                {...register("episode", {
                  setValueAs: (value: string) => toNumberOrUndefined(value)
                })}
                inputMode="numeric"
                style={inputStyle}
                placeholder="1"
              />
            </label>
          </div>
        </>
      ) : null}

      {type === "series" ? (
        <label>
          <span style={fieldLabelStyle}>Series Length</span>
          <select {...register("seriesLength")} style={inputStyle}>
            <option value="">Not set</option>
            <option value="short">Short series</option>
            <option value="long">Long series</option>
          </select>
        </label>
      ) : null}

      <label>
        <span style={fieldLabelStyle}>Rating (0.5 to 5.0)</span>
        <input
          {...register("rating", {
            setValueAs: (value: string) => toNumberOrUndefined(value)
          })}
          inputMode="decimal"
          placeholder="4.5"
          style={inputStyle}
        />
      </label>

      <label>
        <span style={fieldLabelStyle}>Review</span>
        <textarea {...register("review")} rows={3} style={inputStyle} />
      </label>

      <label>
        <span style={fieldLabelStyle}>Notes</span>
        <textarea {...register("notes")} rows={3} style={inputStyle} />
      </label>

      <div className="row" style={{ borderTop: "1px solid rgba(14,22,38,0.1)", paddingTop: "10px" }}>
        <label style={checkboxRowStyle}>
          <input type="checkbox" {...register("favorite")} />
          <span>Favourite</span>
        </label>
        <span style={{ color: favorite ? "var(--accent)" : "var(--muted)" }}>{favorite ? "Marked as favourite" : ""}</span>
      </div>

      <label style={checkboxRowStyle}>
        <input type="checkbox" {...register("recommended")} />
        <span>Would recommend</span>
      </label>

      <button disabled={isSubmitting} type="submit" style={primaryButtonStyle}>
        {submitLabel}
      </button>
    </form>
  );
}

const inputStyle: CSSProperties = {
  marginTop: "6px",
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid var(--input-border)",
  background: "var(--input-bg)",
  color: "var(--fg)"
};

const fieldLabelStyle: CSSProperties = {
  color: "var(--text-strong)",
  fontSize: "0.83rem",
  fontWeight: 600
};

const segmentWrapStyle: CSSProperties = {
  marginTop: "6px",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px"
};

const segmentButtonStyle: CSSProperties = {
  border: "1px solid var(--input-border)",
  borderRadius: "10px",
  background: "var(--input-bg)",
  color: "var(--muted)",
  padding: "10px",
  cursor: "pointer"
};

const segmentButtonActiveStyle: CSSProperties = {
  background: "var(--accent)",
  color: "var(--text-inverse)",
  borderColor: "transparent"
};

const statusChipWrapStyle: CSSProperties = {
  marginTop: "6px",
  display: "flex",
  flexWrap: "wrap",
  gap: "6px"
};

const statusChipStyle: CSSProperties = {
  border: "1px solid var(--input-border)",
  borderRadius: "999px",
  background: "var(--input-bg)",
  color: "var(--muted)",
  padding: "6px 10px",
  fontSize: "0.8rem",
  cursor: "pointer"
};

const statusChipActiveStyle: CSSProperties = {
  background: "rgba(10, 132, 255, 0.16)",
  borderColor: "rgba(10, 132, 255, 0.45)",
  color: "#0a4f96"
};

const checkboxRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px"
};

const primaryButtonStyle: CSSProperties = {
  borderRadius: "999px",
  border: "none",
  padding: "12px",
  background: "var(--accent)",
  color: "var(--text-inverse)",
  fontWeight: 700
};
