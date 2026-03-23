"use client";

import {
  Search,
  Bell,
  Sparkles,
  Camera,
  X,
  TrendingUp,
  Heart,
  SlidersHorizontal,
  ShoppingBag,
  // [+] icon cho banner image mode
  ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { useState, useRef, useCallback, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import StyleBot from "@/components/StyleBot";
// [+] Image search — hook từ libs/ + banner
import { useImageSearch } from "@/libs/use-image-search";
import { ImageSearchBanner } from "@/components/ImageSearchBanner";
import { useProducts } from "@/libs/products-context";
import { useFavorites } from "@/libs/favorites-context";
import { track } from "@/libs/track";
import {
  categoryOf,
  vibesOf,
  fmt,
  CLOTHING_CATEGORIES,
  VIBES,
  type Product,
  type VibeId,
} from "@/libs/products";
import NavigatingOverlay from "@/components/NavigatingOverlay";

type TabId = (typeof CLOTHING_CATEGORIES)[number]["id"];

const TRENDING = [
  "Áo cardigan",
  "Váy hoa nhí",
  "Y2K style",
  "Túi xách mini",
  "Clean girl",
  "Coquette bow",
];
const IMG_H = ["h-52", "h-44", "h-60", "h-48", "h-56", "h-40", "h-52", "h-48"];

/* ══════════════════════════════════════════════════════════════
   SHIMMER SKELETON
   ══════════════════════════════════════════════════════════════ */
function ShimmerCard({ height }: { height: string }) {
  return (
    <div className="break-inside-avoid mb-3">
      <div
        className={`${height} rounded-[18px] overflow-hidden relative`}
        style={{ background: "var(--surface)" }}
      >
        <div
          className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--cream) 60%, transparent) 50%, transparent 100%)",
          }}
        />
      </div>
      <div className="px-0.5 pt-2.5 space-y-2">
        <div
          className="h-2.5 rounded-full overflow-hidden relative"
          style={{ background: "var(--surface)", width: "75%" }}
        >
          <div
            className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_0.1s_infinite]"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in srgb, var(--cream) 60%, transparent), transparent)",
            }}
          />
        </div>
        <div
          className="h-2.5 rounded-full overflow-hidden relative"
          style={{ background: "var(--surface)", width: "40%" }}
        >
          <div
            className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_0.2s_infinite]"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in srgb, var(--cream) 60%, transparent), transparent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="columns-2 gap-2.5 px-3 pt-1">
      {IMG_H.map((h, i) => (
        <ShimmerCard key={i} height={h} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PRODUCT CARD
   ══════════════════════════════════════════════════════════════ */
function ProductCard({
  product,
  idx,
  onNavigate,
}: {
  product: Product;
  idx: number;
  onNavigate: (product: Product) => void;
}) {
  const { isFavorite, toggle } = useFavorites();
  const liked = isFavorite(product.id);
  const h = IMG_H[idx % IMG_H.length];
  const isOrder = product.metadata.product_type === "order";
  const [pressing, setPressing] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const prefetch = useCallback(() => {
    router.prefetch(`/product/${product.id}`);
  }, [router, product.id]);

  const handlePressStart = useCallback(() => {
    setPressing(true);
    pressTimer.current = setTimeout(() => {}, 150);
  }, []);

  const handlePressEnd = useCallback(() => {
    setPressing(false);
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }, []);

  return (
    <div className="break-inside-avoid mb-3">
      <div
        className="group cursor-pointer"
        style={{ WebkitTapHighlightColor: "transparent" }}
        onMouseEnter={prefetch}
        onTouchStart={() => {
          prefetch();
          handlePressStart();
        }}
        onTouchEnd={handlePressEnd}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
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
            loading={idx < 4 ? "eager" : "lazy"}
            priority={idx < 2}
          />

          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
            style={{
              background: "rgba(0,0,0,0.08)",
              opacity: pressing ? 1 : 0,
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

          {isOrder && (
            <span
              className="absolute top-2.5 left-2.5 text-[9px] font-semibold px-2 py-[3px] rounded-full text-white tracking-wide"
              style={{ background: "var(--ink)" }}
            >
              Pre-order
            </span>
          )}

          {product.metadata.vibe && (
            <span
              className="absolute bottom-2.5 left-2.5 text-[9px] font-medium px-2 py-[3px] rounded-full backdrop-blur-md"
              style={{
                background: "color-mix(in srgb, var(--cream) 78%, transparent)",
                color: "var(--body)",
                border:
                  "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
              }}
            >
              {product.metadata.vibe}
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggle(product.id);
            }}
            className="absolute top-2.5 right-2.5 w-[30px] h-[30px] rounded-full flex items-center justify-center transition-transform active:scale-75"
            style={{
              background: liked
                ? "var(--rose)"
                : "color-mix(in srgb, var(--cream) 82%, transparent)",
              backdropFilter: "blur(8px)",
              border: liked
                ? "none"
                : "1px solid color-mix(in srgb, var(--border) 50%, transparent)",
            }}
          >
            <Heart
              size={13}
              strokeWidth={2.5}
              style={{
                color: liked ? "white" : "var(--body)",
                fill: liked ? "white" : "transparent",
              }}
            />
          </button>
        </div>

        <div className="px-0.5 pt-2.5 pb-0.5">
          <h3
            className="text-[12px] font-medium leading-snug line-clamp-2 mb-1"
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
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CATEGORY TABS
   ══════════════════════════════════════════════════════════════ */
function CategoryTabs({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 py-2.5">
      {CLOTHING_CATEGORIES.map((tab) => {
        const on = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="whitespace-nowrap rounded-full px-3.5 py-1.5 flex items-center gap-1.5 text-[11px] font-semibold shrink-0 transition-all duration-200 active:scale-95"
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
            <span
              className={`text-[12px] leading-none ${on ? "" : "opacity-70"}`}
            >
              {tab.emoji}
            </span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VIBE DRAWER
   ══════════════════════════════════════════════════════════════ */
function VibeDrawer({
  open,
  activeVibes,
  onToggle,
  onClose,
  onClear,
}: {
  open: boolean;
  activeVibes: Set<VibeId>;
  onToggle: (v: VibeId) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div className="fixed bottom-0 inset-x-0 flex justify-center z-50">
        <div
          className="w-full max-w-md rounded-t-[28px] shadow-2xl px-5 pt-3 pb-10"
          style={{
            background: "var(--cream)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            className="w-10 h-[3px] rounded-full mx-auto mb-5"
            style={{ background: "var(--border)" }}
          />
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="text-[16px] font-semibold"
                style={{ color: "var(--ink)" }}
              >
                Lọc theo Vibe
              </h3>
              <p
                className="text-[11px] mt-0.5"
                style={{ color: "var(--muted)" }}
              >
                Chọn nhiều vibe để lọc cùng lúc
              </p>
            </div>
            {activeVibes.size > 0 && (
              <button
                onClick={onClear}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                style={{ background: "var(--rose-lt)", color: "var(--rose)" }}
              >
                Xoá ({activeVibes.size})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            {VIBES.map((v) => {
              const on = activeVibes.has(v.id);
              return (
                <button
                  key={v.id}
                  onClick={() => onToggle(v.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-medium transition-all duration-200 active:scale-95"
                  style={
                    on
                      ? { background: "var(--ink)", color: "var(--cream)" }
                      : {
                          background: "var(--surface)",
                          color: "var(--body)",
                          border: "1px solid var(--border)",
                        }
                  }
                >
                  <span>{v.emoji}</span>
                  {v.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={onClose}
            className="w-full h-12 rounded-2xl text-[13px] font-semibold transition-transform active:scale-[0.98]"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            {activeVibes.size > 0
              ? `Xem kết quả (${activeVibes.size} vibe)`
              : "Đóng"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   HOME CLIENT
   ══════════════════════════════════════════════════════════════ */
export default function HomeClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { products, loading, error, refetch } = useProducts();
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [activeVibes, setActiveVibes] = useState<Set<VibeId>>(new Set());
  const [vibeDrawerOpen, setVibeDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [navigatingProduct, setNavigatingProduct] = useState<Product | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // [+] Image search state
  const [imageResults, setImageResults] = useState<Product[] | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    track("page_view");
  }, []);

  const toggleVibe = useCallback((v: VibeId) => {
    setActiveVibes((prev) => {
      const s = new Set(prev);
      s.has(v) ? s.delete(v) : s.add(v);
      return s;
    });
  }, []);

  // [+] useImageSearch từ libs/ — nhận products đã load, trả về Product[] trực tiếp
  const {
    searchByImage,
    modelReady,
    loadingPct,
    searching: imageSearching,
    error: imageSearchError,
  } = useImageSearch(products);

  // [+] Xoá image results
  const clearImageResults = useCallback(() => {
    setImageResults(null);
  }, []);

  // [+] Xử lý khi user chọn ảnh từ file picker
  const handleImageFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";

      const results = await searchByImage(file);
      if (results.length > 0) {
        track("image_search");
        setImageResults(results);
      }
    },
    [searchByImage],
  );

  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const list = products.filter((p) => {
    if (queryWords.length > 0) {
      const title = p.title.toLowerCase();
      const desc = (p.description ?? "").toLowerCase();
      const combined = title + " " + desc;
      const matchCount = queryWords.filter((w) => combined.includes(w)).length;
      if (matchCount === 0) return false;
    }
    if (
      activeTab !== "all" &&
      activeTab !== "best-seller" &&
      categoryOf(p) !== activeTab
    )
      return false;
    if (activeVibes.size > 0 && !vibesOf(p).some((v) => activeVibes.has(v)))
      return false;
    return true;
  });

  const sortedList =
    queryWords.length > 0
      ? [...list].sort((a, b) => {
          const scoreA = queryWords.filter((w) =>
            (a.title + " " + (a.description ?? "")).toLowerCase().includes(w),
          ).length;
          const scoreB = queryWords.filter((w) =>
            (b.title + " " + (b.description ?? "")).toLowerCase().includes(w),
          ).length;
          return scoreB - scoreA;
        })
      : list;

  // [+] Nếu đang trong image search mode → dùng imageResults thay sortedList
  const activeList = imageResults ?? sortedList;

  const handleNavigate = useCallback(
    (product: Product) => {
      track("product_click", { id: product.id, title: product.title });
      setNavigatingProduct(product);
      startTransition(() => {
        setTimeout(() => {
          router.push(`/product/${product.id}`);
        }, 380);
      });
    },
    [router],
  );

  useEffect(() => {
    if (!isPending && navigatingProduct) {
      const t = setTimeout(() => setNavigatingProduct(null), 200);
      return () => clearTimeout(t);
    }
  }, [isPending]);

  const vibeCount = activeVibes.size;

  useEffect(() => {
    const el = document.querySelector(
      ".inshoo-scroll-area",
    ) as HTMLElement | null;
    const target = el ?? window;
    const getY = () => (el ? el.scrollTop : window.scrollY);

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = getY();
        const delta = y - lastScrollY.current;
        if (delta > 6) setHeaderVisible(false);
        else if (delta < -6) setHeaderVisible(true);
        lastScrollY.current = y;
        ticking = false;
      });
    };

    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, []);

  const ITEMS_PER_PAGE = 20;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // [+] Reset pagination khi filter hoặc image mode thay đổi
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [query, activeTab, activeVibes, imageResults]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isLoadingMore, activeList.length]);

  const visibleList = activeList.slice(0, visibleCount);
  const hasMore = visibleCount < activeList.length;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      <div
        className="inshoo-root min-h-screen"
        style={{ background: "var(--surface)" }}
      >
        <div
          className="max-w-md mx-auto min-h-screen relative shadow-[0_0_60px_-10px_rgba(0,0,0,0.08)]"
          style={{ background: "var(--cream)" }}
        >
          <main className="pb-24">
            {/* ══ HEADER ══ */}
            <header
              className="sticky top-0 z-40 backdrop-blur-2xl"
              style={{
                background: "color-mix(in srgb, var(--cream) 88%, transparent)",
                borderBottom:
                  "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
                transform: headerVisible
                  ? "translateY(0)"
                  : "translateY(-110%)",
                transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
                willChange: "transform",
              }}
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-1">
                <div className="relative shrink-0">
                  <Image
                    src="/images/face2.png"
                    alt="avatar"
                    width={34}
                    height={34}
                    className="rounded-full object-cover"
                    style={{
                      outline: "2px solid var(--border)",
                      outlineOffset: "1px",
                    }}
                  />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full"
                    style={{ border: "2px solid var(--cream)" }}
                  />
                </div>
                <h1
                  className="f-display select-none"
                  style={{
                    fontSize: "20px",
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    color: "var(--ink)",
                  }}
                >
                  Inshoo
                </h1>
                <button
                  className="relative w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: "var(--surface)" }}
                >
                  <Bell size={17} style={{ color: "var(--body)" }} />
                  <span
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                    style={{
                      background: "var(--rose)",
                      border: "1.5px solid var(--cream)",
                    }}
                  />
                </button>
              </div>

              <div className="px-4 pt-2 pb-1">
                <p className="text-[12px]" style={{ color: "var(--muted)" }}>
                  Hôm nay mặc gì đây? ✨
                </p>
              </div>

              {/* Search bar */}
              <div className="px-4 pb-2 relative">
                <div
                  className="flex items-center gap-2.5 rounded-2xl px-4 py-3 transition-all duration-300"
                  style={
                    focused
                      ? {
                          background: "white",
                          boxShadow: `0 0 0 1.5px var(--rose), 0 4px 20px color-mix(in srgb, var(--rose) 10%, transparent)`,
                        }
                      : {
                          background: "var(--surface)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }
                  }
                >
                  <Search
                    size={14}
                    style={{
                      color: focused ? "var(--rose)" : "var(--muted)",
                      flexShrink: 0,
                    }}
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      // [+] Gõ text → thoát khỏi image search mode
                      if (imageResults) clearImageResults();
                      if (e.target.value && activeTab !== "all")
                        setActiveTab("all");
                    }}
                    onFocus={() => {
                      setFocused(true);
                      setShowTrending(true);
                    }}
                    onBlur={() => {
                      setFocused(false);
                      setTimeout(() => setShowTrending(false), 150);
                    }}
                    placeholder="Tìm áo, váy, phong cách..."
                    className="flex-1 bg-transparent outline-none text-[13px]"
                    style={{ color: "var(--ink)" }}
                  />
                  {query ? (
                    <button
                      onClick={() => setQuery("")}
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "var(--border)" }}
                    >
                      <X size={10} style={{ color: "var(--muted)" }} />
                    </button>
                  ) : (
                    <>
                      <div
                        className="w-px h-4 shrink-0"
                        style={{ background: "var(--border)" }}
                      />
                      {/* [*] Camera button — mở thẳng file picker / camera trên mobile */}
                      <button
                        className="shrink-0 active:scale-90 transition-transform"
                        onClick={() => imageFileInputRef.current?.click()}
                        aria-label="Tìm bằng hình ảnh"
                        disabled={imageSearching}
                      >
                        <Camera
                          size={15}
                          style={{
                            color: (imageResults || imageSearching) ? "var(--ink)" : "var(--rose)",
                            opacity: imageSearching ? 0.5 : 1,
                          }}
                        />
                      </button>
                      {/* file input ẩn — accept="image/*" trên mobile hiện camera + thư mục */}
                      <input
                        ref={imageFileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleImageFile}
                      />
                    </>
                  )}
                </div>

                {query && !focused && (
                  <p
                    className="mt-2 px-1 text-[11px]"
                    style={{ color: "var(--muted)" }}
                  >
                    "
                    <span
                      className="font-semibold"
                      style={{ color: "var(--rose)" }}
                    >
                      {query}
                    </span>
                    " · {list.length} sản phẩm
                  </p>
                )}

                {showTrending && !query && (
                  <div
                    className="absolute left-4 right-4 top-full mt-1.5 rounded-2xl shadow-2xl p-4 z-50"
                    style={{
                      background: "var(--cream)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-3">
                      <TrendingUp size={12} style={{ color: "var(--rose)" }} />
                      <span
                        className="text-[10px] font-bold tracking-[0.12em] uppercase"
                        style={{ color: "var(--muted)" }}
                      >
                        Đang hot
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {TRENDING.map((t, i) => (
                        <button
                          key={t}
                          onMouseDown={() => {
                            setQuery(t);
                            clearImageResults(); // [+]
                            setShowTrending(false);
                            setFocused(false);
                            inputRef.current?.blur();
                          }}
                          className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors active:scale-95"
                          style={{
                            background: "var(--surface)",
                            color: "var(--body)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {i < 3 && (
                            <span
                              className="text-[10px] font-bold"
                              style={{
                                color: "var(--rose)",
                                opacity: 1 - i * 0.3,
                              }}
                            >
                              {i + 1}
                            </span>
                          )}
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <CategoryTabs
                active={activeTab}
                onChange={(id) => {
                  setActiveTab(id);
                  // [+] Đổi tab → thoát image search mode
                  if (imageResults) clearImageResults();
                }}
              />

              {/* [+] Banner image search — hiện khi đang tìm hoặc có kết quả */}
              <ImageSearchBanner
                searching={imageSearching}
                modelReady={modelReady}
                loadingPct={loadingPct}
                hasResults={!!imageResults}
                error={imageSearchError}
                onClear={clearImageResults}
              />
            </header>

            {/* ══ SECTION HEADER ══ */}
            <section className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* [+] Icon khác nhau tùy theo mode */}
                  {imageResults ? (
                    <ImageIcon size={13} style={{ color: "var(--rose)" }} />
                  ) : (
                    <Sparkles size={13} style={{ color: "var(--rose)" }} />
                  )}
                  <h2
                    className="text-[13px] font-semibold"
                    style={{ color: "var(--ink)" }}
                  >
                    {imageResults
                      ? "Kết quả tìm theo ảnh"
                      : activeTab === "all"
                        ? "Gợi ý cho bạn"
                        : (CLOTHING_CATEGORIES.find((c) => c.id === activeTab)
                            ?.emoji ?? "") +
                          " " +
                          (CLOTHING_CATEGORIES.find((c) => c.id === activeTab)
                            ?.label ?? activeTab)}
                  </h2>
                  {vibeCount > 0 && !imageResults && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--rose-lt)",
                        color: "var(--rose)",
                      }}
                    >
                      {vibeCount} vibe
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!loading && (
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--muted)" }}
                    >
                      {activeList.length} sp
                    </span>
                  )}
                  {/* [+] Trong image mode: nút "Xoá" thay cho Vibe */}
                  {imageResults ? (
                    <button
                      onClick={clearImageResults}
                      className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95"
                      style={{ background: "var(--rose-lt)", color: "var(--rose)" }}
                    >
                      <X size={11} />
                      Xoá
                    </button>
                  ) : (
                    <button
                      onClick={() => setVibeDrawerOpen(true)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95"
                      style={
                        vibeCount > 0
                          ? { background: "var(--ink)", color: "var(--cream)" }
                          : {
                              background: "var(--surface)",
                              color: "var(--body)",
                              border: "1px solid var(--border)",
                            }
                      }
                    >
                      <SlidersHorizontal size={11} />
                      Vibe
                      {vibeCount > 0 && (
                        <span
                          className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                          style={{
                            background: "var(--cream)",
                            color: "var(--ink)",
                          }}
                        >
                          {vibeCount}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {vibeCount > 0 && !imageResults && (
                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                  {Array.from(activeVibes).map((v) => {
                    const info = VIBES.find((x) => x.id === v);
                    return (
                      <button
                        key={v}
                        onClick={() => toggleVibe(v)}
                        className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full"
                        style={{
                          background: "var(--ink)",
                          color: "var(--cream)",
                        }}
                      >
                        {info?.emoji} {info?.label}
                        <X size={9} className="ml-0.5" />
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ══ CONTENT ══ */}
            {loading ? (
              <SkeletonGrid />
            ) : error ? (
              <div className="flex flex-col items-center py-24 text-center px-8">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "var(--surface)" }}
                >
                  <ShoppingBag
                    size={24}
                    style={{ color: "var(--muted)", opacity: 0.5 }}
                  />
                </div>
                <p
                  className="text-[14px] font-semibold mb-1"
                  style={{ color: "var(--ink)" }}
                >
                  Ôi không!
                </p>
                <p
                  className="text-[12px] mb-5"
                  style={{ color: "var(--muted)" }}
                >
                  {error}
                </p>
                <button
                  onClick={refetch}
                  className="px-6 py-2.5 rounded-full text-[13px] font-semibold active:scale-95 transition-transform"
                  style={{ background: "var(--ink)", color: "var(--cream)" }}
                >
                  Thử lại
                </button>
              </div>
            ) : activeList.length === 0 ? (
              <div className="flex flex-col items-center py-24 text-center px-8">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "var(--blush)" }}
                >
                  <Search
                    size={24}
                    style={{ color: "var(--rose)", opacity: 0.7 }}
                  />
                </div>
                <p
                  className="f-display text-[20px] mb-1"
                  style={{ color: "var(--ink)" }}
                >
                  Không tìm thấy
                </p>
                <p
                  className="text-[12px] mb-5 max-w-[200px] leading-relaxed"
                  style={{ color: "var(--muted)" }}
                >
                  {imageResults
                    ? "Không có sản phẩm tương tự trong cửa hàng"
                    : "Thử từ khoá khác hoặc bỏ bớt bộ lọc nhé"}
                </p>
                <div className="flex gap-2">
                  {imageResults && (
                    <button
                      onClick={clearImageResults}
                      className="px-5 py-2.5 rounded-full text-[12px] font-semibold active:scale-95"
                      style={{ background: "var(--ink)", color: "var(--cream)" }}
                    >
                      Xem tất cả
                    </button>
                  )}
                  {vibeCount > 0 && !imageResults && (
                    <button
                      onClick={() => setActiveVibes(new Set())}
                      className="px-4 py-2.5 rounded-full text-[12px] font-medium active:scale-95"
                      style={{
                        background: "var(--surface)",
                        color: "var(--body)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      Xoá filter
                    </button>
                  )}
                  {!imageResults && (
                    <button
                      onClick={() => {
                        setQuery("");
                        setActiveTab("all");
                        setActiveVibes(new Set());
                      }}
                      className="px-5 py-2.5 rounded-full text-[12px] font-semibold active:scale-95"
                      style={{ background: "var(--ink)", color: "var(--cream)" }}
                    >
                      Xem tất cả
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-3">
                <div className="columns-2 gap-2.5">
                  {visibleList.map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      idx={i}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div ref={sentinelRef} className="px-3 py-4">
                    {isLoadingMore ? (
                      <div className="columns-2 gap-2.5">
                        {IMG_H.slice(0, 4).map((h, i) => (
                          <ShimmerCard key={i} height={h} />
                        ))}
                      </div>
                    ) : (
                      <div className="h-12" />
                    )}
                  </div>
                )}

                {!hasMore && activeList.length > ITEMS_PER_PAGE && (
                  <p
                    className="text-center text-[11px] py-6"
                    style={{ color: "var(--muted)" }}
                  >
                    Đã xem hết {activeList.length} sản phẩm ✨
                  </p>
                )}
              </div>
            )}
          </main>

          <StyleBot />
          <BottomNav />
          <VibeDrawer
            open={vibeDrawerOpen}
            activeVibes={activeVibes}
            onToggle={toggleVibe}
            onClose={() => setVibeDrawerOpen(false)}
            onClear={() => setActiveVibes(new Set())}
          />
        </div>
      </div>

      {navigatingProduct && <NavigatingOverlay product={navigatingProduct} />}


    </>
  );
}