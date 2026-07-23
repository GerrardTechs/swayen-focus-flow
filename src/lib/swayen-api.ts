// Swayen API client. Talks to backend at http://localhost:4000/api/v1.
// Handles bearer auth + refresh-token rotation transparently.

const RAW_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SWAYEN_API_URL) ||
  "http://localhost:4000/api/v1";
export const API_BASE = RAW_BASE.replace(/\/$/, "");

const ACCESS_KEY = "swayen.access";
const REFRESH_KEY = "swayen.refresh";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  details?: Record<string, string[]>;
}

export class ApiError extends Error {
  status: number;
  details?: Record<string, string[]>;
  constructor(status: number, message: string, details?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const tokenStore = {
  get access() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    window.localStorage.setItem(ACCESS_KEY, access);
    window.localStorage.setItem(REFRESH_KEY, refresh);
    window.dispatchEvent(new Event("swayen-auth-change"));
  },
  clear() {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.dispatchEvent(new Event("swayen-auth-change"));
  },
};

let refreshInFlight: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const json = (await res.json().catch(() => null)) as ApiEnvelope<{
      accessToken: string;
      refreshToken: string;
    }> | null;
    if (!res.ok || !json?.data?.accessToken) {
      tokenStore.clear();
      return null;
    }
    tokenStore.set(json.data.accessToken, json.data.refreshToken);
    return json.data.accessToken;
  } catch {
    return null;
  }
}

interface RequestOpts {
  method?: string;
  body?: unknown;
  auth?: boolean;
  _retry?: boolean;
}

export async function apiRequest<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { method = "GET", body, auth = true, _retry = false } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && tokenStore.access) headers["Authorization"] = `Bearer ${tokenStore.access}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError(0, "Tidak bisa terhubung ke server. Pastikan backend berjalan di " + API_BASE);
  }

  if (res.status === 401 && auth && !_retry && tokenStore.refresh) {
    refreshInFlight = refreshInFlight ?? doRefresh();
    const newToken = await refreshInFlight;
    refreshInFlight = null;
    if (newToken) return apiRequest<T>(path, { ...opts, _retry: true });
    throw new ApiError(401, "Sesi berakhir. Silakan login lagi.");
  }

  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !json?.success) {
    throw new ApiError(res.status, json?.message ?? `Request gagal (${res.status})`, json?.details);
  }
  return json.data;
}

// ---------- Types ----------
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  lastActiveAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface AuthPayload {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}
export interface NightPlan {
  id: string;
  userId?: string;
  date: string;
  tasks: string[];
  isCompleted: boolean;
  missedCount: number;
  createdAt?: string;
}
export interface NightPlannerToday {
  plan: NightPlan | null;
  missedNightCount: number;
  streak: number;
}
export interface TimeBoxSession {
  id: string;
  durationMinutes: number;
  status: "COMPLETED" | "INTERRUPTED";
  isWuxiuNap: boolean;
  startedAt: string;
  endedAt: string | null;
}
export interface Quote {
  id: string;
  quote: string;
  author: string;
  source?: string;
  showDate?: string;
}
export interface CoinTransaction {
  id: string;
  type: "EARNED" | "SPENT";
  amount: number;
  activityName: string;
  createdAt: string;
}
export interface Wallet {
  balance: number;
  transactions: CoinTransaction[];
}
export interface Hobby {
  id: string;
  title: string;
  durationMinutes: number;
  deepLinkUrl: string | null;
  createdAt?: string;
}
export interface EngagementStatus {
  isInactive: boolean;
  inactiveDays: number;
  reengagementTier: "NONE" | "H3" | "H7";
  missedNightCount: number;
  shouldReduceNightPlanLoad: boolean;
  suggestedNightPlanSlots: number;
}

// ---------- Endpoint helpers ----------
export const api = {
  // auth
  register: (b: { email: string; password: string; name: string }) =>
    apiRequest<AuthPayload>("/auth/register", { method: "POST", body: b, auth: false }),
  login: (b: { email: string; password: string }) =>
    apiRequest<AuthPayload>("/auth/login", { method: "POST", body: b, auth: false }),
  logout: () => {
    const rt = tokenStore.refresh;
    return rt
      ? apiRequest<null>("/auth/logout", { method: "POST", body: { refreshToken: rt }, auth: false })
      : Promise.resolve(null as any);
  },
  me: () => apiRequest<AuthUser>("/users/me"),

  // night planner
  getNightToday: () => apiRequest<NightPlannerToday>("/night-planner/today"),
  saveNight: (tasks: string[]) =>
    apiRequest<NightPlan>("/night-planner", { method: "POST", body: { tasks } }),
  completeNight: (id: string) =>
    apiRequest<NightPlan>(`/night-planner/${id}/complete`, { method: "PATCH" }),

  // timebox
  startTimebox: (durationMinutes = 45) =>
    apiRequest<TimeBoxSession>("/timebox/start", { method: "POST", body: { durationMinutes } }),
  startWuxiu: () => apiRequest<TimeBoxSession>("/timebox/wuxiu", { method: "POST", body: {} }),
  finishTimebox: (sessionId: string, status: "COMPLETED" | "INTERRUPTED" = "COMPLETED") =>
    apiRequest<{ session: TimeBoxSession; coinsRewarded: number }>("/timebox/finish", {
      method: "POST",
      body: { sessionId, status },
    }),

  // wallet
  getBalance: () => apiRequest<Wallet>("/swayen/balance"),
  getHobbies: () => apiRequest<Hobby[]>("/swayen/hobbies"),
  addHobby: (b: { title: string; durationMinutes: number; deepLinkUrl?: string }) =>
    apiRequest<Hobby>("/swayen/hobbies", { method: "POST", body: b }),
  spend: (b: { hobbyId?: string; activityName: string; amount: number }) =>
    apiRequest<{ id: string; balance: number; updatedAt: string }>("/swayen/spend", {
      method: "POST",
      body: b,
    }),

  // system
  quoteToday: () => apiRequest<Quote>("/system/quotes/today", { auth: false }),
  engagement: () => apiRequest<EngagementStatus>("/system/engagement-status"),
};
