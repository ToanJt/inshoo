"use client";
// ════════════════════════════════════════════════════════════════
// CART PAGE — Coming Soon (minimal)
// ════════════════════════════════════════════════════════════════
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight, Instagram } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export default function CartPage() {
  return (
    <div
      className="inshoo-root min-h-screen"
      style={{ background: "var(--surface)" }}
    >
      <div
        className="max-w-md mx-auto min-h-screen relative shadow-[0_0_60px_-10px_rgba(0,0,0,0.08)]"
        style={{ background: "var(--cream)" }}
      >
        <main className="pb-24 min-h-screen flex flex-col">
          {/* ── Header ── */}
          <header
            className="sticky top-0 z-40 backdrop-blur-2xl"
            style={{
              background: "color-mix(in srgb, var(--cream) 88%, transparent)",
              borderBottom:
                "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
            }}
          >
            <div className="flex items-center justify-center px-4 py-4">
              <h1
                className="f-display"
                style={{
                  fontSize: "19px",
                  fontWeight: 500,
                  color: "var(--ink)",
                }}
              >
                Giỏ hàng
              </h1>
            </div>
          </header>

          {/* ── Content ── */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 18, stiffness: 220 }}
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ background: "var(--surface)" }}
            >
              <ShoppingBag
                size={28}
                strokeWidth={1.5}
                style={{ color: "var(--rose)" }}
              />
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.45 }}
              className="text-center mb-8"
            >
              <h2
                className="f-display mb-2"
                style={{
                  fontSize: "22px",
                  fontWeight: 500,
                  color: "var(--ink)",
                }}
              >
                Sắp ra mắt
              </h2>
              <p
                className="text-[13px] leading-relaxed max-w-[220px]"
                style={{ color: "var(--muted)" }}
              >
                Tính năng giỏ hàng đang được hoàn thiện. Hiện tại bạn có thể đặt
                hàng qua Instagram nhé ♡
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.28, duration: 0.45 }}
              className="flex flex-col items-center gap-3 w-full max-w-[260px]"
            >
              <a
                href="https://www.instagram.com/bhann_68/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 rounded-full flex items-center justify-center gap-2 text-[13px] font-semibold active:scale-[0.97] transition-transform"
                style={{ background: "var(--ink)", color: "var(--cream)" }}
              >
                <Instagram size={14} />
                Đặt hàng qua @bhann_68
              </a>

              <Link
                href="/"
                className="flex items-center gap-1.5 text-[12px] font-medium active:opacity-70 transition-opacity"
                style={{ color: "var(--muted)" }}
              >
                Tiếp tục xem sản phẩm
                <ArrowRight size={13} />
              </Link>
            </motion.div>
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
