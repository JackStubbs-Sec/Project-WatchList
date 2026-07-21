import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MediaLogo } from "../../components/icons";
import { useWatchStore } from "../../store/useWatchStore";

export function ListDetailScreen() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const entries = useWatchStore((state) => state.entries);
  const customLists = useWatchStore((state) => state.customLists);
  const loadCustomLists = useWatchStore((state) => state.loadCustomLists);

  useEffect(() => {
    void loadCustomLists();
  }, [loadCustomLists]);

  const list = useMemo(() => customLists.find((item) => item.id === listId), [customLists, listId]);
  const items = useMemo(() => entries.filter((entry) => entry.listIds.includes(listId ?? "")), [entries, listId]);

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/lists");
  }

  return (
    <main>
      <section className="row">
        <button
          type="button"
          aria-label="Go back"
          onClick={goBack}
          className="icon-btn"
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0, marginLeft: "10px" }}>
          <h1 className="screen-title">{list?.name ?? "List"}</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
            {items.length} {items.length === 1 ? "title" : "titles"}
          </p>
        </div>
      </section>

      <section className="card" style={{ padding: "6px" }}>
        {!items.length ? (
          <p style={{ color: "var(--muted)", padding: "8px", fontSize: "0.86rem" }}>No titles in this list yet. Add some from Discover or the Library.</p>
        ) : (
          <div style={{ display: "grid" }}>
            {items.map((entry) => (
              <Link
                key={entry.id}
                to={`/library/${entry.id}`}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderBottom: "1px solid var(--divider)" }}
              >
                <span style={{ width: "34px", height: "34px", display: "grid", placeItems: "center", borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
                  {entry.posterUrl ? (
                    <img src={entry.posterUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <MediaLogo type={entry.type} size="compact" tone={entry.type === "tv" ? "purple" : "red"} />
                  )}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: "0.86rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.title}</p>
                  <p style={{ color: "var(--muted)", fontSize: "0.74rem" }}>{entry.type === "tv" ? "TV Series" : "Movie"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
