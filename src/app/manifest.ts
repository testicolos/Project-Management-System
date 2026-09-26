import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Project Command",
    short_name: "Project Command",
    description: "Company project portfolios, delivery tasks, notes, documents, and QAR commitments.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#07111b",
    theme_color: "#081522",
    orientation: "any",
    categories: ["business", "productivity"],
    icons: [
      { src: "/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
