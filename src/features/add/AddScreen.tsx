import { useNavigate } from "react-router-dom";
import { EntryEditor } from "../../components/EntryEditor";
import type { EntryEditorValue } from "../../components/EntryEditor";
import { useWatchStore } from "../../store/useWatchStore";
import type { WatchEntry } from "../../types/watch";

export function AddScreen() {
  const navigate = useNavigate();
  const addEntry = useWatchStore((state) => state.addEntry);

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/library");
  }

  async function onSubmit(value: EntryEditorValue) {
    const now = new Date().toISOString();
    const entry: WatchEntry = {
      id: crypto.randomUUID(),
      ...value,
      createdAt: now,
      updatedAt: now
    };

    await addEntry(entry);
    navigate("/library");
  }

  return (
    <main>
      <section className="screen-header">
        <button
          type="button"
          aria-label="Close add screen"
          onClick={goBack}
          style={{ width: "32px", height: "32px", borderRadius: "999px", border: "1px solid rgba(14,22,38,0.18)", background: "transparent", color: "var(--muted)" }}
        >
          ✕
        </button>
        <div style={{ flex: 1, marginLeft: "12px" }}>
          <h1 className="screen-title">Add Item</h1>
          <p style={{ color: "var(--muted)" }}>Save something to your list</p>
        </div>
      </section>

      <EntryEditor submitLabel="Save Title" onSubmit={onSubmit} />
    </main>
  );
}
