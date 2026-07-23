# Swayen — Android APK via Capacitor

## Arsitektur yang dipakai

Frontend Swayen ini SSR (TanStack Start, di-build ke Cloudflare Workers via config Lovable yang di-manage). Capacitor **tidak** membungkus file statis — sebagai gantinya, `capacitor.config.ts` diarahkan ke `server.url` yang **live-load** halaman dari domain production kamu. APK-nya jadi WebView tipis yang selalu nampilin versi terbaru dari web app kamu (gak perlu rebuild APK tiap kali ada update frontend, cukup deploy ulang web-nya).

Konsekuensinya: app ini **butuh koneksi internet** untuk dibuka — tapi itu bukan masalah, karena Swayen dari awal memang selalu butuh koneksi ke backend API buat hampir semua fitur.

---

## 0. Prasyarat di komputer kamu
- **Android Studio** terinstall ([developer.android.com/studio](https://developer.android.com/studio)) — ini yang nyediain Android SDK & emulator
- **JDK 17+** (biasanya udah ikut bundling Android Studio)
- Frontend Swayen sudah **di-deploy ke production** (Cloudflare Pages/Workers) — karena APK bakal nge-load URL itu

## 1. Set URL production

Edit `capacitor.config.ts`, ganti:
```ts
const PRODUCTION_URL = "https://swayen.example.com"; // ganti ke domain asli kamu
```

## 2. Install dependencies & init Android platform

```bash
npm install     # install @capacitor/core, @capacitor/android, @capacitor/local-notifications yang sudah ditambahkan ke package.json
npx cap add android
```

Command ini bakal generate folder `android/` (project Android native lengkap) berdasarkan `capacitor.config.ts`.

## 3. Setup file suara alarm & icon notifikasi

Local Notifications butuh file suara & icon disalin manual ke folder native (Capacitor gak auto-copy ini):

```bash
# Salin file alarm ke resource Android (harus format .wav/.mp3, taruh di folder raw)
mkdir -p android/app/src/main/res/raw
cp public/alarm.wav android/app/src/main/res/raw/alarm.wav
```

Untuk icon notifikasi (`ic_stat_swayen` yang direferensikan di `capacitor.config.ts`), generate dari logo Swayen kamu (`src/assets/swayen-logo-dark.png`) pakai [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-notification.html) — icon notifikasi Android **harus** monochrome/silhouette (bukan icon warna biasa), taruh hasilnya di `android/app/src/main/res/drawable/ic_stat_swayen.png` (dan variant `drawable-hdpi`, `drawable-xhdpi`, dst kalau mau kualitas optimal di semua device).

## 4. Permission untuk exact alarm (Android 12+)

Buka `android/app/src/main/AndroidManifest.xml`, tambahkan permission ini di dalam tag `<manifest>` (sebelum `<application>`):

```xml
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

`SCHEDULE_EXACT_ALARM` wajib di Android 12+ (API 31+) supaya notifikasi alarm 20 menit itu muncul **tepat waktu**, bukan di-batch/delay sama sistem (Doze mode). `POST_NOTIFICATIONS` wajib di Android 13+ (API 33+) buat nampilin notifikasi sama sekali.

## 5. Sync & buka Android Studio

```bash
npx cap sync android
npx cap open android
```

Command terakhir otomatis buka project-nya di Android Studio. Dari situ:
1. Tunggu Gradle sync selesai (bisa beberapa menit pertama kali)
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. APK jadi ada di `android/app/build/outputs/apk/debug/app-debug.apk`
4. Install ke HP: `adb install android/app/build/outputs/apk/debug/app-debug.apk`, atau langsung transfer file APK-nya ke HP dan install manual (aktifkan "Install from unknown sources" dulu di HP)

## 6. Testing alarm di kondisi nyata

Setelah APK ter-install:
1. Buka app, login, mulai sesi **Wuxiu Nap** (20 menit) — pas pertama kali, Android bakal minta izin notifikasi, **Allow**
2. **Matikan layar HP** (jangan force-close app, cukup kunci layar)
3. Tunggu ~20 menit → notifikasi alarm harus tetap muncul + bunyi meskipun layar mati

Kalau notifikasi **tidak** muncul, cek:
- Battery optimization: Settings → Apps → Swayen → Battery → pilih "Unrestricted" (beberapa merk HP seperti Xiaomi/Oppo/Vivo punya battery saver agresif yang bisa nge-kill scheduled alarm meski udah pakai native Local Notifications)
- Permission notifikasi beneran ke-grant (Settings → Apps → Swayen → Notifications)

## Update APK setelah ada perubahan kode native

Kalau nanti nambah/ubah plugin Capacitor (bukan cuma ubah kode React biasa — itu otomatis ke-load ulang dari `server.url`):
```bash
npx cap sync android
npx cap open android
# build ulang APK dari Android Studio
```
