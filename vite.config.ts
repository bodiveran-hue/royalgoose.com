import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.svg", "favicon.svg"],
      manifest: {
        name: "Royal Goose Elite Platform",
        short_name: "RoyalGoose",
        description: "Plateforme tout-en-un pour les clubs de football africains",
        theme_color: "#14532d",
        background_color: "#052e16",
        display: "standalone",
        start_url: "/",
        lang: "fr",
        icons: [{ src: "/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": { target: "http://127.0.0.1:8787", changeOrigin: true },
    },
  },
});
