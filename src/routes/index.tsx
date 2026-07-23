import { createFileRoute } from "@tanstack/react-router";
import { SwayenApp } from "@/components/swayen/SwayenApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Swayen — Manajemen Energi Harian" },
      {
        name: "description",
        content:
          "Swayen: aplikasi manajemen energi berbasis Night Sentinel, TimeBox, dan Swayen Coin. Fokus, istirahat, dan reward yang jujur.",
      },
      { property: "og:title", content: "Swayen — Manajemen Energi Harian" },
      {
        property: "og:description",
        content: "Night Sentinel, TimeBox 45 menit, dan Swayen Coin untuk hobi 15 menit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <SwayenApp />;
}
