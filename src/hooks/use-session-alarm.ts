import { useCallback, useEffect, useRef, useState } from "react";

const ALARM_SRC = "/alarm.wav";

export function useSessionAlarm() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [alarmOpen, setAlarmOpen] = useState(false);
  const [alarmMessage, setAlarmMessage] = useState("");

  const stopAlarm = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    }
    setAlarmOpen(false);
  }, []);

  const triggerAlarm = useCallback((message: string) => {
    stopAlarm();
    const audio = new Audio(ALARM_SRC);
    audio.loop = true;
    audioRef.current = audio;
    void audio.play().catch(() => {
      /* autoplay may be blocked until user interacts */
    });
    setAlarmMessage(message);
    setAlarmOpen(true);

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Swayen Focus Flow", {
          body: message,
          icon: "/favicon.ico",
        });
      } else if (Notification.permission !== "denied") {
        void Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            new Notification("Swayen Focus Flow", {
              body: message,
              icon: "/favicon.ico",
            });
          }
        });
      }
    }
  }, [stopAlarm]);

  useEffect(() => () => stopAlarm(), [stopAlarm]);

  return { alarmOpen, alarmMessage, triggerAlarm, stopAlarm };
}

export function formatCountdown(ms: number) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const ss = (totalSec % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}
