const SUBSCRIPTIONS_STORAGE_KEY = "watchlist-subscribed-providers";

export interface SubscribedProvider {
  id: number;
  name: string;
}

const TIER_SUFFIXES = ["with ads", "(with ads)", "ads", "free", "premium", "standard", "basic"];

export function baseName(name: string): string {
  let normalized = name.trim().toLowerCase().replace(/\s+/g, " ");

  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of TIER_SUFFIXES) {
      if (normalized.endsWith(` ${suffix}`)) {
        normalized = normalized.slice(0, -(suffix.length + 1)).trim();
        changed = true;
        break;
      }
    }
  }

  return normalized;
}

export function getSubscribedProviders(): SubscribedProvider[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((value) => {
        if (typeof value === "number") return { id: value, name: "" };
        if (value && typeof value === "object" && typeof value.id === "number" && typeof value.name === "string") {
          return { id: value.id, name: value.name };
        }
        return undefined;
      })
      .filter((value): value is SubscribedProvider => Boolean(value));
  } catch {
    return [];
  }
}

export function setSubscribedProviders(providers: SubscribedProvider[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(providers));
}

export function toggleSubscribedProvider(provider: SubscribedProvider): SubscribedProvider[] {
  const current = getSubscribedProviders();
  const isSubscribed = current.some((item) => item.id === provider.id);
  const next = isSubscribed ? current.filter((item) => item.id !== provider.id) : [...current, provider];
  setSubscribedProviders(next);
  return next;
}

export function isSubscribedToProvider(subscriptions: SubscribedProvider[], candidate: { providerId: number; providerName: string }): boolean {
  return subscriptions.some((item) => item.id === candidate.providerId || (item.name && baseName(item.name) === baseName(candidate.providerName)));
}
