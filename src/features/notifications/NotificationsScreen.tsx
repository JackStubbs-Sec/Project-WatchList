import { useEffect, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MediaLogo } from "../../components/icons";
import { useWatchStore } from "../../store/useWatchStore";

export function NotificationsScreen() {
  const navigate = useNavigate();
  const notifications = useWatchStore((state) => state.notifications);
  const acknowledgeNotifications = useWatchStore((state) => state.acknowledgeNotifications);

  const [displayList] = useState(notifications);

  useEffect(() => {
    if (notifications.length) acknowledgeNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  }

  return (
    <main>
      <section className="row" style={{ marginBottom: "4px" }}>
        <button type="button" aria-label="Go back" onClick={goBack} className="icon-btn">
          ←
        </button>
        <h1 className="screen-title">Notifications</h1>
        <span style={{ width: "34px" }} />
      </section>

      {displayList.length ? (
        <section className="stack">
          {displayList.map((notification) => (
            <Link key={`${notification.tmdbId}-${notification.newSeasonNumber}`} to={`/library/${notification.entryId}`} className="card" style={cardStyle}>
              <div style={posterWrapStyle}>
                {notification.posterUrl ? (
                  <img src={notification.posterUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <MediaLogo type="tv" size="compact" tone="purple" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: "0.92rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notification.title}</p>
                <p style={{ color: "var(--accent)", fontSize: "0.8rem", fontWeight: 650, marginTop: "2px" }}>
                  Season {notification.newSeasonNumber} is now available
                </p>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="card">
          <p style={{ color: "var(--muted)" }}>
            No new seasons right now. We&apos;ll let you know when a show in your Want to Watch or Watched list gets renewed.
          </p>
        </section>
      )}
    </main>
  );
}

const cardStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "10px"
};

const posterWrapStyle: CSSProperties = {
  flexShrink: 0,
  width: "48px",
  height: "68px",
  borderRadius: "8px",
  overflow: "hidden",
  background: "var(--input-bg)",
  display: "grid",
  placeItems: "center"
};
