import { useEffect } from "react";
import { toast } from "sonner";
import { scheduleNativeAlarm, ALARM_IDS } from "@/lib/native-notifications";

const STORAGE_KEY = "swayen.hobbyReminder";

interface PendingReminder {
  title: string;
  deadline: number; // epoch ms
}

/**
 * Panggil ini di WalletScreen setelah `spend` sukses — menjadwalkan reminder
 * `durationMinutes` dari sekarang. Disimpan ke localStorage (bukan cuma setTimeout in-memory)
 * supaya tetap ke-check meskipun tab di-reload/backgrounded lama sebelum durasinya habis.
 * Di Android (Capacitor), juga dijadwalkan lewat native Local Notifications supaya tetap
 * muncul walau app diminimize/layar mati — localStorage check di bawah jadi fallback untuk web.
 */
export function scheduleHobbyReminder(title: string, durationMinutes: number) {
  if (typeof window === "undefined") return;
  const deadline = Date.now() + durationMinutes * 60_000;
  const reminder: PendingReminder = { title, deadline };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reminder));

  void scheduleNativeAlarm(
    ALARM_IDS.HOBBY_REMINDER,
    "Swayen — Waktunya Balik",
    `Waktu "${title}" udah habis — balik ke Swayen yuk!`,
    new Date(deadline),
  );

  if ("Notification" in window && Notification.permission === "default") {
    void Notification.requestPermission();
  }
}

function fireReminder(title: string) {
  const message = `Waktu "${title}" udah habis — balik ke Swayen yuk!`;
  toast.info(message);
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    new Notification("Swayen — Waktunya Balik", { body: message, icon: "/favicon.ico" });
  }
  window.localStorage.removeItem(STORAGE_KEY);
}

function checkPendingReminder() {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const reminder = JSON.parse(raw) as PendingReminder;
    if (Date.now() >= reminder.deadline) {
      fireReminder(reminder.title);
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Dipasang sekali di root SwayenApp() — jalan terus selama app kebuka, ngecek reminder
 * yang pending tiap kali tab kembali fokus/visible, plus polling ringan tiap 30 detik
 * buat jaga-jaga kalau usernya stay di app pas durasinya habis.
 */
export function useHobbyReminderWatcher() {
  useEffect(() => {
    checkPendingReminder(); // langsung cek pas mount, kalau2 durasi udah lewat waktu app ditutup

    const onVisible = () => {
      if (document.visibilityState === "visible") checkPendingReminder();
    };
    document.addEventListener("visibilitychange", onVisible);

    const interval = setInterval(checkPendingReminder, 30_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, []);
}
