"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { Product } from "@/libs/products";

export default function NavigatingOverlay({
  product,
}: {
  product: Product | null;
}) {
  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
            className="relative rounded-3xl px-6 py-7 mx-6 max-w-[240px] w-full shadow-2xl text-center border"
            style={{
              background: "var(--cream)",
              borderColor: "var(--border)",
            }}
          >
            <div className="w-14 h-14 mx-auto mb-4 relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 0.8,
                  ease: "linear",
                }}
                className="absolute -inset-1 rounded-full border-2"
                style={{
                  borderColor: "var(--border)",
                  borderTopColor: "var(--rose)",
                }}
              />
              <div
                className="absolute inset-0 rounded-full overflow-hidden"
                style={{ background: "var(--surface)" }}
              >
                <Image
                  src={product.image_urls[0] || "/placeholder.png"}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            </div>
            <p
              className="text-[13px] font-semibold mb-0.5"
              style={{ color: "var(--ink)" }}
            >
              Đang mở sản phẩm
            </p>
            <p
              className="text-[11px] line-clamp-1 px-2"
              style={{ color: "var(--muted)" }}
            >
              {product.title}
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -3, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.45,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                  className="block w-1 h-1 rounded-full"
                  style={{ background: "var(--rose)" }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
