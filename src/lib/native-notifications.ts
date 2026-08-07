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
//
// PENTING: pakai STATIC import (bukan dynamic `await import()`) — dynamic import bikin Vite
// code-split plugin ini ke chunk file terpisah, yang rawan kena masalah "stale chunk" (nama
// file berubah abis redeploy, referensi lama di WebView jadi nyangkut/gagal fetch tanpa error
// jelas). Static import langsung ke-bundle di file utama, gak ada titik gagal tambahan itu.

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
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

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

let permissionRequested = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNativePlatform()) {
    debugToast("bukan native platform, skip permission check");
    return true;
  }
  try {
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

export async function cancelNativeAlarm(id: number) {
  if (!isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch (err) {
    debugToast(`cancelNativeAlarm(id=${id}) FAILED: ${String(err)}`, true);
  }
}

export const ALARM_IDS = {
  TIMEBOX_SESSION: 1001,
  HOBBY_REMINDER: 1002,
} as const;

export async function setupAlarmChannel() {
  debugToast(`setupAlarmChannel dipanggil, native=${isNativePlatform()}`);
  if (!isNativePlatform()) return;
  try {
    await LocalNotifications.createChannel({
      id: "swayen-alarms",
      name: "Swayen Alarms",
      description: "Alarm TimeBox & Wuxiu Nap",
      importance: 5,
      sound: "alarm.wav",
      vibration: true,
    });
    debugToast("channel created OK");
  } catch (err) {
    debugToast(`setupAlarmChannel FAILED: ${String(err)}`, true);
  }
}
