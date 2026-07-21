import { useMemo, type CSSProperties } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SegmentedControl } from "./SegmentedControl";
import { hasTag, withTag } from "../lib/entryTags";
import type { WatchEntry, WatchStatus } from "../types/watch";

const schema = z.object({
  status: z.enum(["want_to_watch", "watching", "watched"]),
  rating: z.number().min(0.5).max(5).optional(),
  notes: z.string().default(""),
  favorite: z.boolean().default(false),
  recommended: z.boolean().default(false),
  dropped: z.boolean().default(false)
});

type EntryEditorData = z.infer<typeof schema>;

export interface EntryEditorValue {
  status: WatchStatus;
  rating?: number;
  notes?: string;
  tags: string[];
}

interface EntryEditorProps {
  initial?: Partial<WatchEntry>;
  submitLabel: string;
  onSubmit: (value: EntryEditorValue) => Promise<void>;
}

function toOptionalRating(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value >= 0.5 && value <= 5 ? value : undefined;
}

function toNumberOrUndefined(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function normalizeEntryInitial(initial?: Partial<WatchEntry>): EntryEditorData {
  const statusValues: WatchStatus[] = ["want_to_watch", "watching", "watched"];
  const status = statusValues.includes(initial?.status as WatchStatus) ? (initial?.status as WatchStatus) : "want_to_watch";
  const tags = initial?.tags ?? [];

  return {
    status,
    rating: toOptionalRating(initial?.rating),
    notes: typeof initial?.notes === "string" ? initial.notes : "",
    favorite: hasTag({ tags }, "favorite"),
    recommended: hasTag({ tags }, "recommended"),
    dropped: hasTag({ tags }, "dropped")
  };
}

export function EntryEditor({ initial, submitLabel, onSubmit }: EntryEditorProps) {
  const defaultValues = useMemo(() => normalizeEntryInitial(initial), [initial]);
  const existingTags = initial?.tags ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<EntryEditorData>({
    resolver: zodResolver(schema),
    defaultValues
  });

  const status = watch("status");
  const favorite = watch("favorite");

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        let tags = existingTags.filter((tag) => !["favorite", "recommended", "dropped"].includes(tag));
        tags = withTag(tags, "favorite", data.favorite);
        tags = withTag(tags, "recommended", data.recommended);
        tags = withTag(tags, "dropped", data.dropped);

        await onSubmit({
          status: data.status,
          rating: data.rating,
          notes: data.notes.trim() || undefined,
          tags
        });
      })}
      className="card"
      style={{ display: "grid", gap: "9px" }}
    >
      <div>
        <p style={fieldLabelStyle}>Status</p>
        <div style={{ marginTop: "6px" }}>
          <SegmentedControl
            ariaLabel="Status"
            value={status}
            onChange={(value) => setValue("status", value, { shouldDirty: true })}
            options={[
              { value: "want_to_watch", label: "Want to Watch" },
              { value: "watching", label: "Watching" },
              { value: "watched", label: "Watched" }
            ]}
          />
        </div>
      </div>

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
        {errors.rating ? <small style={{ color: "var(--danger)" }}>{errors.rating.message}</small> : null}
      </label>

      <label>
        <span style={fieldLabelStyle}>Notes</span>
        <textarea {...register("notes")} rows={4} style={inputStyle} placeholder="Thoughts, review, anything you want to remember" />
      </label>

      <div className="row" style={{ borderTop: "1px solid var(--divider)", paddingTop: "10px" }}>
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

      <label style={checkboxRowStyle}>
        <input type="checkbox" {...register("dropped")} />
        <span>Dropped</span>
      </label>

      <button disabled={isSubmitting} type="submit" className="btn btn-primary btn-block">
        {submitLabel}
      </button>
    </form>
  );
}

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

const fieldLabelStyle: CSSProperties = {
  color: "var(--text-strong)",
  fontSize: "0.78rem",
  fontWeight: 600
};

const checkboxRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px"
};
