import type { CapacitorConfig } from "@capacitor/cli";

// PENTING: ganti "url" di bawah ke domain production frontend kamu setelah deploy
// (Cloudflare Pages/Workers, Vercel, dst). Selama development, bisa diarahkan ke
// alamat LAN laptop kamu (bukan localhost) supaya kelihatan di emulator/HP fisik,
// misal: "http://192.168.1.10:3000"
const PRODUCTION_URL = "https://swayen-focus-flows.vercel.app/"; // TODO: ganti ke URL production asli

const config: CapacitorConfig = {
  appId: "com.swayen.app",
  appName: "Swayen",
  webDir: "www", // folder placeholder — konten asli di-load dari `server.url` di bawah, bukan dari sini
  server: {
    url: PRODUCTION_URL,
    cleartext: false, // set true sementara HANYA kalau server dev pakai http:// (bukan https)
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_swayen",
      iconColor: "#09090b",
      sound: "alarm.wav",
    },
  },
};

export default config;
