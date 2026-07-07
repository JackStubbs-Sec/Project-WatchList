import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { TabBar } from "../components/TabBar";
import { AddScreen } from "../features/add/AddScreen";
import { HomeScreen } from "../features/home/HomeScreen";
import { TonightPickScreen } from "../features/home/TonightPickScreen";
import { DetailScreen } from "../features/library/DetailScreen";
import { LibraryScreen } from "../features/library/LibraryScreen";
import { ReviewScreen } from "../features/library/ReviewScreen";
import { SearchScreen } from "../features/search/SearchScreen";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { useWatchStore } from "../store/useWatchStore";

export function App() {
  const load = useWatchStore((state) => state.load);
  const theme = useWatchStore((state) => state.theme);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/pick" element={<TonightPickScreen />} />
        <Route path="/library" element={<LibraryScreen />} />
        <Route path="/library/:entryId" element={<DetailScreen />} />
        <Route path="/library/:entryId/review" element={<ReviewScreen />} />
        <Route path="/add" element={<AddScreen />} />
        <Route path="/search" element={<SearchScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <TabBar />
    </>
  );
}
