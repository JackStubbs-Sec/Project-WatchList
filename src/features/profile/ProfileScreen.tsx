import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { SegmentedControl } from "../../components/SegmentedControl";
import { entryRepository } from "../../data/entryRepository";
import { getInitials, getProfileName, setProfileName } from "../../lib/profile";
import { getRegion, setRegion } from "../../lib/region";
import { seedSampleLibrary, type SeedProgress } from "../../lib/sampleData";
import { baseName, getSubscribedProviders, toggleSubscribedProvider, type SubscribedProvider } from "../../lib/subscriptions";
import { getStoredTmdbApiKey, setStoredTmdbApiKey } from "../../lib/tmdbKey";
import { getWatchProviderCatalog, type WatchProviderOption } from "../../lib/tmdb";
import { useWatchStore } from "../../store/useWatchStore";

const REGION_OPTIONS = [
  { code: "GB", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "IE", label: "Ireland" }
];

export function ProfileScreen() {
  const theme = useWatchStore((state) => state.theme);
  const setTheme = useWatchStore((state) => state.setTheme);
  const importLibrary = useWatchStore((state) => state.importLibrary);
  const clearLibrary = useWatchStore((state) => state.clearLibrary);
  const load = useWatchStore((state) => state.load);
  const importRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(getProfileName());
  const [region, setRegionState] = useState(getRegion());
  const [apiKey, setApiKey] = useState(getStoredTmdbApiKey());
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [providerCatalog, setProviderCatalog] = useState<WatchProviderOption[]>([]);
  const [providerCatalogLoading, setProviderCatalogLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SubscribedProvider[]>(() => getSubscribedProviders());
  const [dataStatus, setDataStatus] = useState<string | undefined>(undefined);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState<SeedProgress | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setProviderCatalogLoading(true);
    Promise.all([getWatchProviderCatalog("movie", region), getWatchProviderCatalog("tv", region)])
      .then(([movieProviders, tvProviders]) => {
        if (cancelled) return;
        const merged = new Map<string, WatchProviderOption>();
        for (const provider of [...movieProviders, ...tvProviders]) {
          const key = baseName(provider.providerName);
          if (!merged.has(key)) merged.set(key, provider);
        }
        setProviderCatalog(Array.from(merged.values()));
      })
      .catch(() => {
        if (!cancelled) setProviderCatalog([]);
      })
      .finally(() => {
        if (!cancelled) setProviderCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [region]);

  function onSaveName() {
    setProfileName(name);
  }

  function onRegionChange(code: string) {
    setRegionState(code);
    setRegion(code);
  }

  function onSaveApiKey() {
    setStoredTmdbApiKey(apiKey);
    setApiKeySaved(true);
    window.setTimeout(() => setApiKeySaved(false), 2000);
  }

  function onToggleProvider(provider: WatchProviderOption) {
    setSubscriptions(toggleSubscribedProvider({ id: provider.providerId, name: provider.providerName }));
  }

  async function onExport() {
    const payload = await entryRepository.exportData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `watchlist-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setDataStatus("Export downloaded.");
    window.setTimeout(() => setDataStatus(undefined), 3000);
  }

  async function onImport(file?: File) {
    if (!file) return;

    let parsed: Parameters<typeof importLibrary>[0] | undefined;
    try {
      const raw = await file.text();
      parsed = JSON.parse(raw);
    } catch {
      setDataStatus("Could not read this file. Please import a valid WatchList JSON export.");
      return;
    }

    if (!parsed || typeof parsed !== "object") {
      setDataStatus("Invalid file format.");
      return;
    }

    await importLibrary(parsed);
    setDataStatus("Import completed.");
    window.setTimeout(() => setDataStatus(undefined), 3000);
  }

  async function onConfirmReset() {
    setConfirmingReset(false);
    await clearLibrary();
    setDataStatus("Library reset.");
    window.setTimeout(() => setDataStatus(undefined), 3000);
  }

  async function onSeedSampleData() {
    setSeeding(true);
    setSeedProgress(undefined);
    try {
      const result = await seedSampleLibrary((progress) => setSeedProgress(progress));
      await load();
      setDataStatus(`Added ${result.added.length} sample titles${result.skipped.length ? ` (couldn't find ${result.skipped.join(", ")})` : ""}.`);
      window.setTimeout(() => setDataStatus(undefined), 5000);
    } finally {
      setSeeding(false);
      setSeedProgress(undefined);
    }
  }

  return (
    <main>
      <section className="stack">
        <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
          <span style={avatarStyle}>{getInitials(name)}</span>
          <div>
            <h1 style={{ fontSize: "1.35rem", marginBottom: "2px" }}>{name.trim() || "Your Profile"}</h1>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>Keep your data portable and your experience personal.</p>
          </div>
        </div>
      </section>

      <section className="card" style={{ display: "grid", gap: "9px" }}>
        <h2 className="section-title">Your Name</h2>
        <div className="row" style={{ gap: "8px" }}>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Add your name" className="soft-input" style={{ flex: 1 }} />
          <button type="button" onClick={onSaveName} className="btn btn-primary">
            Save
          </button>
        </div>
      </section>

      <section className="card" style={{ display: "grid", gap: "9px" }}>
        <h2 className="section-title">Appearance</h2>
        <SegmentedControl
          ariaLabel="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" }
          ]}
        />
      </section>

      <section className="card" style={{ display: "grid", gap: "9px" }}>
        <h2 className="section-title">Streaming Region</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "-6px" }}>Used to show what&apos;s available on which services near you.</p>
        <select value={region} onChange={(event) => onRegionChange(event.target.value)} className="soft-input">
          {REGION_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      <section className="card" style={{ display: "grid", gap: "9px" }}>
        <h2 className="section-title">Your Subscriptions</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "-6px" }}>
          Select the services you already pay for. Anything not on this list will show a $ badge so you know it needs a rental, purchase, or new subscription.
        </p>
        {providerCatalogLoading ? (
          <p style={{ color: "var(--muted)", fontSize: "0.78rem" }}>Loading services...</p>
        ) : providerCatalog.length ? (
          <div style={providerGridStyle}>
            {providerCatalog.slice(0, 24).map((provider) => {
              const active = subscriptions.some((item) => item.id === provider.providerId || baseName(item.name) === baseName(provider.providerName));
              return (
                <button
                  key={provider.providerId}
                  type="button"
                  onClick={() => onToggleProvider(provider)}
                  style={{ ...providerButtonStyle, ...(active ? providerButtonActiveStyle : {}) }}
                >
                  {provider.logoUrl ? (
                    <img src={provider.logoUrl} alt="" style={{ width: "24px", height: "24px", borderRadius: "7px" }} />
                  ) : (
                    <span style={{ width: "24px", height: "24px", borderRadius: "7px", background: "var(--input-bg)", display: "grid", placeItems: "center", fontSize: "0.6rem" }}>
                      {provider.providerName.slice(0, 2)}
                    </span>
                  )}
                  <span style={{ fontSize: "0.66rem", fontWeight: 650, textAlign: "center" }}>{provider.providerName}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "var(--muted)", fontSize: "0.78rem" }}>Couldn&apos;t load streaming services. Check your TMDB API key below.</p>
        )}
      </section>

      <section className="card" style={{ display: "grid", gap: "9px" }}>
        <h2 className="section-title">TMDB API Key</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "-6px" }}>
          Needed for search, details, and streaming availability. Get a free key from themoviedb.org under Settings &gt; API, then paste it here.
        </p>
        <div className="row" style={{ gap: "8px" }}>
          <input
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Paste your TMDB API key"
            className="soft-input"
            style={{ flex: 1 }}
          />
          <button type="button" onClick={onSaveApiKey} className="btn btn-primary">
            {apiKeySaved ? "Saved" : "Save"}
          </button>
        </div>
      </section>

      <section className="card" style={{ display: "grid", gap: "9px" }}>
        <h2 className="section-title">Data</h2>
        {dataStatus ? <p style={{ color: "var(--accent)", fontSize: "0.78rem" }}>{dataStatus}</p> : null}

        <button type="button" onClick={() => void onSeedSampleData()} disabled={seeding} className="btn btn-secondary btn-block">
          {seeding ? `Adding sample titles... ${seedProgress ? `(${seedProgress.completed}/${seedProgress.total})` : ""}` : "Load Sample Data (for testing)"}
        </button>

        <button type="button" onClick={() => void onExport()} className="btn btn-secondary btn-block">
          Export Data (JSON)
        </button>
        <button type="button" onClick={() => importRef.current?.click()} className="btn btn-secondary btn-block">
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
        <button type="button" onClick={() => setConfirmingReset(true)} className="btn btn-destructive btn-block">
          Reset Library
        </button>
      </section>

      <section className="card" style={{ display: "grid", gap: "8px" }}>
        <h2 className="section-title">About</h2>
        <p style={{ color: "var(--muted)" }}>Version 2.0.0</p>
        <p style={{ color: "var(--muted)" }}>WatchList is your premium personal watch journal.</p>
        <p style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
          Title data, images, and streaming availability provided by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </section>

      <ConfirmDialog
        open={confirmingReset}
        title="Reset your library?"
        message="This permanently deletes every title, list, and watch history from this device. This can't be undone."
        confirmLabel="Delete everything"
        requireText="RESET"
        destructive
        onConfirm={() => void onConfirmReset()}
        onCancel={() => setConfirmingReset(false)}
      />
    </main>
  );
}

const avatarStyle: CSSProperties = {
  width: "46px",
  height: "46px",
  borderRadius: "999px",
  display: "grid",
  placeItems: "center",
  background: "var(--accent)",
  color: "var(--text-inverse)",
  fontWeight: 700,
  fontSize: "1.02rem",
  flexShrink: 0
};

const providerGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(68px, 1fr))",
  gap: "6px"
};

const providerButtonStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "5px",
  border: "1px solid var(--input-border)",
  borderRadius: "10px",
  background: "var(--input-bg)",
  padding: "8px 5px",
  color: "var(--muted)"
};

const providerButtonActiveStyle: CSSProperties = {
  borderColor: "var(--accent)",
  background: "color-mix(in srgb, var(--accent) 16%, transparent)",
  color: "var(--text-strong)"
};
