import type { CSSProperties } from "react";
import { useRef } from "react";
import { useWatchStore } from "../../store/useWatchStore";
import type { WatchEntry } from "../../types/watch";

export function SettingsScreen() {
  const entries = useWatchStore((state) => state.entries);
  const theme = useWatchStore((state) => state.theme);
  const setTheme = useWatchStore((state) => state.setTheme);
  const importEntries = useWatchStore((state) => state.importEntries);
  const clearLibrary = useWatchStore((state) => state.clearLibrary);
  const importRef = useRef<HTMLInputElement>(null);

  function onExport() {
    const blob = new Blob([JSON.stringify({ version: 1, entries }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `watchlist-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function onImport(file?: File) {
    if (!file) return;

    let imported: WatchEntry[] | undefined;
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as { entries?: WatchEntry[] };
      imported = parsed.entries;
    } catch {
      alert("Could not read this file. Please import a valid WatchList JSON export.");
      return;
    }

    if (!Array.isArray(imported)) {
      alert("Invalid file format.");
      return;
    }

    const valid = imported.filter((item) => typeof item.id === "string" && typeof item.title === "string");
    await importEntries(valid);
    alert("Import completed.");
  }

  async function onReset() {
    const text = prompt("Type RESET to confirm deleting your entire library.");
    if (text !== "RESET") return;

    await clearLibrary();
  }

  return (
    <main>
      <section style={{ marginBottom: "var(--space-5)" }}>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "var(--space-3)" }}>Settings</h1>
        <p style={{ color: "var(--muted)" }}>Keep your data portable and your experience personal.</p>
      </section>

      <section className="card" style={{ marginBottom: "var(--space-5)", display: "grid", gap: "12px" }}>
        <h2 className="section-title">Appearance</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setTheme("light")}
            style={{ ...themeToggleStyle, ...(theme === "light" ? themeToggleActiveStyle : undefined) }}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            style={{ ...themeToggleStyle, ...(theme === "dark" ? themeToggleActiveStyle : undefined) }}
          >
            Dark
          </button>
        </div>
      </section>

      <section className="card" style={{ marginBottom: "var(--space-5)", display: "grid", gap: "12px" }}>
        <h2 className="section-title">Data</h2>
        <button type="button" onClick={onExport} style={actionStyle}>
          Export Data (JSON)
        </button>
        <button type="button" onClick={() => importRef.current?.click()} style={actionStyle}>
          Import Data
        </button>
        <input
          ref={importRef}
          hidden
          type="file"
          accept="application/json"
          onChange={(event) => {
            void onImport(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
        <button type="button" onClick={() => void onReset()} style={{ ...actionStyle, background: "#2b1515", borderColor: "#7e3e3e", color: "#ffd1d1" }}>
          Reset Library
        </button>
      </section>

      <section className="card" style={{ marginBottom: "var(--space-5)", display: "grid", gap: "8px" }}>
        <h2 className="section-title">About</h2>
        <p style={{ color: "var(--muted)" }}>Version 1.0.0</p>
        <p style={{ color: "var(--muted)" }}>WatchList is your premium personal watch journal.</p>
      </section>

      <section className="card">
        <h2 className="section-title">Future Roadmap</h2>
        <p style={{ color: "var(--muted)" }}>Posters, metadata, stats, cloud sync, widgets, and AI recommendations remain out of V1 scope.</p>
      </section>
    </main>
  );
}

const actionStyle: CSSProperties = {
  borderRadius: "12px",
  border: "1px solid var(--input-border)",
  padding: "12px",
  background: "var(--bg-panel)",
  color: "var(--fg)",
  textAlign: "left",
  cursor: "pointer"
};

const themeToggleStyle: CSSProperties = {
  borderRadius: "12px",
  border: "1px solid var(--input-border)",
  padding: "12px",
  background: "var(--input-bg)",
  color: "var(--muted)",
  fontWeight: 650,
  cursor: "pointer"
};

const themeToggleActiveStyle: CSSProperties = {
  background: "var(--accent)",
  borderColor: "transparent",
  color: "var(--text-inverse)"
};
