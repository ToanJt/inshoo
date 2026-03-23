// AuthModal.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/libs/auth-context";
import { useFavorites } from "@/libs/favorites-context";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type Tab = "login" | "register";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultTab?: Tab;
};

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
function InputField({
  icon: Icon,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  suffix,
}: {
  icon: React.ElementType;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label
        className="block text-[10px] font-semibold tracking-[0.12em] uppercase mb-1.5"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </label>
      <div
        className="flex items-center gap-2.5 rounded-2xl px-4 h-12 transition-all duration-200"
        style={{
          background: focused ? "white" : "var(--surface)",
          boxShadow: focused
            ? `0 0 0 1.5px var(--rose), 0 4px 16px color-mix(in srgb, var(--rose) 10%, transparent)`
            : `0 0 0 1px var(--border)`,
        }}
      >
        <Icon
          size={14}
          style={{
            color: focused ? "var(--rose)" : "var(--muted)",
            flexShrink: 0,
          }}
        />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 bg-transparent outline-none text-[13px] placeholder:opacity-40"
          style={{ color: "var(--ink)" }}
        />
        {suffix}
      </div>
      {error && (
        <p className="mt-1 text-[11px]" style={{ color: "var(--rose)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   LOGIN FORM
───────────────────────────────────────────── */
function LoginForm({
  onSuccess,
  onSwitch,
}: {
  onSuccess: () => void;
  onSwitch: () => void;
}) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (!email || !password) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      onSuccess();
    } catch {
      setError("Email hoặc mật khẩu không đúng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <InputField
        icon={Mail}
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
      />
      <InputField
        icon={Lock}
        label="Mật khẩu"
        type={showPw ? "text" : "password"}
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        suffix={
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="shrink-0 transition-opacity active:opacity-60"
          >
            {showPw ? (
              <Eye size={14} style={{ color: "var(--muted)" }} />
            ) : (
              <EyeOff size={14} style={{ color: "var(--muted)" }} />
            )}
          </button>
        }
      />

      {error && (
        <p
          className="text-[12px] text-center py-2.5 rounded-xl"
          style={{ background: "var(--rose-lt)", color: "var(--rose)" }}
        >
          {error}
        </p>
      )}

      <button
        onClick={handle}
        disabled={loading}
        className="w-full h-12 rounded-2xl font-semibold text-[13px] flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] disabled:opacity-60"
        style={{ background: "var(--ink)", color: "var(--cream)" }}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            Đăng nhập <ArrowRight size={14} />
          </>
        )}
      </button>

      <p className="text-center text-[12px]" style={{ color: "var(--muted)" }}>
        Chưa có tài khoản?{" "}
        <button
          onClick={onSwitch}
          className="font-semibold transition-colors"
          style={{ color: "var(--rose)" }}
        >
          Đăng ký ngay
        </button>
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   REGISTER FORM
───────────────────────────────────────────── */
function RegisterForm({
  onSuccess,
  onSwitch,
}: {
  onSuccess: () => void;
  onSwitch: () => void;
}) {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { mergeGuestFavoritesAfterRegister } = useFavorites();
  const handle = async () => {
    if (!firstName || !email || !password) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (password.length < 8) {
      setError("Mật khẩu tối thiểu 8 ký tự.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      await mergeGuestFavoritesAfterRegister();
      onSuccess();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      setError(
        msg.includes("exists")
          ? "Email này đã được đăng ký."
          : "Đăng ký thất bại, thử lại nhé.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-2 gap-3">
        <InputField
          icon={User}
          label="Tên"
          value={firstName}
          onChange={setFirstName}
          placeholder="Linh"
        />
        <InputField
          icon={User}
          label="Họ"
          value={lastName}
          onChange={setLastName}
          placeholder="Nguyễn"
        />
      </div>
      <InputField
        icon={Mail}
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
      />
      <InputField
        icon={Lock}
        label="Mật khẩu"
        type={showPw ? "text" : "password"}
        value={password}
        onChange={setPassword}
        placeholder="Tối thiểu 8 ký tự"
        suffix={
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="shrink-0"
          >
            {showPw ? (
              <Eye size={14} style={{ color: "var(--muted)" }} />
            ) : (
              <EyeOff size={14} style={{ color: "var(--muted)" }} />
            )}
          </button>
        }
      />

      {error && (
        <p
          className="text-[12px] text-center py-2.5 rounded-xl"
          style={{ background: "var(--rose-lt)", color: "var(--rose)" }}
        >
          {error}
        </p>
      )}

      <button
        onClick={handle}
        disabled={loading}
        className="w-full h-12 rounded-2xl font-semibold text-[13px] flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-60"
        style={{ background: "var(--ink)", color: "var(--cream)" }}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            Tạo tài khoản <Sparkles size={14} />
          </>
        )}
      </button>

      <p className="text-center text-[12px]" style={{ color: "var(--muted)" }}>
        Đã có tài khoản?{" "}
        <button
          onClick={onSwitch}
          className="font-semibold"
          style={{ color: "var(--rose)" }}
        >
          Đăng nhập
        </button>
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODAL
───────────────────────────────────────────── */
export default function AuthModal({
  open,
  onClose,
  defaultTab = "login",
}: Props) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  useEffect(() => {
    if (open) setTab(defaultTab);
  }, [open, defaultTab]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[6px]" />

          {/* Sheet */}
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 340 }}
            className="relative w-full max-w-md mx-auto rounded-t-[32px] sm:rounded-[32px] px-6 pt-5 pb-10 shadow-2xl"
            style={{
              background: "var(--cream)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Handle (mobile) */}
            <div
              className="w-10 h-[3px] rounded-full mx-auto mb-5 sm:hidden"
              style={{ background: "var(--border)" }}
            />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: "var(--surface)" }}
            >
              <X size={14} style={{ color: "var(--muted)" }} />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="relative inline-block mb-3">
                <div
                  className="absolute -inset-3 rounded-full blur-2xl opacity-50"
                  style={{ background: "var(--blush)" }}
                />
                <p
                  className="f-display relative"
                  style={{
                    fontSize: "13px",
                    color: "var(--rose)",
                    letterSpacing: "0.15em",
                  }}
                >
                  ✦ Inshoo
                </p>
              </div>
              <h2
                className="f-display"
                style={{
                  fontSize: "26px",
                  fontWeight: 500,
                  color: "var(--ink)",
                }}
              >
                {tab === "login" ? "Chào mừng lại" : "Tạo tài khoản"}
              </h2>
              <p className="text-[12px] mt-1" style={{ color: "var(--muted)" }}>
                {tab === "login"
                  ? "Đăng nhập để lưu sản phẩm yêu thích ♡"
                  : "Tham gia Inshoo và khám phá phong cách của bạn"}
              </p>
            </div>

            {/* Tab switcher */}
            <div
              className="flex p-1 rounded-2xl mb-5"
              style={{ background: "var(--surface)" }}
            >
              {(["login", "register"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200"
                  style={
                    tab === t
                      ? {
                          background: "var(--cream)",
                          color: "var(--ink)",
                          boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
                        }
                      : { color: "var(--muted)" }
                  }
                >
                  {t === "login" ? "Đăng nhập" : "Đăng ký"}
                </button>
              ))}
            </div>

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: tab === "login" ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tab === "login" ? 10 : -10 }}
                transition={{ duration: 0.18 }}
              >
                {tab === "login" ? (
                  <LoginForm
                    onSuccess={onClose}
                    onSwitch={() => setTab("register")}
                  />
                ) : (
                  <RegisterForm
                    onSuccess={onClose}
                    onSwitch={() => setTab("login")}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
