import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TinySchedule | Task & Time Manager",
    short_name: "TinySchedule",
    description: "A warm daily task tracker and schedule manager.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FDFBF7",
    theme_color: "#E8A365",
    orientation: "any",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Schedule", short_name: "Schedule", url: "/schedule" },
      { name: "Tasks", short_name: "Tasks", url: "/tasks" },
      { name: "Notes", short_name: "Notes", url: "/notes" },
    ],
  };
}
