import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { TabBar } from "../components/TabBar";
import { DiscoverDetailScreen } from "../features/discover/DiscoverDetailScreen";
import { DiscoverScreen } from "../features/discover/DiscoverScreen";
import { HomeScreen } from "../features/home/HomeScreen";
import { TonightPickScreen } from "../features/home/TonightPickScreen";
import { DetailScreen } from "../features/library/DetailScreen";
import { EpisodeTrackerScreen } from "../features/library/EpisodeTrackerScreen";
import { LibraryScreen } from "../features/library/LibraryScreen";
import { ReviewScreen } from "../features/library/ReviewScreen";
import { ListDetailScreen } from "../features/lists/ListDetailScreen";
import { ListsScreen } from "../features/lists/ListsScreen";
import { ProfileScreen } from "../features/profile/ProfileScreen";
import { useWatchStore } from "../store/useWatchStore";

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function CrashScreen({ error }: { error: unknown }) {
  function reloadHome() {
    window.location.hash = "#/";
    window.location.reload();
  }

  async function clearDataAndReload() {
    const accepted = window.confirm("This deletes your entire local library and resets the app. Continue?");
    if (!accepted) return;

    await new Promise<void>((resolve) => {
      const request = window.indexedDB.deleteDatabase("watchlist-db");
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });

    window.location.hash = "#/";
    window.location.reload();
  }

  return (
    <main>
      <section className="card" style={{ display: "grid", gap: "12px" }}>
        <h1 style={{ fontSize: "1.5rem" }}>Something went wrong</h1>
        <p style={{ color: "var(--muted)" }}>This screen hit a rendering error.</p>
        <p style={{ color: "var(--muted)", fontSize: "0.78rem", fontFamily: "monospace", overflowWrap: "anywhere" }}>{errorMessage(error)}</p>
        <button type="button" onClick={reloadHome} className="btn btn-primary btn-block">
          Reload App
        </button>
        <button type="button" onClick={() => void clearDataAndReload()} className="btn btn-destructive btn-block">
          Clear All Data &amp; Reload
        </button>
        <p style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
          You can also use the tabs below to jump to a different screen without reloading.
        </p>
      </section>
    </main>
  );
}

export function App() {
  const load = useWatchStore((state) => state.load);
  const theme = useWatchStore((state) => state.theme);
  const location = useLocation();

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <>
      <ErrorBoundary resetKey={location.pathname} fallback={(error) => <CrashScreen error={error} />}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/pick" element={<TonightPickScreen />} />
          <Route path="/discover" element={<DiscoverScreen />} />
          <Route path="/discover/:mediaType/:tmdbId" element={<DiscoverDetailScreen />} />
          <Route path="/library" element={<LibraryScreen />} />
          <Route path="/library/:entryId" element={<DetailScreen />} />
          <Route path="/library/:entryId/review" element={<ReviewScreen />} />
          <Route path="/library/:entryId/episodes" element={<EpisodeTrackerScreen />} />
          <Route path="/lists" element={<ListsScreen />} />
          <Route path="/lists/:listId" element={<ListDetailScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
      <TabBar />
    </>
  );
}
