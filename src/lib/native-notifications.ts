// Native alarm scheduling lewat @capacitor/local-notifications.
//
// KENAPA INI BEDA DARI setTimeout/Notification API BIASA:
// setTimeout & Notification API browser cuma jalan kalau JS-nya masih eksekusi — begitu
// layar HP mati atau app di-minimize lama, WebView di-throttle/suspend sama Android, jadi
// timer "20 menit lagi" itu gak akurat (atau gak jalan sama sekali).
//
// Local Notifications beda: kita kasih tau OS "tolong munculin notifikasi jam segini" (`at: Date`)
// pas sesi DIMULAI, terus OS Android sendiri yang jadwalin & munculin—independen dari status
// app (running/minimized/killed sekalipun, selama device gak di-reboot tanpa reschedule).

import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";

// DEBUG_TOAST: dipakai sementara buat debugging alarm native — console.log kadang ke-strip
// pas production build, toast ini gak mungkin ke-strip karena itu runtime behavior beneran.
// Set ke false / hapus semua pemanggilannya kalau debugging udah kelar.
const DEBUG_TOAST = true;
function debugToast(message: string, isError = false) {
  if (!DEBUG_TOAST) return;
  if (isError) toast.error(`[DEBUG] ${message}`);
  else toast.info(`[DEBUG] ${message}`);
}

// Lazy import supaya file ini tetap aman di-import di web (non-Capacitor) tanpa error module-not-found
async function getLocalNotifications() {
  const mod = await import("@capacitor/local-notifications");
  return mod.LocalNotifications;
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

let permissionRequested = false;

/**
 * Minta izin notifikasi native. Dipanggil sekali di awal (mis. saat user pertama kali
 * klik tombol Nap/TimeBox), bukan otomatis saat app dibuka — biar sesuai best-practice
 * "request permission in context", bukan langsung nembak popup pas onboarding.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNativePlatform()) {
    debugToast("bukan native platform, skip permission check");
    return true; // di web, fallback ke Notification API biasa
  }
  try {
    const LocalNotifications = await getLocalNotifications();
    if (!permissionRequested) {
      permissionRequested = true;
      const current = await LocalNotifications.checkPermissions();
      debugToast(`current permission: ${current.display}`);
      if (current.display !== "granted") {
        const result = await LocalNotifications.requestPermissions();
        debugToast(`permission request result: ${result.display}`);
        return result.display === "granted";
      }
    }
    const status = await LocalNotifications.checkPermissions();
    return status.display === "granted";
  } catch (err) {
    debugToast(`ensureNotificationPermission failed: ${String(err)}`, true);
    return false;
  }
}

/**
 * Jadwalkan alarm native yang bakal muncul TEPAT di `firesAt`, walau app diminimize/layar mati.
 * `id` harus angka unik & konsisten per jenis sesi (pakai konstanta, lihat ALARM_IDS di bawah)
 * supaya alarm lama otomatis ke-replace kalau user mulai sesi baru dari jenis yang sama.
 */
export async function scheduleNativeAlarm(id: number, title: string, body: string, firesAt: Date) {
  debugToast(`scheduleNativeAlarm dipanggil, id=${id}, native=${isNativePlatform()}`);
  if (!isNativePlatform()) return;
  try {
    const granted = await ensureNotificationPermission();
    debugToast(`permission granted? ${granted}`);
    if (!granted) {
      debugToast("scheduleNativeAlarm dibatalkan — permission belum granted", true);
      return;
    }

    const LocalNotifications = await getLocalNotifications();
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
          schedule: { at: firesAt, allowWhileIdle: true },
          sound: "alarm.wav",
          channelId: "swayen-alarms",
        },
      ],
    });
    debugToast(`alarm id=${id} scheduled for ${firesAt.toLocaleTimeString()}`);
  } catch (err) {
    debugToast(`scheduleNativeAlarm(id=${id}) FAILED: ${String(err)}`, true);
  }
}

/** Batalkan alarm terjadwal — dipanggil kalau user selesai/stop sesi lebih cepat dari durasi asli. */
export async function cancelNativeAlarm(id: number) {
  if (!isNativePlatform()) return;
  try {
    const LocalNotifications = await getLocalNotifications();
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch (err) {
    debugToast(`cancelNativeAlarm(id=${id}) FAILED: ${String(err)}`, true);
  }
}

// ID tetap per jenis alarm supaya gampang di-cancel/replace. Kalau nanti nambah jenis sesi baru,
// tambah entry baru di sini (jangan pakai angka random supaya gak bentrok/leak).
export const ALARM_IDS = {
  TIMEBOX_SESSION: 1001,
  HOBBY_REMINDER: 1002,
} as const;

/**
 * Buat channel notifikasi Android khusus alarm (wajib di Android 8+/API 26+ biar suara custom
 * & prioritas "urgent" kepakai). Dipanggil sekali di root app saat mount.
 */
export async function setupAlarmChannel() {
  debugToast(`setupAlarmChannel dipanggil, native=${isNativePlatform()}`);
  if (!isNativePlatform()) return;
  try {
    const LocalNotifications = await getLocalNotifications();
    await LocalNotifications.createChannel({
      id: "swayen-alarms",
      name: "Swayen Alarms",
      description: "Alarm TimeBox & Wuxiu Nap",
      importance: 5, // IMPORTANCE_HIGH — muncul sebagai heads-up notification + bunyi
      sound: "alarm.wav",
      vibration: true,
    });
    debugToast("channel created OK");
  } catch (err) {
    debugToast(`setupAlarmChannel FAILED: ${String(err)}`, true);
  }
}
