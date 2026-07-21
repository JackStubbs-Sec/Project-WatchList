import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AvailableOn } from "../../components/AvailableOn";
import { MediaLogo } from "../../components/icons";
import { SegmentedControl } from "../../components/SegmentedControl";
import { getRegion } from "../../lib/region";
import { getWatchProviders, type WatchProviders } from "../../lib/tmdb";
import { useWatchStore } from "../../store/useWatchStore";
import type { WatchType } from "../../types/watch";

export function TonightPickScreen() {
  const navigate = useNavigate();
  const entries = useWatchStore((state) => state.entries);
  const shufflePick = useWatchStore((state) => state.shufflePick);
  const shuffleReasoning = useWatchStore((state) => state.shuffleReasoning);
  const randomFilter = useWatchStore((state) => state.randomFilter);
  const setRandomFilter = useWatchStore((state) => state.setRandomFilter);
  const rerollShuffle = useWatchStore((state) => state.rerollShuffle);

  const [providers, setProviders] = useState<WatchProviders | undefined>(undefined);
  const [providersLoading, setProvidersLoading] = useState(false);

  const genreOptions = useMemo(() => {
    const genres = new Set<string>();
    for (const entry of entries) {
      for (const genre of entry.genres) {
        if (genre.trim()) genres.add(genre.trim());
      }
    }
    return Array.from(genres).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const singleGenre = randomFilter.genres[0] ?? "";

  useEffect(() => {
    if (!shufflePick) {
      rerollShuffle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof shufflePick?.tmdbId !== "number") {
      setProviders(undefined);
      return;
    }
    let cancelled = false;
    setProvidersLoading(true);
    getWatchProviders(shufflePick.tmdbId, shufflePick.type, getRegion())
      .then((result) => {
        if (!cancelled) setProviders(result);
      })
      .catch(() => {
        if (!cancelled) setProviders(undefined);
      })
      .finally(() => {
        if (!cancelled) setProvidersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shufflePick?.tmdbId, shufflePick?.type]);

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  }

  function onTypeChange(type: WatchType | "both") {
    setRandomFilter({ type });
    rerollShuffle();
  }

  function onGenreChange(genre: string) {
    setRandomFilter({ genres: genre ? [genre] : [] });
    rerollShuffle();
  }

  return (
    <main>
      <section className="screen-header">
        <button type="button" aria-label="Close shuffle" onClick={goBack} className="icon-btn">
          ✕
        </button>
        <div style={{ flex: 1, minWidth: 0, marginLeft: "12px" }}>
          <h1 className="screen-title">Shuffle</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>A random pick from your watchlist</p>
        </div>
      </section>

      <section className="card" style={{ padding: "10px", display: "grid", gap: "10px" }}>
        <SegmentedControl
          ariaLabel="Filter by type"
          value={randomFilter.type}
          onChange={onTypeChange}
          options={[
            { value: "both", label: "All" },
            { value: "movie", label: "Film" },
            { value: "tv", label: "TV" }
          ]}
        />

        <select value={singleGenre} onChange={(event) => onGenreChange(event.target.value)} className="soft-input">
          <option value="">All Genres</option>
          {genreOptions.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </section>

      <section className="card" style={{ display: "grid", gap: "9px", borderColor: "color-mix(in srgb, var(--accent-secondary) 40%, var(--card-border))", background: "linear-gradient(180deg, color-mix(in srgb, var(--accent-secondary) 14%, transparent), var(--bg-panel))" }}>
        {shufflePick ? (
          <>
            <div style={{ display: "grid", placeItems: "center", textAlign: "center", gap: "6px" }}>
              {shufflePick.posterUrl ? (
                <img src={shufflePick.posterUrl} alt="" style={{ width: "100px", borderRadius: "var(--radius-m)", boxShadow: "var(--shadow)" }} />
              ) : (
                <MediaLogo type={shufflePick.type} size="large" tone="purple" />
              )}
              <h2 style={{ fontSize: "1.15rem", lineHeight: 1.2, overflowWrap: "anywhere" }}>{shufflePick.title}</h2>
              <p style={{ color: "var(--muted)", fontSize: "0.84rem" }}>
                {shufflePick.type === "tv" ? "TV Series" : "Movie"}
                {shufflePick.year ? ` • ${shufflePick.year}` : ""}
                {shufflePick.runtimeMinutes ? ` • ${shufflePick.runtimeMinutes}m` : ""}
              </p>
              {shufflePick.genres.length ? (
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "center" }}>
                  {shufflePick.genres.slice(0, 4).map((genre) => (
                    <span key={genre} className="chip">
                      {genre}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {shuffleReasoning?.basedOnTitles.length ? (
              <p style={{ color: "var(--muted)", fontSize: "0.8rem", textAlign: "center" }}>
                Because you loved <span style={{ color: "var(--accent-secondary)", fontWeight: 650 }}>{shuffleReasoning.basedOnTitles.join(" • ")}</span>
                {typeof shuffleReasoning.predictedRating === "number" ? ` — predicted rating ★ ${shuffleReasoning.predictedRating.toFixed(1)}` : ""}
              </p>
            ) : null}

            {shufflePick.synopsis ? <p style={{ color: "var(--muted)", fontSize: "0.8rem", lineHeight: 1.4 }}>{shufflePick.synopsis}</p> : null}

            <AvailableOn providers={providers} loading={providersLoading} limit={5} />

            <Link to={`/library/${shufflePick.id}`} className="btn btn-primary btn-block">
              View Details
            </Link>
            <button type="button" onClick={rerollShuffle} className="btn btn-ghost btn-block">
              Pick Again
            </button>
          </>
        ) : (
          <p style={{ color: "var(--muted)", textAlign: "center" }}>Add titles to your want-to-watch list to get a pick.</p>
        )}
      </section>
    </main>
  );
}
