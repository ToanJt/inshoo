"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowLeft, SlidersHorizontal, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { fmt, type Product } from "@/libs/products";
import { useFavorites } from "@/libs/favorites-context";
import { useProducts } from "@/libs/products-context";
import { SHIMMER_KEYFRAME, shimmerClass } from "@/libs/shimmer";
import NavigatingOverlay from "@/components/NavigatingOverlay";

const FILTER_TABS = [
  { id: "all", label: "Tất cả" },
  { id: "affiliate", label: "Shopee / Lazada" },
  { id: "order", label: "Pre-order" },
] as const;
type FilterId = (typeof FILTER_TABS)[number]["id"];

const IMG_H = ["h-52", "h-44", "h-56", "h-48", "h-60"];

/* ── Skeleton ── */
function FavoritesSkeleton() {
  return (
    <div className="px-3 pt-3">
      <style>{SHIMMER_KEYFRAME}</style>
      <div className="columns-2 gap-2.5">
        {IMG_H.map((h, i) => (
          <div key={i} className="break-inside-avoid mb-3">
            <div
              className={`${h} rounded-[18px] overflow-hidden relative`}
              style={{ background: "var(--surface)" }}
            >
              <div style={shimmerClass(`${i * 0.08}s`)} />
            </div>
            <div className="px-0.5 pt-2.5 space-y-2">
              <div
                className="relative h-3 rounded-full overflow-hidden"
                style={{ background: "var(--surface)", width: "80%" }}
              >
                <div style={shimmerClass(`${i * 0.08 + 0.1}s`)} />
              </div>
              <div
                className="relative h-3 rounded-full overflow-hidden"
                style={{ background: "var(--surface)", width: "45%" }}
              >
                <div style={shimmerClass(`${i * 0.08 + 0.2}s`)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Badge ── */
function FavBadge({ product }: { product: Product }) {
  if (product.metadata.product_type === "affiliate") return null;
  return (
    <span
      className="absolute top-2.5 left-2.5 text-[9px] font-semibold px-2 py-[3px] rounded-full text-white shadow-sm"
      style={{ background: "var(--ink)" }}
    >
      {product.metadata.deposit_amount ? "Pre-order" : "Hàng order"}
    </span>
  );
}

/* ── Card với press feedback ── */
function FavCard({
  product,
  idx,
  onNavigate,
  onRemove,
  isRemoving,
}: {
  product: Product;
  idx: number;
  onNavigate: (p: Product) => void;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}) {
  const h = IMG_H[idx % IMG_H.length];
  const [pressing, setPressing] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: isRemoving ? 0 : 1, scale: isRemoving ? 0.88 : 1 }}
      exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.2 } }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="break-inside-avoid mb-3"
    >
      <div
        className="group cursor-pointer"
        style={{ WebkitTapHighlightColor: "transparent" }}
        onMouseDown={() => setPressing(true)}
        onMouseUp={() => setPressing(false)}
        onMouseLeave={() => setPressing(false)}
        onTouchStart={() => setPressing(true)}
        onTouchEnd={() => setPressing(false)}
        onClick={() => onNavigate(product)}
      >
        <div
          className={`relative ${h} overflow-hidden rounded-[18px]`}
          style={{ background: "var(--surface)" }}
        >
          <Image
            src={product.image_urls[0] || "/placeholder.png"}
            alt={product.title}
            fill
            className="object-cover"
            style={{
              transform: pressing ? "scale(1.04)" : "scale(1)",
              transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            }}
            sizes="(max-width:448px) 50vw, 210px"
          />

          {/* Press overlay */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
            style={{
              background: "rgba(0,0,0,0.07)",
              opacity: pressing ? 1 : 0,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

          <FavBadge product={product} />

          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(product.id);
            }}
            whileTap={{ scale: 0.75 }}
            className="absolute top-2.5 right-2.5 w-[30px] h-[30px] rounded-full flex items-center justify-center"
            style={{ background: "var(--rose)", backdropFilter: "blur(8px)" }}
          >
            <Heart
              size={13}
              strokeWidth={2.5}
              style={{ color: "white", fill: "white" }}
            />
          </motion.button>
        </div>

        <div className="px-0.5 pt-2.5 space-y-1">
          <h3
            className="text-[12px] font-medium leading-snug line-clamp-2"
            style={{
              color: pressing ? "var(--rose)" : "var(--ink)",
              transition: "color 0.2s",
            }}
          >
            {product.title}
          </h3>
          {product.price > 0 ? (
            <span
              className="text-[13px] font-semibold"
              style={{ color: "var(--rose)" }}
            >
              {fmt(product.price)}
            </span>
          ) : (
            <span
              className="text-[11px] italic"
              style={{ color: "var(--muted)" }}
            >
              Liên hệ giá
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
/* ══════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════ */
export default function FavoritesPage() {
  const router = useRouter();
  const { favorites, toggle } = useFavorites();
  const { products, loading } = useProducts();
  const [, startTransition] = useTransition();

  const [filter, setFilter] = useState<FilterId>("all");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState<Product | null>(null);
  const [navigating, setNavigating] = useState<Product | null>(null);

  const allFavProducts = useMemo(
    () => products.filter((p) => favorites.has(p.id)),
    [products, favorites],
  );

  const countOf = useCallback(
    (id: FilterId) => {
      if (id === "all") return allFavProducts.length;
      return allFavProducts.filter((p) => p.metadata.product_type === id)
        .length;
    },
    [allFavProducts],
  );

  const list = useMemo(() => {
    if (filter === "all") return allFavProducts;
    return allFavProducts.filter((p) => p.metadata.product_type === filter);
  }, [allFavProducts, filter]);

  const removeFav = useCallback(
    (id: string) => {
      const item = allFavProducts.find((p) => p.id === id);
      if (!item) return;
      setRemovingId(id);
      setTimeout(() => {
        toggle(id);
        setRemovingId(null);
        setShowUndo(item);
        setTimeout(() => setShowUndo(null), 3500);
      }, 250);
    },
    [allFavProducts, toggle],
  );

  const undoRemove = useCallback(() => {
    if (!showUndo) return;
    toggle(showUndo.id);
    setShowUndo(null);
  }, [showUndo, toggle]);

  const handleNavigate = useCallback(
    (product: Product) => {
      setNavigating(product);
      startTransition(() => {
        setTimeout(() => router.push(`/product/${product.id}`), 380);
      });
    },
    [router],
  );

  return (
    <>
      <style>{SHIMMER_KEYFRAME}</style>
      <div
        className="inshoo-root min-h-screen"
        style={{ background: "var(--surface)" }}
      >
        <div
          className="max-w-md mx-auto min-h-screen relative shadow-[0_0_60px_-10px_rgba(0,0,0,0.08)]"
          style={{ background: "var(--cream)" }}
        >
          <main className="pb-24 min-h-screen">
            {/* ══ HEADER ══ */}
            <header
              className="sticky top-0 z-40 backdrop-blur-2xl"
              style={{
                background: "color-mix(in srgb, var(--cream) 88%, transparent)",
                borderBottom:
                  "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
              }}
            >
              <div className="flex items-center justify-between px-4 py-3.5">
                <button
                  onClick={() => router.back()}
                  className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: "var(--surface)" }}
                >
                  <ArrowLeft size={16} style={{ color: "var(--body)" }} />
                </button>
                <div className="text-center">
                  <h1
                    className="f-display leading-none"
                    style={{
                      fontSize: "19px",
                      fontWeight: 500,
                      color: "var(--ink)",
                    }}
                  >
                    Yêu thích
                  </h1>
                  <motion.p
                    key={allFavProducts.length}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] mt-0.5"
                    style={{ color: "var(--muted)" }}
                  >
                    {loading
                      ? "Đang tải..."
                      : `${allFavProducts.length} sản phẩm đã lưu`}
                  </motion.p>
                </div>
                <button
                  className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: "var(--surface)" }}
                >
                  <SlidersHorizontal
                    size={14}
                    style={{ color: "var(--muted)" }}
                  />
                </button>
              </div>

              {/* Filter tabs */}
              <div className="px-4 pb-3 flex gap-1.5">
                {FILTER_TABS.map((tab) => {
                  const on = tab.id === filter;
                  const count = countOf(tab.id);
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setFilter(tab.id)}
                      whileTap={{ scale: 0.94 }}
                      className="rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-all duration-200"
                      style={
                        on
                          ? { background: "var(--ink)", color: "var(--cream)" }
                          : {
                              background: "var(--surface)",
                              color: "var(--muted)",
                              border: "1px solid var(--border)",
                            }
                      }
                    >
                      {tab.label}
                      {count > 0 && (
                        <span
                          className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={
                            on
                              ? {
                                  background:
                                    "color-mix(in srgb, var(--cream) 20%, transparent)",
                                  color: "var(--cream)",
                                }
                              : {
                                  background: "var(--border)",
                                  color: "var(--body)",
                                }
                          }
                        >
                          {count}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </header>

            {/* ══ CONTENT ══ */}
            {loading ? (
              <FavoritesSkeleton />
            ) : list.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center pt-28 px-8"
              >
                <div className="relative mb-6">
                  <div
                    className="absolute -inset-5 rounded-full blur-2xl opacity-50"
                    style={{ background: "var(--blush)" }}
                  />
                  <div
                    className="relative w-20 h-20 rounded-full flex items-center justify-center border"
                    style={{
                      background: "var(--blush)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <Heart
                      size={28}
                      strokeWidth={1.5}
                      style={{ color: "var(--rose)", opacity: 0.6 }}
                    />
                  </div>
                </div>
                <h2
                  className="f-display text-center mb-2 leading-snug"
                  style={{
                    fontSize: "22px",
                    fontWeight: 500,
                    color: "var(--ink)",
                  }}
                >
                  {filter === "all"
                    ? "Chưa có sản phẩm yêu thích"
                    : "Không có sản phẩm nào"}
                </h2>
                <p
                  className="text-[12px] text-center mb-5 max-w-[200px] leading-relaxed"
                  style={{ color: "var(--muted)" }}
                >
                  {filter === "all"
                    ? "Nhấn vào ♡ để lưu những sản phẩm bạn thích nhé"
                    : "Thử chuyển sang tab khác hoặc khám phá thêm"}
                </p>
                <div className="flex gap-2.5">
                  {filter !== "all" && (
                    <button
                      onClick={() => setFilter("all")}
                      className="px-5 py-2.5 rounded-full text-[12px] font-semibold active:scale-95 transition-transform border"
                      style={{
                        background: "transparent",
                        color: "var(--ink)",
                        borderColor: "var(--border)",
                      }}
                    >
                      Xem tất cả
                    </button>
                  )}
                  <button
                    onClick={() => router.push("/")}
                    className="px-6 py-2.5 rounded-full text-[13px] font-semibold flex items-center gap-2 active:scale-95 transition-transform"
                    style={{ background: "var(--ink)", color: "var(--cream)" }}
                  >
                    Khám phá ngay <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="px-3 pt-3">
                {filter !== "all" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between px-1 mb-3"
                  >
                    <p
                      className="text-[11px]"
                      style={{ color: "var(--muted)" }}
                    >
                      {list.length} / {allFavProducts.length} sản phẩm
                    </p>
                    <button
                      onClick={() => setFilter("all")}
                      className="text-[11px] font-semibold"
                      style={{ color: "var(--rose)" }}
                    >
                      Xem tất cả
                    </button>
                  </motion.div>
                )}
                <div className="columns-2 gap-2.5">
                  <AnimatePresence>
                    {list.map((product, idx) => (
                      <FavCard
                        key={product.id}
                        product={product}
                        idx={idx}
                        onNavigate={handleNavigate}
                        onRemove={removeFav}
                        isRemoving={removingId === product.id}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </main>

          <BottomNav />

          {/* ══ UNDO TOAST ══ */}
          <AnimatePresence>
            {showUndo && (
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: "spring", damping: 22, stiffness: 300 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-[calc(28rem-2rem)]"
              >
                <div
                  className="rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3"
                  style={{ background: "var(--ink)" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl overflow-hidden shrink-0 relative"
                    style={{
                      background: "color-mix(in srgb, var(--ink) 80%, white)",
                    }}
                  >
                    <Image
                      src={showUndo.image_urls[0] || "/placeholder.png"}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[12px] font-medium truncate"
                      style={{ color: "var(--cream)" }}
                    >
                      Đã bỏ yêu thích
                    </p>
                    <p
                      className="text-[10px] truncate"
                      style={{
                        color:
                          "color-mix(in srgb, var(--cream) 50%, transparent)",
                      }}
                    >
                      {showUndo.title}
                    </p>
                  </div>
                  <button
                    onClick={undoRemove}
                    className="text-[12px] font-semibold px-2 py-1 shrink-0"
                    style={{ color: "var(--rose)" }}
                  >
                    Hoàn tác
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigating overlay */}
      <NavigatingOverlay product={navigating} />
    </>
  );
}
