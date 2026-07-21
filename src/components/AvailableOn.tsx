import { useMemo, type CSSProperties } from "react";
import { baseName, getSubscribedProviders, isSubscribedToProvider } from "../lib/subscriptions";
import type { WatchProviderOption, WatchProviders } from "../lib/tmdb";

interface CombinedProvider {
  providerId: number;
  providerName: string;
  logoUrl?: string;
  owned: boolean;
  rentOrBuyOnly: boolean;
}

interface ProviderGroup {
  flatrateVariant?: WatchProviderOption;
  rentBuyVariant?: WatchProviderOption;
}

function combineProviders(providers: WatchProviders, subscriptions: ReturnType<typeof getSubscribedProviders>): CombinedProvider[] {
  const groups = new Map<string, ProviderGroup>();

  for (const provider of providers.flatrate) {
    const key = baseName(provider.providerName);
    const group = groups.get(key) ?? {};
    if (!group.flatrateVariant) group.flatrateVariant = provider;
    groups.set(key, group);
  }

  for (const provider of [...providers.rent, ...providers.buy]) {
    const key = baseName(provider.providerName);
    const group = groups.get(key) ?? {};
    if (!group.rentBuyVariant) group.rentBuyVariant = provider;
    groups.set(key, group);
  }

  return Array.from(groups.values()).map((group) => {
    const representative = (group.flatrateVariant ?? group.rentBuyVariant)!;
    const owned = group.flatrateVariant ? isSubscribedToProvider(subscriptions, group.flatrateVariant) : false;
    return {
      providerId: representative.providerId,
      providerName: representative.providerName,
      logoUrl: representative.logoUrl,
      owned,
      rentOrBuyOnly: !group.flatrateVariant
    };
  });
}

export function AvailableOn({
  providers,
  loading,
  compact = false,
  limit
}: {
  providers: WatchProviders | undefined;
  loading: boolean;
  compact?: boolean;
  limit?: number;
}) {
  const subscriptions = useMemo(() => getSubscribedProviders(), []);
  const size = compact ? 24 : 32;
  const badgeSize = compact ? 12 : 14;

  if (loading) {
    return <p style={{ color: "var(--muted)", fontSize: "0.74rem" }}>Checking availability...</p>;
  }

  const combined = providers ? combineProviders(providers, subscriptions) : [];

  if (!combined.length) {
    return <p style={{ color: "var(--muted)", fontSize: "0.74rem" }}>Not currently available to stream in your region.</p>;
  }

  const visible = limit ? combined.slice(0, limit) : combined;
  const overflowCount = combined.length - visible.length;

  return (
    <div style={{ display: "grid", gap: "5px" }}>
      <div style={{ display: "flex", gap: compact ? "5px" : "8px", flexWrap: "wrap", alignItems: "flex-start" }}>
        {visible.map((provider) => {
          const tooltip = provider.owned
            ? provider.providerName
            : provider.rentOrBuyOnly
              ? `${provider.providerName} — rent or buy only, not included with a subscription`
              : `${provider.providerName} — not in your subscriptions`;

          return (
            <div key={provider.providerId} style={{ position: "relative", display: "grid", justifyItems: "center", gap: "3px", width: `${size}px` }}>
              {provider.logoUrl ? (
                <img src={provider.logoUrl} alt={provider.providerName} title={tooltip} style={{ width: `${size}px`, height: `${size}px`, borderRadius: compact ? "8px" : "10px" }} />
              ) : (
                <span style={{ width: `${size}px`, height: `${size}px`, borderRadius: compact ? "8px" : "10px", background: "var(--input-bg)", display: "grid", placeItems: "center", fontSize: "0.7rem" }}>
                  {provider.providerName.slice(0, 2)}
                </span>
              )}
              {!provider.owned ? (
                <span
                  style={{ ...premiumBadgeStyle, width: `${badgeSize}px`, height: `${badgeSize}px`, fontSize: compact ? "0.55rem" : "0.62rem" }}
                  aria-label={provider.rentOrBuyOnly ? "Rent or buy" : "Requires payment"}
                  title={tooltip}
                >
                  $
                </span>
              ) : null}
              {!compact && provider.rentOrBuyOnly ? (
                <span style={{ color: "var(--muted)", fontSize: "0.56rem", lineHeight: 1, textAlign: "center" }}>Rent/Buy</span>
              ) : null}
            </div>
          );
        })}
        {overflowCount > 0 ? <span style={{ color: "var(--muted)", fontSize: compact ? "0.64rem" : "0.7rem" }}>+{overflowCount}</span> : null}
      </div>
      <p style={{ color: "var(--muted)", fontSize: compact ? "0.58rem" : "0.64rem" }}>Streaming data via TMDB · $ = not included with your subscriptions</p>
    </div>
  );
}

const premiumBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "-4px",
  right: "-4px",
  width: "16px",
  height: "16px",
  borderRadius: "999px",
  background: "var(--accent-secondary)",
  color: "#221a04",
  fontSize: "0.62rem",
  fontWeight: 800,
  display: "grid",
  placeItems: "center",
  border: "1px solid var(--bg)"
};
