// BottomNav.tsx
"use client";

import { Home, ShoppingBag, User, Heart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Trang chủ" },
  { href: "/cart", icon: ShoppingBag, label: "Giỏ hàng", hasBadge: true },
  { href: "/favorites", icon: Heart, label: "Yêu thích", isHeart: true },
  { href: "/profile", icon: User, label: "Tôi" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [cartCount] = useState(3);

  return (
    <>
      {/* ── Fade gradient (giữ nguyên kiểu glass, dùng var(--cream)) ── */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-24 pointer-events-none z-40"
        style={{
          background:
            "linear-gradient(to top, var(--cream) 0%, color-mix(in srgb, var(--cream) 60%, transparent) 60%, transparent 100%)",
        }}
      />

      {/* ── Nav bar ── */}
      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-[calc(28rem-1.5rem)] z-50">
        <div className="relative">
          {/* Glass background — dùng var(--cream) với opacity */}
          <div
            className="absolute inset-0 rounded-[22px] backdrop-blur-2xl border shadow-[0_4px_24px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.04)]"
            style={{
              background: "color-mix(in srgb, var(--cream) 75%, transparent)",
              borderColor: "color-mix(in srgb, var(--border) 80%, transparent)",
            }}
          />

          {/* Top highlight */}
          <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent rounded-full" />

          {/* Nav items */}
          <div className="relative flex items-center justify-around px-1 py-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const badge = item.hasBadge ? cartCount : undefined;

              // Active bg: Heart → var(--rose), others → var(--ink)
              const activeBg = item.isHeart ? "var(--rose)" : "var(--ink)";
              const activeShadow = item.isHeart
                ? "0 4px 12px color-mix(in srgb, var(--rose) 35%, transparent)"
                : "0 4px 12px color-mix(in srgb, var(--ink) 20%, transparent)";
              const labelColor = isActive
                ? item.isHeart
                  ? "var(--rose)"
                  : "var(--ink)"
                : "var(--muted)";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex-1 flex justify-center"
                >
                  <div className="relative flex flex-col items-center gap-[3px] py-1.5">
                    {/* Icon container */}
                    <div
                      className="relative p-2 rounded-xl transition-all duration-300"
                      style={{
                        background: isActive ? activeBg : "transparent",
                        boxShadow: isActive ? activeShadow : "none",
                        transform: isActive ? "scale(1.08)" : "scale(1)",
                      }}
                    >
                      {/* Shine overlay */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent" />
                        </div>
                      )}

                      <Icon
                        size={19}
                        strokeWidth={isActive ? 2.3 : 1.7}
                        style={{
                          color: isActive ? "var(--cream)" : "var(--muted)",
                          fill:
                            isActive && item.isHeart
                              ? "var(--cream)"
                              : "transparent",
                          transition: "color 0.25s, fill 0.25s",
                        }}
                      />

                      {/* Badge */}
                      {badge != null && badge > 0 && (
                        <span
                          className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold leading-none shadow-sm"
                          style={{
                            background: isActive
                              ? "var(--cream)"
                              : "var(--rose)",
                            color: isActive ? "var(--ink)" : "var(--cream)",
                          }}
                        >
                          {badge > 9 ? "9+" : badge}
                        </span>
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className="text-[9px] font-medium leading-none transition-colors duration-300"
                      style={{ color: labelColor }}
                    >
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
