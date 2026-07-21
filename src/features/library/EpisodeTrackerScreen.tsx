import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTmdbSeasonEpisodes, getTmdbTitleDetail } from "../../lib/tmdb";
import { useWatchStore } from "../../store/useWatchStore";
import type { SeasonSummary, TmdbEpisode } from "../../types/watch";

export function EpisodeTrackerScreen() {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const entries = useWatchStore((state) => state.entries);
  const setEpisodeWatched = useWatchStore((state) => state.setEpisodeWatched);

  const entry = useMemo(() => entries.find((item) => item.id === entryId), [entries, entryId]);

  const [seasons, setSeasons] = useState<SeasonSummary[] | undefined>(entry?.seasons);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [expandedSeason, setExpandedSeason] = useState<number | undefined>(undefined);
  const [episodesBySeason, setEpisodesBySeason] = useState<Record<number, TmdbEpisode[]>>({});
  const [episodesLoading, setEpisodesLoading] = useState<number | undefined>(undefined);
  const [pendingKey, setPendingKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (entry?.seasons?.length) {
      setSeasons(entry.seasons);
      return;
    }
    if (typeof entry?.tmdbId !== "number") return;

    let cancelled = false;
    setSeasonsLoading(true);
    getTmdbTitleDetail(entry.tmdbId, "tv")
      .then((detail) => {
        if (!cancelled) setSeasons(detail.seasons);
      })
      .catch(() => {
        if (!cancelled) setSeasons(undefined);
      })
      .finally(() => {
        if (!cancelled) setSeasonsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.tmdbId]);

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(`/library/${entryId}`);
  }

  function watchedSetFor(seasonNumber: number): Set<number> {
    if (!entry) return new Set();
    return new Set(entry.episodeProgress.filter((row) => row.season === seasonNumber && row.watched).map((row) => row.episode));
  }

  async function onToggleSeason(seasonNumber: number) {
    if (expandedSeason === seasonNumber) {
      setExpandedSeason(undefined);
      return;
    }
    setExpandedSeason(seasonNumber);
    if (episodesBySeason[seasonNumber] || typeof entry?.tmdbId !== "number") return;

    setEpisodesLoading(seasonNumber);
    try {
      const episodes = await getTmdbSeasonEpisodes(entry.tmdbId, seasonNumber);
      setEpisodesBySeason((current) => ({ ...current, [seasonNumber]: episodes }));
    } finally {
      setEpisodesLoading(undefined);
    }
  }

  async function onToggleEpisode(seasonNumber: number, episodeNumber: number, watched: boolean) {
    if (!entry) return;
    const key = `${seasonNumber}-${episodeNumber}`;
    setPendingKey(key);
    try {
      await setEpisodeWatched(entry.id, seasonNumber, episodeNumber, watched);
    } finally {
      setPendingKey(undefined);
    }
  }

  async function onMarkSeason(season: SeasonSummary, watched: boolean) {
    if (!entry) return;
    const episodes = episodesBySeason[season.seasonNumber];
    const episodeNumbers = episodes ? episodes.map((ep) => ep.episodeNumber) : Array.from({ length: season.episodeCount }, (_, index) => index + 1);
    for (const episodeNumber of episodeNumbers) {
      await setEpisodeWatched(entry.id, season.seasonNumber, episodeNumber, watched);
    }
  }

  if (!entry) {
    return (
      <main>
        <section className="card">
          <h1 style={{ fontSize: "1.5rem", marginBottom: "var(--space-3)" }}>Title not found</h1>
        </section>
      </main>
    );
  }

  const totalWatched = entry.episodeProgress.filter((row) => row.watched).length;
  const totalEpisodes = entry.totalEpisodes ?? seasons?.reduce((sum, season) => sum + season.episodeCount, 0);
  const overallPercent = totalEpisodes ? Math.min(Math.round((totalWatched / totalEpisodes) * 100), 100) : 0;

  return (
    <main>
      <section className="row">
        <button type="button" aria-label="Go back" onClick={goBack} className="icon-btn">
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0, marginLeft: "10px" }}>
          <h1 className="screen-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.title}</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Episode tracker</p>
        </div>
      </section>

      <section className="card" style={{ display: "grid", gap: "6px" }}>
        <div className="row">
          <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>Overall progress</p>
          <p style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{totalEpisodes ? `${totalWatched} of ${totalEpisodes}` : `${totalWatched} watched`}</p>
        </div>
        <div style={{ height: "6px", borderRadius: "999px", background: "var(--divider)", overflow: "hidden" }}>
          <div style={{ width: `${overallPercent}%`, height: "100%", background: "var(--accent)" }} />
        </div>
      </section>

      {seasonsLoading ? <p style={{ color: "var(--muted)", fontSize: "0.86rem" }}>Loading seasons...</p> : null}

      {seasons?.length ? (
        <section className="stack">
          {seasons.map((season) => {
            const watchedSet = watchedSetFor(season.seasonNumber);
            const expanded = expandedSeason === season.seasonNumber;
            const episodes = episodesBySeason[season.seasonNumber];
            const seasonWatchedCount = watchedSet.size;
            const allWatched = seasonWatchedCount >= season.episodeCount && season.episodeCount > 0;

            return (
              <div key={season.seasonNumber} className="card" style={{ padding: "0", overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => void onToggleSeason(season.seasonNumber)}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    color: "var(--fg)",
                    padding: "11px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "left",
                    minHeight: "unset"
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.88rem" }}>{season.name}</p>
                    <p style={{ color: "var(--muted)", fontSize: "0.76rem" }}>
                      {seasonWatchedCount} of {season.episodeCount} episodes watched
                    </p>
                  </div>
                  <span style={{ color: "var(--muted)", fontSize: "0.95rem" }}>{expanded ? "▴" : "▾"}</span>
                </button>

                {expanded ? (
                  <div style={{ borderTop: "1px solid var(--divider)", padding: "8px 12px 12px", display: "grid", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => void onMarkSeason(season, !allWatched)}
                      className="btn btn-secondary"
                      style={{ fontSize: "0.74rem", padding: "7px 10px", justifySelf: "start" }}
                    >
                      {allWatched ? "Mark season unwatched" : "Mark season watched"}
                    </button>

                    {episodesLoading === season.seasonNumber ? (
                      <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Loading episodes...</p>
                    ) : episodes ? (
                      <div style={{ display: "grid", gap: "4px" }}>
                        {episodes.map((episode) => {
                          const watched = watchedSet.has(episode.episodeNumber);
                          const key = `${season.seasonNumber}-${episode.episodeNumber}`;
                          const pending = pendingKey === key;
                          return (
                            <label
                              key={episode.episodeNumber}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "6px 0",
                                borderBottom: "1px solid var(--divider)",
                                opacity: pending ? 0.6 : 1
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={watched}
                                disabled={pending}
                                onChange={(event) => void onToggleEpisode(season.seasonNumber, episode.episodeNumber, event.target.checked)}
                              />
                              <span style={{ color: "var(--muted)", fontSize: "0.74rem", width: "24px", flexShrink: 0 }}>E{episode.episodeNumber}</span>
                              <span style={{ fontSize: "0.8rem", flex: 1 }}>{episode.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Couldn&apos;t load episode list.</p>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </section>
      ) : !seasonsLoading ? (
        <p style={{ color: "var(--muted)" }}>No season data available for this show.</p>
      ) : null}
    </main>
  );
}
