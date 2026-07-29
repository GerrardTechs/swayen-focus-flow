import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

if (typeof window !== "undefined") {
  // Modul ini berhasil di-load tanpa preload error → reset guard dari insiden sebelumnya
  sessionStorage.removeItem("swayen.reloadedForStaleChunk");

  window.addEventListener("vite:preloadError", () => {
    const key = "swayen.reloadedForStaleChunk";
    // Reload sekali doang — kalau event ini nembak lagi setelah reload, berarti masalahnya
    // bukan cache basi (mungkin deploy-nya beneran rusak), jangan sampai infinite-loop reload.
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      window.location.reload();
    }
  });
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
