import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Home,
  Timer,
  Wallet,
  User,
  Moon,
  Sun,
  Plus,
  Play,
  Pause,
  Square,
  Coins,
  Flame,
  BatteryLow,
  BookOpen,
  Sparkles,
  LogOut,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Link,
} from "lucide-react";
import { toast } from "sonner";
import { isNativePlatform } from "@/lib/native-notifications";
import { useSwayenAuth } from "@/lib/swayen-auth";
import { useTheme } from "@/lib/theme";
import { api, type Hobby } from "@/lib/swayen-api";
import { SwayenLogo } from "@/components/swayen/SwayenLogo";
import { cn } from "@/lib/utils";
import { formatCountdown, useSessionAlarm } from "@/hooks/use-session-alarm";
import { useHobbyReminderWatcher, scheduleHobbyReminder } from "@/hooks/use-hobby-reminder";
import {
  scheduleNativeAlarm,
  cancelNativeAlarm,
  setupAlarmChannel,
  ALARM_IDS,
} from "@/lib/native-notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Tab = "home" | "timebox" | "wallet" | "profile";

export function SwayenApp() {
  const { user, loading, hasToken } = useSwayenAuth();
  const [tab, setTab] = useState<Tab>("home");
  useHobbyReminderWatcher();
  useEffect(() => {
    void setupAlarmChannel();
  }, []);

  if (loading) {
    return (
      <PhoneFrame>
        <div className="grid h-full place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PhoneFrame>
    );
  }

  if (!hasToken || !user) {
    return (
      <PhoneFrame>
        <AuthScreen />
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <div className="relative flex h-full flex-col">
        <div className="flex-1 overflow-y-auto pb-24">
          <div key={tab} className="tab-pop">
            {tab === "home" && <HomeScreen />}
            {tab === "timebox" && <TimeboxScreen />}
            {tab === "wallet" && <WalletScreen />}
            {tab === "profile" && <ProfileScreen />}
          </div>
        </div>
        <BottomNav tab={tab} setTab={setTab} />
      </div>
    </PhoneFrame>
  );
}

/* ---------------- Phone Frame ---------------- */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  // Frame ini cuma buat preview "app di dalam bingkai HP" pas dibuka di browser desktop/web.
  // Di native app (APK Android/iOS) ini bikin efek "HP di dalam HP" — layar beneran udah
  // full HP-nya, gak butuh border/status bar palsu lagi. Jadi native platform langsung
  // render children full-screen tanpa frame ini sama sekali.
  if (isNativePlatform()) {
    return <div className="relative h-screen w-full overflow-hidden bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/60 via-background to-muted/40 px-2 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-[420px] flex-col">
        <div className="relative mx-auto h-[calc(100vh-2rem)] max-h-[900px] w-full overflow-hidden rounded-[36px] border border-border bg-background shadow-elevated sm:h-[860px]">
          <StatusBar />
          <div className="h-[calc(100%-28px)]">{children}</div>
        </div>
      </div>
    </div>
  );
}

function StatusBar() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  );
  useEffect(() => {
    const t = setInterval(
      () => setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
      30_000,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex h-7 items-center justify-between px-6 pt-2 text-[11px] font-semibold tracking-wide text-foreground/70">
      <span>{time}</span>
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-foreground/50" />
        <span className="h-1.5 w-3 rounded-full bg-foreground/50" />
        <span className="h-2 w-4 rounded-sm border border-foreground/50" />
      </span>
    </div>
  );
}

/* ---------------- Auth ---------------- */
function AuthScreen() {
  const { login, register } = useSwayenAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      toast.success(mode === "login" ? "Selamat datang kembali" : "Akun berhasil dibuat");
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col justify-between px-6 pb-8 pt-10">
      <div>
        <SwayenLogo className="h-16 w-16 rounded-2xl shadow-coin" />
        <h1 className="mt-6 text-3xl font-black tracking-tight">Swayen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
        Kelola Energi, Kuasai Hari
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="mb-3 flex gap-1 rounded-full bg-muted p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-full py-2 text-sm font-semibold transition-all",
                mode === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {m === "login" ? "Masuk" : "Daftar"}
            </button>
          ))}
        </div>
        {mode === "register" && (
          <Input
            placeholder="Nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-12 rounded-2xl border-border bg-muted/60"
          />
        )}
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-12 rounded-2xl border-border bg-muted/60"
        />
        <Input
          type="password"
          placeholder="Password (min 8 karakter)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          className="h-12 rounded-2xl border-border bg-muted/60"
        />
        <Button
          type="submit"
          disabled={busy}
          className="h-12 w-full rounded-2xl bg-primary text-primary-foreground shadow-coin hover:bg-primary/90"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : mode === "login" ? (
            "Masuk"
          ) : (
            "Buat Akun"
          )}
        </Button>
        <p className="pt-2 text-center text-xs text-muted-foreground">
  Author:{" "}
  <a 
    href="https://gerrardtechs.github.io/Alessandro-Portfolio/" 
    target="_blank" 
    rel="noopener noreferrer"
    className="hover:text-foreground hover:underline"
  >
    <code className="rounded bg-muted px-1 cursor-pointer">
      Alessandro Farrel
    </code>
  </a>
</p>
      </form>
    </div>
  );
}

function SessionAlarmDialog({
  open,
  message,
  onDismiss,
}: {
  open: boolean;
  message: string;
  onDismiss: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Sesi Selesai</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <Button
          onClick={onDismiss}
          className="h-11 w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Got It
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Home ---------------- */
function HomeScreen() {
  const { user } = useSwayenAuth();
  const qc = useQueryClient();
  const quoteQ = useQuery({ queryKey: ["quote"], queryFn: api.quoteToday });
  const nightQ = useQuery({ queryKey: ["night"], queryFn: api.getNightToday });
  const engQ = useQuery({ queryKey: ["engagement"], queryFn: api.engagement });
  const activeQ = useQuery({
    queryKey: ["activeTimebox"],
    queryFn: api.getActiveTimebox,
    refetchInterval: 3000,
  });
  const { alarmOpen, alarmMessage, triggerAlarm, stopAlarm } = useSessionAlarm();
  const [now, setNow] = useState(Date.now());
  const napFinishedRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    const handleVis = () => setNow(Date.now());
    window.addEventListener("visibilitychange", handleVis);
    return () => {
      clearInterval(t);
      window.removeEventListener("visibilitychange", handleVis);
    };
  }, []);

  const activeSession = activeQ.data && !activeQ.data.endedAt ? activeQ.data : null;
  const sessionEndsAt = activeSession
    ? new Date(activeSession.startedAt).getTime() + activeSession.durationMinutes * 60_000
    : null;
  const napRemaining = sessionEndsAt ? Math.max(0, sessionEndsAt - now) : 0;

  // Jadwalkan alarm native begitu ada sesi aktif terdeteksi — dipasang via useEffect (bukan cuma
  // di onSuccess mutation) supaya tetap ke-cover kalau user reopen app dengan sesi yang udah
  // berjalan (mis. dari HomeScreen setelah mulai sesi dari TimeboxScreen).
  useEffect(() => {
    if (activeSession && sessionEndsAt) {
      void scheduleNativeAlarm(
        ALARM_IDS.TIMEBOX_SESSION,
        "Swayen",
        activeSession.isWuxiuNap ? "Nap Time sudah selesai!" : "TimeBox selesai! Sesi fokus kamu sudah berakhir.",
        new Date(sessionEndsAt),
      );
    }
  }, [activeSession?.id, sessionEndsAt]);

  const finishNap = useMutation({
    mutationFn: (sessionId: string) => api.finishTimebox(sessionId, "COMPLETED"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activeTimebox"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
      void cancelNativeAlarm(ALARM_IDS.TIMEBOX_SESSION);
      triggerAlarm("Nap Time sudah selesai!");
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyelesaikan nap"),
  });

  useEffect(() => {
    if (
      activeSession &&
      napRemaining === 0 &&
      !napFinishedRef.current &&
      !finishNap.isPending
    ) {
      napFinishedRef.current = true;
      finishNap.mutate(activeSession.id);
    }
  }, [activeSession, napRemaining, finishNap]);

  const wuxiu = useMutation({
    mutationFn: () => api.startWuxiu(),
    onSuccess: () => {
      napFinishedRef.current = false;
      qc.invalidateQueries({ queryKey: ["activeTimebox"] });
      toast.success("Wuxiu Nap 20 menit dimulai");
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal memulai"),
  });

  const slots = engQ.data?.suggestedNightPlanSlots ?? 5;
  const streak = nightQ.data?.streak ?? 0;
  const missed = nightQ.data?.missedNightCount ?? 0;

  return (
    <div className="space-y-4 px-5 pt-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Halo,</p>
          <h2 className="text-2xl font-black">{user?.name ?? "Sobat"}</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1.5 text-primary-foreground">
          <Flame className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground">{streak}</span>
          <span className="text-xs text-muted-foreground">hari</span>
        </div>
      </header>

      {/* Quote */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/25 blur-2xl" />
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Quote Hari Ini
        </div>
        {quoteQ.isLoading ? (
          <SkeletonLines n={2} />
        ) : quoteQ.data ? (
          <>
            <p className="mt-3 text-[15px] font-medium leading-relaxed text-card-foreground">
              "{quoteQ.data.quote}"
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              — {quoteQ.data.author}
              {quoteQ.data.source ? `, ${quoteQ.data.source}` : ""}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Quote belum tersedia.</p>
        )}
      </section>

      {/* Low Battery / Wuxiu */}
      <section className="rounded-3xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-warning/15 text-warning">
            <BatteryLow className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Low Battery?</p>
            <p className="truncate text-xs text-muted-foreground">
              {activeSession
                ? `${activeSession.isWuxiuNap ? "Wuxiu Nap" : "TimeBox Fokus"} — ${formatCountdown(napRemaining)} tersisa`
                : "Wuxiu Nap — istirahat total 20 menit."}
            </p>
          </div>
          {activeSession ? (
            <div className="shrink-0 rounded-full bg-foreground px-4 py-2 font-mono text-sm font-black tabular-nums text-background">
              {formatCountdown(napRemaining)}
            </div>
          ) : (
            <Button
              onClick={() => wuxiu.mutate()}
              disabled={wuxiu.isPending}
              className="h-9 shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              {wuxiu.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Nap 20m"}
            </Button>
          )}
        </div>
      </section>

      {/* Night Sentinel */}
      <NightSentinel
        loading={nightQ.isLoading}
        plan={nightQ.data?.plan ?? null}
        slots={slots}
        missed={missed}
        onRefresh={() => qc.invalidateQueries({ queryKey: ["night"] })}
      />

      {engQ.data?.isInactive && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            Kamu inactive {engQ.data.inactiveDays} hari. Mari mulai dengan satu TimeBox kecil.
          </p>
        </div>
      )}

      <SessionAlarmDialog open={alarmOpen} message={alarmMessage} onDismiss={stopAlarm} />
    </div>
  );
}

function NightSentinel({
  loading,
  plan,
  slots,
  missed,
  onRefresh,
}: {
  loading: boolean;
  plan: import("@/lib/swayen-api").NightPlan | null;
  slots: number;
  missed: number;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [tasks, setTasks] = useState<string[]>([]);

  useEffect(() => {
    if (plan) setTasks(plan.tasks);
    else setTasks(Array.from({ length: slots }, () => ""));
  }, [plan, slots]);

  const save = useMutation({
    mutationFn: (t: string[]) => api.saveNight(t),
    onSuccess: () => {
      toast.success("Rencana malam disimpan");
      setEditing(false);
      onRefresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyimpan"),
  });

  const complete = useMutation({
    mutationFn: () => api.completeNight(plan!.id),
    onSuccess: () => {
      toast.success("Ditandai selesai — streak berlanjut");
      onRefresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal"),
  });

  const toggleTask = useMutation({
    mutationFn: ({ index, completed }: { index: number; completed: boolean }) =>
      api.toggleNightTask(plan!.id, index, completed),
    onSuccess: (updated) => {
      if (updated.isCompleted) {
        toast.success("Semua rencana malam selesai — streak berlanjut");
      }
      onRefresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal memperbarui task"),
  });

  const completedTasks = plan ? plan.tasks.map((_, i) => plan.completedTasks?.[i] ?? false) : [];
  const checkedCount = plan
    ? plan.tasks.filter((_, i) => completedTasks[i]).length
    : 0;

  let statusText = `Rencana malam - ${slots} baris`;
  if (plan && plan.tasks.length > 0) {
    if (plan.isCompleted || (checkedCount === plan.tasks.length && checkedCount > 0)) {
      statusText = "Rencana malam - terselesaikan";
    } else {
      statusText = "Rencana malam - belum selesai";
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-coin">
            <Moon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold">Night Sentinel</p>
            <p className="text-[11px] text-muted-foreground">{statusText}</p>
          </div>
        </div>
        {plan && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {missed > 0 && !plan && (
        <div className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Melewatkan {missed} malam. Kita mulai lebih ringan malam ini.
        </div>
      )}

      {loading ? (
        <SkeletonLines n={4} />
      ) : plan && !editing ? (
        <ul className="mt-4 space-y-2">
          {plan.tasks.map((t, i) => {
            const checked = completedTasks[i] ?? false;
            return (
              <li key={`${plan.id}-${i}`}>
                <button
                  type="button"
                  disabled={toggleTask.isPending}
                  onClick={() => toggleTask.mutate({ index: i, completed: !checked })}
                  className="flex w-full items-center gap-3 rounded-2xl bg-muted/60 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted disabled:opacity-60"
                >
                  {checked ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate",
                      checked && "line-through text-muted-foreground",
                    )}
                  >
                    {t}
                  </span>
                </button>
              </li>
            );
          })}
          {!plan.isCompleted && checkedCount > 0 && checkedCount < plan.tasks.length && (
            <p className="pt-1 text-center text-[11px] text-muted-foreground">
              {checkedCount}/{plan.tasks.length} selesai
            </p>
          )}
          {!plan.isCompleted && checkedCount === plan.tasks.length && plan.tasks.length > 0 && (
            <Button
              onClick={() => complete.mutate()}
              disabled={complete.isPending}
              className="mt-2 h-11 w-full rounded-2xl bg-primary text-primary-foreground shadow-coin hover:bg-primary/90"
            >
              {complete.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Tandai Selesai"
              )}
            </Button>
          )}
        </ul>
      ) : (
        <div className="mt-4 space-y-2">
          {tasks.slice(0, slots).map((t, i) => (
            <Input
              key={i}
              value={t}
              onChange={(e) => {
                const next = [...tasks];
                next[i] = e.target.value;
                setTasks(next);
              }}
              placeholder={`Rencana ${i + 1}`}
              maxLength={200}
              className="h-11 rounded-2xl border-border bg-muted/60"
            />
          ))}
          <div className="flex gap-2 pt-1">
            {editing && (
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
                className="h-11 flex-1 rounded-2xl"
              >
                Batal
              </Button>
            )}
            <Button
              onClick={() => save.mutate(tasks.map((t) => t.trim()).filter(Boolean))}
              disabled={save.isPending || tasks.every((t) => !t.trim())}
              className="h-11 flex-1 rounded-2xl bg-primary text-primary-foreground shadow-coin hover:bg-primary/90"
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------- TimeBox ---------------- */
function TimeboxScreen() {
  const qc = useQueryClient();
  const [duration, setDuration] = useState(45);
  const activeQ = useQuery({
    queryKey: ["activeTimebox"],
    queryFn: api.getActiveTimebox,
    refetchInterval: 3000,
  });
  const [now, setNow] = useState(Date.now());
  const [rewardCoinCount, setRewardCoinCount] = useState<number | null>(null);
  const finishedRef = useRef(false);
  const { alarmOpen, alarmMessage, triggerAlarm, stopAlarm } = useSessionAlarm();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    const handleVis = () => setNow(Date.now());
    window.addEventListener("visibilitychange", handleVis);
    return () => {
      clearInterval(t);
      window.removeEventListener("visibilitychange", handleVis);
    };
  }, []);

  const activeSession = activeQ.data && !activeQ.data.endedAt ? activeQ.data : null;
  const sessionEndsAt = activeSession
    ? new Date(activeSession.startedAt).getTime() + activeSession.durationMinutes * 60_000
    : null;
  const remaining = sessionEndsAt ? Math.max(0, sessionEndsAt - now) : 0;
  const totalMs = activeSession ? activeSession.durationMinutes * 60_000 : 1;
  const progress = activeSession ? 1 - remaining / totalMs : 0;

  useEffect(() => {
    if (activeSession && sessionEndsAt) {
      void scheduleNativeAlarm(
        ALARM_IDS.TIMEBOX_SESSION,
        "Swayen",
        activeSession.isWuxiuNap ? "Nap Time sudah selesai!" : "TimeBox selesai! Sesi fokus kamu sudah berakhir.",
        new Date(sessionEndsAt),
      );
    }
  }, [activeSession?.id, sessionEndsAt]);

  const start = useMutation({
    mutationFn: () => api.startTimebox(duration),
    onSuccess: () => {
      finishedRef.current = false;
      qc.invalidateQueries({ queryKey: ["activeTimebox"] });
      toast.success("Fokus dimulai. Semua koin dibisukan.");
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal memulai"),
  });

  const finish = useMutation({
    mutationFn: (status: "COMPLETED" | "INTERRUPTED") =>
      api.finishTimebox(activeSession!.id, status),
    onSuccess: (res, status) => {
      const wasWuxiu = activeSession?.isWuxiuNap ?? false;
      qc.invalidateQueries({ queryKey: ["activeTimebox"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
      void cancelNativeAlarm(ALARM_IDS.TIMEBOX_SESSION);
      if (status === "COMPLETED") {
        triggerAlarm(
          wasWuxiu ? "Nap Time sudah selesai!" : "TimeBox selesai! Sesi fokus kamu sudah berakhir.",
        );
      }
      if (res.coinsRewarded > 0) {
        setRewardCoinCount(res.coinsRewarded);
        setTimeout(() => setRewardCoinCount(null), 2500);
      } else if (status === "INTERRUPTED") {
        toast.info("Sesi diakhiri tanpa reward.");
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyelesaikan"),
  });

  // auto-finish when timer runs out
  useEffect(() => {
    if (activeSession && remaining === 0 && !finishedRef.current && !finish.isPending) {
      finishedRef.current = true;
      finish.mutate("COMPLETED");
    }
  }, [activeSession, remaining, finish]);

  const mm = Math.floor(remaining / 60_000).toString().padStart(2, "0");
  const ss = Math.floor((remaining % 60_000) / 1000).toString().padStart(2, "0");

  const size = 260;
  const r = (size - 20) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative flex flex-col items-center px-5 pt-6">
      <div className="w-full">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">TimeBox</p>
        <h2 className="text-2xl font-black">Mode Fokus</h2>
      </div>

      <div className="relative mt-8" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth={14}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - (activeSession ? progress : 0))}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-5xl font-black tabular-nums tracking-tight">
              {activeSession ? `${mm}:${ss}` : `${duration}:00`}
            </div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              {activeSession ? (activeSession.isWuxiuNap ? "Wuxiu Nap" : "Fokus aktif") : "siap fokus"}
            </div>
          </div>
        </div>
      </div>

      {!activeSession ? (
        <>
          <div className="mt-8 flex gap-2">
            {[25, 45, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                  duration === d
                    ? "bg-primary text-primary-foreground shadow-coin"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {d}m
              </button>
            ))}
          </div>
          <Button
            onClick={() => start.mutate()}
            disabled={start.isPending}
            className="mt-8 h-14 w-full rounded-2xl bg-primary text-primary-foreground shadow-coin hover:bg-primary/90"
          >
            {start.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2 text-base font-bold">
                <Play className="h-5 w-5" fill="currentColor" /> Mulai TimeBox
              </span>
            )}
          </Button>
        </>
      ) : (
        <div className="mt-8 w-full space-y-3">
          <div className="rounded-2xl bg-muted/60 px-4 py-3 text-center text-xs text-muted-foreground">
            🔕 Semua koin dibisukan sampai sesi selesai
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => finish.mutate("INTERRUPTED")}
              disabled={finish.isPending}
              className="h-14 flex-1 rounded-2xl"
            >
              <Square className="mr-1.5 h-4 w-4" /> Interrupt
            </Button>
            <Button
              onClick={() => finish.mutate("COMPLETED")}
              disabled={finish.isPending}
              className="h-14 flex-[1.4] rounded-2xl bg-primary text-primary-foreground shadow-coin hover:bg-primary/90"
            >
              {finish.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2 font-bold">
                  <Pause className="h-5 w-5" /> Finish
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {rewardCoinCount !== null && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="coin-pop flex flex-col items-center">
            <div className="grid h-32 w-32 place-items-center rounded-full bg-primary shadow-coin">
              <Coins className="h-16 w-16 text-primary-foreground" />
            </div>
            <p className="mt-4 text-xl font-black">+{rewardCoinCount} Swayen Coin</p>
          </div>
        </div>
      )}

      <SessionAlarmDialog open={alarmOpen} message={alarmMessage} onDismiss={stopAlarm} />
    </div>
  );
}

/* ---------------- Wallet ---------------- */
function WalletScreen() {
  const qc = useQueryClient();
  const bal = useQuery({ queryKey: ["balance"], queryFn: api.getBalance });
  const hob = useQuery({ queryKey: ["hobbies"], queryFn: api.getHobbies });
  const [adding, setAdding] = useState(false);
  const [spendTarget, setSpendTarget] = useState<Hobby | null>(null);

  const spend = useMutation({
    mutationFn: (h: Hobby) =>
      api.spend({
        hobbyId: h.id,
        activityName: `${h.title} ${h.durationMinutes} menit`,
        amount: 1,
      }),
    onSuccess: (res, h) => {
      toast.success(`Sisa saldo ${res.balance} koin`);
      qc.invalidateQueries({ queryKey: ["balance"] });
      setSpendTarget(null);
      scheduleHobbyReminder(h.title, h.durationMinutes);
      if (h.deepLinkUrl) {
        // Custom URL scheme (mis. "duolingo://", "kindle://") harus lewat location.href
        // supaya OS/browser bisa handoff ke native app. Untuk https biasa (universal link),
        // buka tab baru supaya PWA Swayen sendiri tidak ke-navigate away.
        if (/^https?:\/\//i.test(h.deepLinkUrl)) {
          window.open(h.deepLinkUrl, "_blank", "noopener,noreferrer");
        } else {
          window.location.href = h.deepLinkUrl;
        }
      }
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Gagal menggunakan koin");
      setSpendTarget(null);
    },
  });

  return (
    <div className="space-y-5 px-5 pt-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Swayen Wallet</p>
        <h2 className="text-2xl font-black">Dompet Koin</h2>
      </header>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 shadow-coin">
        <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
        <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70">
          Saldo
        </p>
        <div className="mt-2 flex items-end gap-2 text-primary-foreground">
          <span className="text-6xl font-black tabular-nums leading-none">
            {bal.data?.balance ?? "—"}
          </span>
          <span className="pb-2 text-sm font-bold">koin</span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-primary-foreground/80">
          <Coins className="h-4 w-4" />1 koin = 1 TimeBox selesai
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">Quick-Start Hobbies</h3>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-semibold text-primary"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah
          </button>
        </div>
        {hob.isLoading ? (
          <SkeletonLines n={3} />
        ) : (hob.data?.length ?? 0) === 0 ? (
          <EmptyCard>Belum ada hobi. Tambahkan yang berdurasi 10-15 menit.</EmptyCard>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {hob.data!.map((h: any) => (
              <li
                key={h.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-card"
              >
                <div>
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <p className="mt-3 truncate text-sm font-bold">{h.title}</p>
                  <p className="text-[11px] text-muted-foreground">{h.durationMinutes} menit</p>
                </div>
                <Button
                  onClick={() => setSpendTarget(h)}
                  className="mt-3 h-9 w-full rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
                >
                  Spend 1
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold">Riwayat Terbaru</h3>
        {bal.isLoading ? (
          <SkeletonLines n={3} />
        ) : (bal.data?.transactions.length ?? 0) === 0 ? (
          <EmptyCard>Belum ada transaksi.</EmptyCard>
        ) : (
          <ul className="space-y-2">
            {bal.data!.transactions.map((t: any) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-card"
              >
                <div
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                    t.type === "EARNED"
                      ? "bg-success/15 text-success"
                      : "bg-warning/15 text-warning",
                  )}
                >
                  {t.type === "EARNED" ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{t.activityName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(t.createdAt).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-black tabular-nums",
                    t.type === "EARNED" ? "text-success" : "text-warning",
                  )}
                >
                  {t.type === "EARNED" ? "+" : "-"}
                  {t.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddHobbyDialog
        open={adding}
        onClose={() => setAdding(false)}
        onDone={() => qc.invalidateQueries({ queryKey: ["hobbies"] })}
      />

      <Dialog open={!!spendTarget} onOpenChange={(o) => !o && setSpendTarget(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Gunakan 1 koin?</DialogTitle>
            <DialogDescription>
              {spendTarget?.title} — {spendTarget?.durationMinutes} menit. Setelah dipakai, mulai
              aktivitasnya sekarang tanpa rasa bersalah.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-2xl"
              onClick={() => setSpendTarget(null)}
            >
              Batal
            </Button>
            <Button
              className="flex-1 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => spendTarget && spend.mutate(spendTarget)}
              disabled={spend.isPending}
            >
              {spend.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya, pakai"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddHobbyDialog({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [dur, setDur] = useState(15);
  const [link, setLink] = useState("");
  const add = useMutation({
    mutationFn: () =>
      api.addHobby({
        title,
        durationMinutes: dur,
        deepLinkUrl: link.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Hobi ditambahkan");
      setTitle("");
      setLink("");
      onDone();
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal"),
  });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Tambah Quick Hobby</DialogTitle>
          <DialogDescription>Aktivitas ringan 10–15 menit yang kamu suka.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Contoh: Baca 5 halaman"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 rounded-2xl"
          />
          <div className="flex gap-2">
            {[10, 15, 20, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDur(d)}
                className={cn(
                  "flex-1 rounded-full py-2 text-sm font-semibold",
                  dur === d
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {d}m
              </button>
            ))}
          </div>
          <Input
            placeholder="Deep link opsional (mis. spotify://)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="h-11 rounded-2xl"
          />
          <Button
            onClick={() => add.mutate()}
            disabled={!title.trim() || add.isPending}
            className="h-11 w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Profile ---------------- */
function ProfileScreen() {
  const { user, logout } = useSwayenAuth();
  const { theme, toggle } = useTheme();
  const eng = useQuery({ queryKey: ["engagement"], queryFn: api.engagement });
  const bal = useQuery({ queryKey: ["balance"], queryFn: api.getBalance });

  return (
    <div className="space-y-5 px-5 pt-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Profile</p>
        <h2 className="text-2xl font-black">Akun & Status</h2>
      </header>

      <section className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-coin">
          <span className="text-xl font-black">
            {user?.name?.[0]?.toUpperCase() ?? "S"}
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-black">{user?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatCard label="Saldo" value={String(bal.data?.balance ?? "—")} icon={<Coins className="h-4 w-4" />} />
        <StatCard
          label="Inactive"
          value={eng.data ? `${eng.data.inactiveDays}h` : "—"}
          icon={<Flame className="h-4 w-4" />}
        />
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <p className="text-sm font-bold">Status Engagement</p>
        {eng.isLoading ? (
          <SkeletonLines n={2} />
        ) : eng.data ? (
          <div className="mt-3 space-y-2 text-sm">
            <Row k="Tier re-engagement" v={eng.data.reengagementTier} />
            <Row k="Malam terlewat" v={String(eng.data.missedNightCount)} />
            <Row k="Slot rencana malam" v={String(eng.data.suggestedNightPlanSlots)} />
            <Row
              k="Kurangi beban malam"
              v={eng.data.shouldReduceNightPlanLoad ? "Ya" : "Tidak"}
            />
          </div>
        ) : null}
        {eng.data?.isInactive && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
            Kamu belum aktif selama {eng.data.inactiveDays} hari.
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-card p-2 shadow-card">
        <button
          onClick={toggle}
          className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-muted"
        >
          <span className="flex items-center gap-3">
            {theme === "dark" ? (
              <Moon className="h-4 w-4 text-primary" />
            ) : (
              <Sun className="h-4 w-4 text-primary" />
            )}
            Tema {theme === "dark" ? "Gelap" : "Terang"}
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            Ganti
          </span>
        </button>
        <button
          onClick={logout}
          className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10"
        >
          <span className="flex items-center gap-3">
            <LogOut className="h-4 w-4" /> Keluar
          </span>
        </button>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-bold">{v}</span>
    </div>
  );
}
function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-2 text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}
function SkeletonLines({ n }: { n: number }) {
  return (
    <div className="mt-3 space-y-2">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-3 animate-pulse rounded-full bg-muted" />
      ))}
    </div>
  );
}
function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

/* ---------------- Bottom Nav ---------------- */
function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "timebox", label: "TimeBox", icon: Timer },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "profile", label: "Profile", icon: User },
  ];
  return (
    <nav className="absolute inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 pb-2 pt-1 backdrop-blur-xl">
      <div className="mx-auto grid max-w-[380px] grid-cols-4">
        {items.map((it) => {
          const active = it.id === tab;
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              className="relative flex flex-col items-center gap-1 py-2 text-[11px] font-semibold"
            >
              <span
                className={cn(
                  "grid h-9 w-16 place-items-center rounded-2xl transition-all duration-300",
                  active ? "bg-primary text-primary-foreground shadow-coin" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className={cn(active ? "text-foreground" : "text-muted-foreground")}>
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mx-auto mt-1 h-1 w-32 rounded-full bg-foreground/30" />
    </nav>
  );
}
