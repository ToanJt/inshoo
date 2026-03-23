"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Package,
  Heart,
  MapPin,
  CreditCard,
  HelpCircle,
  Settings,
  LogOut,
  Star,
  Bell,
  Shield,
  Gift,
  User,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/libs/auth-context";
import { useFavorites } from "@/libs/favorites-context";

/* ─── Types ─── */
type MenuItem = {
  icon: React.ElementType;
  label: string;
  desc?: string;
  href?: string;
  badge?: string;
  accent?: boolean;
};

const ORDER_STATS = [
  { label: "Chờ xác nhận", count: 1 },
  { label: "Đang giao", count: 2 },
  { label: "Đã giao", count: 12 },
  { label: "Đã huỷ", count: 0 },
];

/* ─────────────────────────────────────────────
   GUEST STATE
───────────────────────────────────────────── */
function GuestView({
  onOpenAuth,
}: {
  onOpenAuth: (tab: "login" | "register") => void;
}) {
  const { count } = useFavorites();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center">
      {/* Illustration */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20 }}
        className="relative mb-7"
      >
        <div
          className="absolute -inset-6 rounded-full blur-3xl opacity-40"
          style={{ background: "var(--blush)" }}
        />
        <div
          className="relative w-24 h-24 rounded-full flex items-center justify-center border"
          style={{ background: "var(--blush)", borderColor: "var(--border)" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "var(--cream)" }}
          >
            <User
              size={26}
              strokeWidth={1.5}
              style={{ color: "var(--rose)", opacity: 0.7 }}
            />
          </div>
          <motion.div
            animate={{ rotate: [0, 12, -12, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <Sparkles size={14} style={{ color: "var(--rose)" }} />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <h2
          className="f-display mb-2"
          style={{ fontSize: "22px", fontWeight: 500, color: "var(--ink)" }}
        >
          Đăng nhập để tiếp tục
        </h2>
        <p
          className="text-[13px] leading-relaxed mb-1"
          style={{ color: "var(--muted)" }}
        >
          Lưu sản phẩm yêu thích, theo dõi đơn hàng và cá nhân hoá trải nghiệm
          của bạn
        </p>

        {/* Hint: local favorites will sync */}
        {count > 0 && (
          <p
            className="text-[11px] mt-2 mb-5 px-3 py-1.5 rounded-full inline-block"
            style={{ background: "var(--rose-lt)", color: "var(--rose)" }}
          >
            ♡ {count} sản phẩm yêu thích sẽ được đồng bộ khi đăng nhập
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex flex-col gap-3 w-full max-w-[240px]"
      >
        <button
          onClick={() => onOpenAuth("login")}
          className="w-full h-12 rounded-full font-semibold text-[13px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          Đăng nhập
        </button>
        <button
          onClick={() => onOpenAuth("register")}
          className="w-full h-12 rounded-full font-semibold text-[13px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform border"
          style={{
            background: "transparent",
            color: "var(--ink)",
            borderColor: "var(--border)",
          }}
        >
          Tạo tài khoản mới{" "}
          <Sparkles size={13} style={{ color: "var(--rose)" }} />
        </button>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LOGGED IN STATE
───────────────────────────────────────────── */
function AuthenticatedView() {
  const router = useRouter();
  const { customer, logout } = useAuth();
  const { count: favCount } = useFavorites();

  const displayName = customer
    ? `${customer.first_name} ${customer.last_name}`.trim() || customer.email
    : "Người dùng";

  const initials = customer
    ? `${customer.first_name?.[0] ?? ""}${customer.last_name?.[0] ?? ""}`.toUpperCase() ||
      "U"
    : "U";

  const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
    {
      title: "Đơn hàng",
      items: [
        {
          icon: Package,
          label: "Đơn hàng của tôi",
          desc: "Xem tất cả đơn hàng",
          badge: "3",
          accent: true,
        },
        {
          icon: Heart,
          label: "Sản phẩm yêu thích",
          desc: `${favCount} sản phẩm`,
          href: "/favorites",
          accent: true,
        },
        { icon: Star, label: "Đánh giá của tôi", desc: "7 đánh giá" },
      ],
    },
    {
      title: "Tài khoản",
      items: [
        { icon: MapPin, label: "Địa chỉ giao hàng", desc: "2 địa chỉ đã lưu" },
        {
          icon: CreditCard,
          label: "Phương thức thanh toán",
          desc: "Visa ****4242",
        },
        {
          icon: Bell,
          label: "Thông báo",
          desc: "Quản lý thông báo",
          badge: "5",
        },
        {
          icon: Gift,
          label: "Mã giảm giá",
          desc: "3 mã khả dụng",
          badge: "3",
          accent: true,
        },
      ],
    },
    {
      title: "Khác",
      items: [
        { icon: Shield, label: "Chính sách bảo mật" },
        { icon: HelpCircle, label: "Trung tâm hỗ trợ" },
        { icon: Settings, label: "Cài đặt" },
      ],
    },
  ];

  return (
    <>
      {/* ── Profile header ── */}
      <div
        className="relative px-5 pt-14 pb-7"
        style={{ background: "var(--ink)" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-10 right-0 w-64 h-64 rounded-full blur-3xl opacity-20"
            style={{ background: "var(--rose)" }}
          />
        </div>

        <p
          className="f-display text-[11px] mb-5 relative tracking-widest"
          style={{
            color: "color-mix(in srgb, var(--cream) 40%, transparent)",
            fontStyle: "italic",
          }}
        >
          Inshoo
        </p>

        <div className="flex items-center gap-4 relative">
          {/* Avatar with initials fallback */}
          <div className="relative shrink-0">
            <div
              className="absolute -inset-1 rounded-full blur-sm opacity-60"
              style={{ background: "var(--rose)" }}
            />
            <div
              className="relative w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                border:
                  "3px solid color-mix(in srgb, var(--cream) 90%, transparent)",
              }}
            >
              <div
                className="w-full h-full flex items-center justify-center f-display text-lg"
                style={{ background: "var(--blush)", color: "var(--rose)" }}
              >
                {initials}
              </div>
            </div>
            <div
              className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-400"
              style={{ border: "2.5px solid var(--ink)" }}
            />
          </div>

          <div className="flex-1">
            <h1
              className="text-lg font-bold leading-tight"
              style={{ color: "var(--cream)" }}
            >
              {displayName}
            </h1>
            <p
              className="text-[12px] mt-0.5 truncate max-w-[180px]"
              style={{
                color: "color-mix(in srgb, var(--cream) 50%, transparent)",
              }}
            >
              {customer?.email}
            </p>
            <div className="mt-2">
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{
                  background:
                    "color-mix(in srgb, var(--rose) 20%, transparent)",
                  color: "var(--rose)",
                }}
              >
                VIP Member ✦
              </span>
            </div>
          </div>

          <button
            className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold active:scale-95 transition-transform shrink-0"
            style={{
              background: "color-mix(in srgb, var(--cream) 12%, transparent)",
              color: "color-mix(in srgb, var(--cream) 80%, transparent)",
              border:
                "1px solid color-mix(in srgb, var(--cream) 15%, transparent)",
            }}
          >
            Chỉnh sửa
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3 relative">
          {[
            { value: "15", label: "Đơn hàng" },
            { value: String(favCount), label: "Yêu thích" },
            { value: "128", label: "Xu thưởng" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center py-3 rounded-2xl"
              style={{
                background: "color-mix(in srgb, var(--cream) 7%, transparent)",
              }}
            >
              <p
                className="text-[18px] font-bold"
                style={{ color: "var(--cream)" }}
              >
                {stat.value}
              </p>
              <p
                className="text-[10px] mt-0.5"
                style={{
                  color: "color-mix(in srgb, var(--cream) 45%, transparent)",
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Order status bar ── */}
      <div className="px-4 -mt-4 relative z-10">
        <div
          className="grid grid-cols-4 gap-2 p-3 rounded-2xl border"
          style={{
            background: "var(--cream)",
            borderColor: "var(--border)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          {ORDER_STATS.map((s) => (
            <button
              key={s.label}
              className="flex flex-col items-center gap-1 py-1 active:scale-95 transition-transform"
            >
              <span
                className="text-[17px] font-bold"
                style={{ color: s.count > 0 ? "var(--ink)" : "var(--border)" }}
              >
                {s.count}
              </span>
              <span
                className="text-[9px] text-center leading-tight"
                style={{ color: "var(--muted)" }}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Menu sections ── */}
      <div className="px-4 pt-5 space-y-5">
        {MENU_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2
              className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1"
              style={{ color: "var(--muted)" }}
            >
              {section.title}
            </h2>
            <div
              className="rounded-2xl overflow-hidden border"
              style={{
                background: "var(--cream)",
                borderColor: "var(--border)",
              }}
            >
              {section.items.map((item, idx) => {
                const Icon = item.icon;
                const isLast = idx === section.items.length - 1;
                return (
                  <button
                    key={item.label}
                    onClick={() => item.href && router.push(item.href)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-opacity text-left"
                    style={{
                      borderBottom: isLast ? "none" : `1px solid var(--border)`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: item.accent
                          ? "var(--rose-lt)"
                          : "var(--surface)",
                      }}
                    >
                      <Icon
                        size={17}
                        style={{
                          color: item.accent ? "var(--rose)" : "var(--muted)",
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[13px] font-semibold"
                        style={{ color: "var(--ink)" }}
                      >
                        {item.label}
                      </p>
                      {item.desc && (
                        <p
                          className="text-[11px] mt-0.5 truncate"
                          style={{ color: "var(--muted)" }}
                        >
                          {item.desc}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span
                          className="min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{ background: "var(--rose)", color: "white" }}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        size={15}
                        style={{ color: "var(--border)" }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Logout ── */}
      <div className="px-4 pt-5 pb-4">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl active:scale-[0.98] transition-transform border"
          style={{
            background: "var(--rose-lt)",
            borderColor: "color-mix(in srgb, var(--rose) 20%, transparent)",
          }}
        >
          <LogOut size={16} style={{ color: "var(--rose)" }} />
          <span
            className="text-[13px] font-semibold"
            style={{ color: "var(--rose)" }}
          >
            Đăng xuất
          </span>
        </button>
        <p
          className="text-center text-[11px] mt-4"
          style={{ color: "var(--border)" }}
        >
          Inshoo v1.0.0
        </p>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export default function ProfilePage() {
  const { customer, authLoading } = useAuth();
  const [authModal, setAuthModal] = useState<{
    open: boolean;
    tab: "login" | "register";
  }>({
    open: false,
    tab: "login",
  });

  return (
    <div
      className="inshoo-root min-h-screen"
      style={{ background: "var(--surface)" }}
    >
      <div
        className="max-w-md mx-auto min-h-screen relative shadow-[0_0_60px_-10px_rgba(0,0,0,0.08)]"
        style={{ background: "var(--cream)" }}
      >
        <main className="pb-24 min-h-screen">
          {authLoading ? (
            /* Loading skeleton */
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="relative w-9 h-9">
                <div
                  className="absolute inset-0 rounded-full border-[1.5px] animate-spin"
                  style={{
                    borderColor: "var(--border)",
                    borderTopColor: "var(--rose)",
                  }}
                />
              </div>
            </div>
          ) : customer ? (
            <AuthenticatedView />
          ) : (
            <GuestView
              onOpenAuth={(tab) => setAuthModal({ open: true, tab })}
            />
          )}
        </main>

        <BottomNav />
      </div>

      <AuthModal
        open={authModal.open}
        defaultTab={authModal.tab}
        onClose={() => setAuthModal((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}
