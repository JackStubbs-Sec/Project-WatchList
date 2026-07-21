# WatchList

WatchList is a premium personal watch journal built as a mobile-first installable PWA.

## Stack

- React + TypeScript + Vite
- Zustand for app state
- Dexie (IndexedDB) for offline local data
- vite-plugin-pwa for installability and caching

## Quick start

1. Install Node.js 20+.
2. Install dependencies:

```bash
npm install
```

3. Add a TMDB v3 API key for local development by creating a `.env` file:

```bash
VITE_TMDB_API_KEY=your_tmdb_v3_key
```

4. Run development server:

```bash
npm run dev
```

5. Build production bundle:

```bash
npm run build
```

## Areas

- Home
- Discover (TMDB search, trending, add to watchlist)
- Library
- Lists
- Profile

## TMDB API key

The GitHub Pages build does not bake in a TMDB API key (it's a static, single-bundle deploy with no server-side secret). On first use, enter a TMDB v3 API key under Profile > TMDB API Key — it's stored in the browser's local storage.

## Deployment

Use GitHub Pages with the included workflow under `.github/workflows/deploy.yml`. Pushing to `main` builds and deploys automatically.
