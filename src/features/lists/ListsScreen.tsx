import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWatchStore } from "../../store/useWatchStore";

export function ListsScreen() {
  const navigate = useNavigate();
  const entries = useWatchStore((state) => state.entries);
  const customLists = useWatchStore((state) => state.customLists);
  const loadCustomLists = useWatchStore((state) => state.loadCustomLists);
  const createCustomList = useWatchStore((state) => state.createCustomList);
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void loadCustomLists();
  }, [loadCustomLists]);

  const countByListId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      for (const listId of entry.listIds) {
        counts.set(listId, (counts.get(listId) ?? 0) + 1);
      }
    }
    return counts;
  }, [entries]);

  async function onCreateList() {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      await createCustomList(trimmed);
      setNewListName("");
    } finally {
      setCreating(false);
    }
  }

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/library");
  }

  return (
    <main>
      <section className="row" style={{ marginBottom: "4px" }}>
        <button type="button" aria-label="Go back" onClick={goBack} className="icon-btn">
          ←
        </button>
      </section>

      <section className="stack">
        <div>
          <h1 className="screen-title">Lists</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>Organise your library into custom collections</p>
        </div>

        <div className="row" style={{ gap: "8px" }}>
          <input
            value={newListName}
            onChange={(event) => setNewListName(event.target.value)}
            placeholder="New list name"
            className="soft-input"
            style={{ flex: 1 }}
          />
          <button type="button" disabled={creating || !newListName.trim()} onClick={() => void onCreateList()} className="btn btn-primary">
            Add
          </button>
        </div>
      </section>

      <section className="card" style={{ padding: "8px" }}>
        {!customLists.length ? (
          <p style={{ color: "var(--muted)", padding: "10px" }}>No lists yet. Create one above.</p>
        ) : (
          <div style={{ display: "grid" }}>
            {customLists.map((list) => (
              <Link
                key={list.id}
                to={`/lists/${list.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 8px",
                  borderBottom: "1px solid var(--divider)"
                }}
              >
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{list.name}</p>
                  <p style={{ color: "var(--muted)", fontSize: "0.76rem" }}>
                    {countByListId.get(list.id) ?? 0} {(countByListId.get(list.id) ?? 0) === 1 ? "title" : "titles"}
                  </p>
                </div>
                <span style={{ color: "var(--muted)", fontSize: "1.05rem" }}>›</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
