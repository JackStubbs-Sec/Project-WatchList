import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  server: {
    watch: {
      ignored: ["**/My Watchlist Logo.png", "**/~$*", "**/*.tmp"]
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"],
      manifest: {
        name: "WatchList",
        short_name: "WatchList",
        description: "A premium personal watch journal.",
        theme_color: "#0d1117",
        background_color: "#0d1117",
        display: "standalone",
        orientation: "portrait",
        start_url: "./",
        scope: "./",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          }
        ]
      },
      workbox: {
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache"
            }
          },
          {
            urlPattern: ({ request }) => ["script", "style", "worker"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "asset-cache"
            }
          }
        ]
      }
    })
  ]
});
