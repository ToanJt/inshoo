"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */
const BACKEND =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";
const LS_TOKEN = "inshoo_token";
const LS_CUSTOMER = "inshoo_customer"; // ← cache customer để restore instant

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
export type Customer = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  metadata?: Record<string, unknown>;
};

type RegisterData = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

type AuthCtx = {
  customer: Customer | null;
  token: string | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateCustomerMeta: (meta: Record<string, unknown>) => Promise<void>;
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
async function medusaFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...rest } = options;
  const res = await fetch(`${BACKEND}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PUB_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
  return json as T;
}

/** Medusa v2 có thể trả về "token" hoặc "access_token" */
function extractToken(json: Record<string, unknown>): string {
  const t = json.token ?? json.access_token;
  if (typeof t !== "string" || !t) throw new Error("No token in response");
  return t;
}

function readLocalCustomer(): Customer | null {
  try {
    const raw = localStorage.getItem(LS_CUSTOMER);
    return raw ? (JSON.parse(raw) as Customer) : null;
  } catch {
    return null;
  }
}

function persistLocal(token: string, customer: Customer) {
  localStorage.setItem(LS_TOKEN, token);
  localStorage.setItem(LS_CUSTOMER, JSON.stringify(customer));
}

function clearLocal() {
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_CUSTOMER);
}

/* ─────────────────────────────────────────────
   CONTEXT
───────────────────────────────────────────── */
const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const savedToken = localStorage.getItem(LS_TOKEN);
    if (!savedToken) {
      setAuthLoading(false);
      return;
    }

    const cachedCustomer = readLocalCustomer();

    // Hiện ngay từ cache, không block UI
    if (cachedCustomer) {
      setToken(savedToken);
      setCustomer(cachedCustomer);
      setAuthLoading(false);
    }

    // Verify ngầm với server
    medusaFetch<{ customer: Customer }>("/store/customers/me", {
      token: savedToken,
    })
      .then(({ customer: fresh }) => {
        setToken(savedToken);
        setCustomer(fresh);
        persistLocal(savedToken, fresh);
      })
      .catch(() => {
        // Token thật sự expired → logout
        clearLocal();
        setToken(null);
        setCustomer(null);
      })
      .finally(() => {
        if (!cachedCustomer) setAuthLoading(false);
      });
  }, []);

  const applySession = useCallback((t: string, c: Customer) => {
    persistLocal(t, c);
    setToken(t);
    setCustomer(c);
  }, []);

  /* ── LOGIN ── */
  const login = useCallback(
    async (email: string, password: string) => {
      const raw = await medusaFetch<Record<string, unknown>>(
        "/auth/customer/emailpass",
        { method: "POST", body: JSON.stringify({ email, password }) },
      );
      const t = extractToken(raw);
      const { customer: c } = await medusaFetch<{ customer: Customer }>(
        "/store/customers/me",
        { token: t },
      );
      applySession(t, c);
    },
    [applySession],
  );

  // libs/auth-context.tsx — chỉ thay đổi hàm register

  /* ── REGISTER ── */
  const register = useCallback(
    async (data: RegisterData) => {
      let registrationToken: string;

      try {
        // Bước 1: Tạo auth credentials
        const authRaw = await medusaFetch<Record<string, unknown>>(
          "/auth/customer/emailpass/register",
          {
            method: "POST",
            body: JSON.stringify({
              email: data.email,
              password: data.password,
            }),
          },
        );
        registrationToken = extractToken(authRaw);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        // Auth đã tồn tại (lần trước register bị lỗi giữa chừng)
        // → Thử login để tiếp tục tạo customer profile
        if (msg.toLowerCase().includes("exist")) {
          await login(data.email, data.password);
          return; // login đã applySession, flow kết thúc ở đây
        }
        throw err;
      }

      try {
        // Bước 2: Tạo customer profile
        await medusaFetch<{ customer: Customer }>("/store/customers", {
          method: "POST",
          token: registrationToken,
          body: JSON.stringify({
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
          }),
        });
      } catch {
        // Profile tạo thất bại nhưng auth đã tồn tại
        // → Vẫn login được, đánh dấu là "new account" để context biết merge
        await login(data.email, data.password);
        return;
      }

      // Bước 3: Login để lấy session token thật sự
      await login(data.email, data.password);
    },
    [login], // login đã được define trước register
  );

  /* ── LOGOUT ── */
  const logout = useCallback(() => {
    clearLocal();
    setToken(null);
    setCustomer(null);
  }, []);

  /* ── UPDATE METADATA ── */
  const updateCustomerMeta = useCallback(
    async (meta: Record<string, unknown>) => {
      if (!token || !customer) return;
      const { customer: updated } = await medusaFetch<{ customer: Customer }>(
        "/store/customers/me",
        {
          method: "POST",
          token,
          body: JSON.stringify({ metadata: meta }),
        },
      );
      setCustomer(updated);
      persistLocal(token, updated); // sync cache
    },
    [token, customer],
  );

  return (
    <AuthContext.Provider
      value={{
        customer,
        token,
        authLoading,
        login,
        register,
        logout,
        updateCustomerMeta,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
