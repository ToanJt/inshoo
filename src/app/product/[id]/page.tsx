"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Share2,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowUpRight,
  Instagram,
  Package,
  MessageCircle,
  Plane,
  Ruler,
  Info,
  X,
  Link2,
  Check,
} from "lucide-react";
import { fetchProductDetail } from "@/libs/api";
import {
  fmt,
  detectPlatform,
  platformLabel,
  type ProductDetail,
} from "@/libs/products";
import { useProducts } from "@/libs/products-context";
import { useFavorites } from "@/libs/favorites-context";
import { SHIMMER_KEYFRAME, shimmerClass } from "@/libs/shimmer";
import { track } from "@/libs/track";

/* ─── Wrapper ─── */
const Page = ({ children }: { children: React.ReactNode }) => (
  <div
    className="inshoo-root min-h-screen"
    style={{ background: "var(--cream)" }}
  >
    <div
      className="max-w-md mx-auto relative min-h-screen overflow-hidden shadow-[0_0_60px_-10px_rgba(0,0,0,0.08)]"
      style={{ background: "var(--cream)" }}
    >
      {children}
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   prefetchProductDetail — gọi từ HomeClient onMouseEnter
══════════════════════════════════════════════════════════════ */
const prefetchCache = new Map<string, Promise<ProductDetail | null>>();

export function prefetchProductDetail(id: string) {
  if (!prefetchCache.has(id)) {
    prefetchCache.set(
      id,
      fetchProductDetail(id).catch(() => null),
    );
  }
}

/* ══════════════════════════════════════════════════════════════
   SHARE BUTTON
══════════════════════════════════════════════════════════════ */
function ShareButton({ product }: { product: ProductDetail }) {
  const [state, setState] = useState<"idle" | "copied" | "shared">("idle");

  const handle = async () => {
    const url = `${window.location.origin}/product/${product.id}`;
    const shareData = {
      title: product.title,
      text: "Xem sản phẩm này trên Inshoo ✨",
      url,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        setState("shared");
        setTimeout(() => setState("idle"), 2000);
        return;
      } catch {
        /* dismissed */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
      return;
    } catch {
      /* fall through */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      /* silent */
    }
  };

  const isCopied = state === "copied";
  return (
    <>
      <motion.button
        onClick={handle}
        animate={isCopied ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
        className="w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center active:scale-90"
        style={{
          background: isCopied
            ? "color-mix(in srgb,#22c55e 85%,transparent)"
            : "color-mix(in srgb,var(--cream) 75%,transparent)",
          transition: "background 0.25s",
        }}
      >
        <AnimatePresence mode="wait">
          {isCopied ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", damping: 18, stiffness: 300 }}
            >
              <Check size={14} style={{ color: "white" }} />
            </motion.div>
          ) : (
            <motion.div
              key="share"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Share2 size={14} style={{ color: "var(--ink)" }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      <AnimatePresence>
        {state === "copied" && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className="absolute top-14 right-0 z-20 whitespace-nowrap"
          >
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold shadow-lg"
              style={{ background: "var(--ink)", color: "var(--cream)" }}
            >
              <Link2 size={11} /> Đã sao chép link
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   SKELETON
══════════════════════════════════════════════════════════════ */
function ProductSkeleton() {
  const router = useRouter();
  return (
    <Page>
      <style>{SHIMMER_KEYFRAME}</style>
      <div
        className="relative w-full overflow-hidden"
        style={{
          background: "var(--surface)",
          height: "min(calc(100vw * 4 / 3), 420px)",
          maxHeight: "55vh",
        }}
      >
        <div style={shimmerClass()} />
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center"
          style={{
            background: "color-mix(in srgb,var(--cream) 75%,transparent)",
          }}
        >
          <ArrowLeft size={16} style={{ color: "var(--ink)" }} />
        </button>
        <div
          className="absolute bottom-0 inset-x-0 h-10 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(to top,var(--cream),transparent)",
          }}
        />
      </div>
      <div className="px-5 pt-4 space-y-4">
        <div className="flex gap-2">
          {["w-20", "w-16"].map((w, i) => (
            <div
              key={i}
              className={`relative h-6 ${w} rounded-full overflow-hidden`}
              style={{ background: "var(--surface)" }}
            >
              <div style={shimmerClass(`${i * 0.05}s`)} />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {["90%", "65%"].map((w, i) => (
            <div
              key={i}
              className="relative h-7 rounded-xl overflow-hidden"
              style={{ background: "var(--surface)", width: w }}
            >
              <div style={shimmerClass(`${0.1 + i * 0.05}s`)} />
            </div>
          ))}
        </div>
        <div
          className="relative h-8 rounded-xl overflow-hidden"
          style={{ background: "var(--surface)", width: "40%" }}
        >
          <div style={shimmerClass("0.2s")} />
        </div>
        <div
          className="rounded-2xl p-4 space-y-2"
          style={{ background: "var(--surface)" }}
        >
          {["95%", "88%", "70%"].map((w, i) => (
            <div
              key={i}
              className="relative h-3 rounded-full overflow-hidden"
              style={{
                background: "color-mix(in srgb,var(--border) 60%,transparent)",
                width: w,
              }}
            >
              <div style={shimmerClass(`${0.25 + i * 0.05}s`)} />
            </div>
          ))}
        </div>
      </div>
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 border-t px-5 py-3 flex gap-3"
        style={{ background: "var(--cream)", borderColor: "var(--border)" }}
      >
        <div
          className="relative w-12 h-12 rounded-2xl overflow-hidden"
          style={{ background: "var(--surface)" }}
        >
          <div style={shimmerClass()} />
        </div>
        <div
          className="relative flex-1 h-12 rounded-full overflow-hidden"
          style={{ background: "var(--surface)" }}
        >
          <div style={shimmerClass("0.1s")} />
        </div>
      </div>
    </Page>
  );
}

/* ══════════════════════════════════════════════════════════════
   FastImage — CSS class toggle, NO useState per image
══════════════════════════════════════════════════════════════ */
function FastImage({
  src,
  alt,
  fill,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      imgRef.current.classList.add("img-loaded");
    }
  }, []);

  return (
    <>
      <style>{`
        .img-blur { filter:blur(8px); transform:scale(1.04); transition:filter .4s ease,transform .4s ease; }
        .img-blur.img-loaded { filter:blur(0); transform:scale(1); }
      `}</style>
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        className={`${className ?? ""} img-blur`}
        onLoad={(e) =>
          (e.currentTarget as HTMLImageElement).classList.add("img-loaded")
        }
      />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE ROUTER
══════════════════════════════════════════════════════════════ */
export default function ProductDetailPage() {
  const { getDetail, setDetail } = useProducts();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getDetail(id);
    if (cached) {
      setProduct(cached);
      setLoading(false);
      return;
    }

    const prefetched = prefetchCache.get(id);
    const source = prefetched ?? fetchProductDetail(id).catch(() => null);

    source
      .then((data) => {
        if (data) {
          setDetail(id, data);
          setProduct(data);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, getDetail, setDetail]);

  if (loading) return <ProductSkeleton />;
  if (!product)
    return (
      <Page>
        <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center gap-3">
          <p className="f-display text-[24px]">Không tìm thấy</p>
          <p className="text-[13px]" style={{ color: "var(--muted)" }}>
            Sản phẩm này không còn tồn tại.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-2 px-6 py-2.5 rounded-full text-[13px] font-semibold"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            Về trang chủ
          </button>
        </div>
      </Page>
    );

  return product.metadata.product_type === "affiliate" ? (
    <AffiliateView product={product} />
  ) : (
    <OrderView product={product} />
  );
}

/* ══════════════════════════════════════════════════════════════
   MEDIA GALLERY — IntersectionObserver thay onScroll
══════════════════════════════════════════════════════════════ */
function MediaGallery({
  product,
  onBack,
  extraButton,
}: {
  product: ProductDetail;
  onBack: () => void;
  extraButton?: React.ReactNode;
}) {
  const { isFavorite, toggle } = useFavorites();
  const liked = isFavorite(product.id);
  const [likeAnim, setLikeAnim] = useState(false);
  const [cur, setCur] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const images =
    product.image_urls.length > 0
      ? product.image_urls
      : [
          "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=600&auto=format&fit=crop",
        ];

  useEffect(() => {
    const container = containerRef.current;
    if (!container || images.length <= 1) return;

    const slides = Array.from(container.children) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCur(slides.indexOf(entry.target as HTMLElement));
          }
        });
      },
      { root: container, threshold: 0.6 },
    );
    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [images.length]);

  // ── track product_favorite từ gallery heart button ────────────
  const handleToggle = useCallback(() => {
    toggle(product.id);
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    track("product_favorite", { id: product.id, title: product.title });
  }, [toggle, product.id, product.title]);

  return (
    <section className="relative">
      <div
        ref={containerRef}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        style={{ touchAction: "pan-x", overscrollBehavior: "contain" }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="w-full shrink-0 snap-center relative"
            style={{
              background: "var(--surface)",
              touchAction: "pan-x",
              height: "min(calc(100vw * 4 / 3), 420px)",
              maxHeight: "55vh",
            }}
          >
            <FastImage
              src={src}
              alt={`${product.title} ${i + 1}`}
              fill
              sizes="(max-width:448px) 100vw, 448px"
              priority={i === 0}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
        style={{
          background: "color-mix(in srgb,var(--cream) 75%,transparent)",
        }}
      >
        <ArrowLeft size={16} style={{ color: "var(--ink)" }} />
      </button>

      <div className="absolute top-4 right-4 z-10 flex gap-2 items-start">
        <div className="relative">
          <ShareButton product={product} />
        </div>
        <motion.button
          onClick={handleToggle}
          animate={likeAnim ? { scale: [1, 1.4, 0.9, 1] } : {}}
          transition={{ duration: 0.35 }}
          className="w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center"
          style={{
            background: liked
              ? "var(--rose)"
              : "color-mix(in srgb,var(--cream) 75%,transparent)",
            transition: "background 0.2s",
          }}
        >
          <Heart
            size={15}
            style={{
              color: liked ? "white" : "var(--ink)",
              fill: liked ? "white" : "transparent",
              transition: "all 0.2s",
            }}
          />
        </motion.button>
      </div>

      {extraButton && (
        <div className="absolute bottom-5 left-4 z-10">{extraButton}</div>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
          {images.map((_, i) => (
            <motion.span
              key={i}
              animate={{
                width: i === cur ? 20 : 4,
                opacity: i === cur ? 1 : 0.6,
              }}
              transition={{ duration: 0.25 }}
              className="block h-[4px] rounded-full bg-white shadow-sm"
            />
          ))}
        </div>
      )}
      <span className="absolute bottom-5 right-4 z-10 text-[10px] text-white/80 bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
        {cur + 1}/{images.length}
      </span>
      <div
        className="absolute bottom-0 inset-x-0 h-10 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(to top,var(--cream),transparent)",
        }}
      />
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════
   Stagger — animate ngay khi mount
══════════════════════════════════════════════════════════════ */
function Stagger({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.055 } },
      }}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════ */
function CuratorNote({ note }: { note: string }) {
  if (!note) return null;
  return (
    <div
      className="rounded-2xl p-4 border"
      style={{
        background: "var(--blush)",
        borderColor: "color-mix(in srgb,var(--rose) 25%,var(--border))",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{
            background: "color-mix(in srgb,var(--rose) 18%,transparent)",
          }}
        >
          <Sparkles size={10} style={{ color: "var(--rose)" }} />
        </div>
        <span
          className="text-[10px] font-bold tracking-[0.12em] uppercase"
          style={{ color: "var(--rose)" }}
        >
          Stylist note
        </span>
      </div>
      <p
        className="text-[13px] leading-[1.75] font-light"
        style={{ color: "var(--body)" }}
      >
        {note}
      </p>
    </div>
  );
}

type SizeRow = {
  size: string;
  weight?: string;
  waist?: string;
  chest?: string;
  hip?: string;
  shoulder?: string;
  length?: string;
  sleeve?: string;
  [key: string]: string | undefined;
};
const MEASURE_COLS = [
  { key: "chest", label: "Ngực" },
  { key: "waist", label: "Eo" },
  { key: "hip", label: "Hông" },
  { key: "shoulder", label: "Vai" },
  { key: "length", label: "Dài" },
  { key: "sleeve", label: "Tay" },
  { key: "weight", label: "Cân nặng" },
];

function SizeGuide({ sizeGuide }: { sizeGuide: SizeRow[] }) {
  const [open, setOpen] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  if (!sizeGuide?.length) return null;
  const activeCols = MEASURE_COLS.filter((c) =>
    sizeGuide.some((r) => r[c.key] && r[c.key] !== ""),
  );
  const selRow = sizeGuide.find((r) => r.size === sel);

  return (
    <section className="px-5 mt-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3"
      >
        <div className="flex items-center gap-1.5">
          <Ruler size={13} style={{ color: "var(--muted)" }} />
          <span
            className="text-[12px] font-semibold"
            style={{ color: "var(--ink)" }}
          >
            Bảng size
          </span>
          {sel && (
            <span
              className="text-[10px] font-medium ml-1"
              style={{ color: "var(--rose)" }}
            >
              · {sel}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp size={15} style={{ color: "var(--muted)" }} />
        ) : (
          <ChevronDown size={15} style={{ color: "var(--muted)" }} />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 mb-3">
              {sizeGuide.map((row) => {
                const on = sel === row.size;
                return (
                  <button
                    key={row.size}
                    onClick={() => setSel(on ? null : row.size)}
                    className="text-[12px] font-medium px-4 py-2 rounded-full border transition-all duration-200 active:scale-95"
                    style={
                      on
                        ? {
                            background: "var(--ink)",
                            color: "var(--cream)",
                            borderColor: "var(--ink)",
                          }
                        : {
                            background: "var(--cream)",
                            color: "var(--body)",
                            borderColor: "var(--border)",
                          }
                    }
                  >
                    {row.size}
                  </button>
                );
              })}
            </div>
            <AnimatePresence mode="wait">
              {selRow ? (
                <motion.div
                  key={selRow.size}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    background: "var(--cream)",
                    borderColor: "var(--border)",
                    boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    className="flex items-center gap-2.5 px-4 py-3 border-b"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <span className="f-display text-[22px] leading-none">
                      {selRow.size}
                    </span>
                    <div
                      className="w-px h-4"
                      style={{ background: "var(--border)" }}
                    />
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--muted)" }}
                    >
                      Số đo tham khảo (cm)
                    </span>
                  </div>
                  <div
                    className="grid divide-x divide-y"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(activeCols.length, 3)},1fr)`,
                      borderColor: "var(--surface)",
                    }}
                  >
                    {activeCols.map((col) => (
                      <div key={col.key} className="px-3 py-3 text-center">
                        <p
                          className="text-[9px] uppercase tracking-[0.1em] mb-1"
                          style={{ color: "var(--muted)" }}
                        >
                          {col.label}
                        </p>
                        <p
                          className="text-[14px] font-semibold"
                          style={{ color: "var(--ink)" }}
                        >
                          {selRow[col.key] || (
                            <span
                              style={{
                                color: "var(--border)",
                                fontWeight: 300,
                              }}
                            >
                              —
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.p
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] text-center py-1 italic"
                  style={{ color: "var(--muted)" }}
                >
                  Chọn size để xem số đo ♡
                </motion.p>
              )}
            </AnimatePresence>
            <p
              className="text-[10px] mt-2.5 italic"
              style={{ color: "var(--muted)" }}
            >
              * Số đo có thể sai lệch ±1–2 cm, nhắn IG để được tư vấn nhé
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function MixMatch({ items }: { items: ProductDetail["mix_match_items"] }) {
  if (!items?.length) return null;
  return (
    <section className="mt-7">
      <div className="flex items-center justify-between px-5 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="f-display text-[15px]"
            style={{ color: "var(--body)" }}
          >
            Phối cùng
          </span>
          <span className="text-[10px]" style={{ color: "var(--muted)" }}>
            curated set
          </span>
        </div>
        <button
          className="flex items-center text-[11px]"
          style={{ color: "var(--muted)" }}
        >
          Xem tất cả <ChevronRight size={12} />
        </button>
      </div>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-5 pb-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="shrink-0 w-[115px] rounded-2xl overflow-hidden border cursor-pointer"
            style={{ background: "var(--cream)", borderColor: "var(--border)" }}
          >
            <div
              className="relative aspect-[3/4] overflow-hidden"
              style={{ background: "var(--surface)" }}
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover"
                sizes="115px"
              />
            </div>
            <div className="p-2.5">
              <h3
                className="text-[10px] font-medium line-clamp-2 leading-snug mb-1"
                style={{ color: "var(--body)" }}
              >
                {item.title}
              </h3>
              <span
                className="text-[11px] font-semibold"
                style={{ color: "var(--rose)" }}
              >
                {fmt(item.price)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════
   WishlistBtn — dùng chung cho AffiliateView & OrderView
   onToggle được truyền từ ngoài vào — caller tự gọi track
══════════════════════════════════════════════════════════════ */
function WishlistBtn({
  liked,
  onToggle,
}: {
  liked: boolean;
  onToggle: () => void;
}) {
  const [anim, setAnim] = useState(false);
  const handle = () => {
    onToggle();
    setAnim(true);
    setTimeout(() => setAnim(false), 400);
  };
  return (
    <motion.button
      onClick={handle}
      animate={anim ? { scale: [1, 1.3, 0.9, 1] } : {}}
      transition={{ duration: 0.35 }}
      className="w-12 h-12 rounded-2xl border-[1.5px] flex items-center justify-center"
      style={
        liked
          ? {
              background: "var(--rose-lt)",
              borderColor: "color-mix(in srgb,var(--rose) 40%,var(--border))",
            }
          : { background: "var(--cream)", borderColor: "var(--border)" }
      }
    >
      <Heart
        size={20}
        style={{
          color: liked ? "var(--rose)" : "var(--muted)",
          fill: liked ? "var(--rose)" : "transparent",
        }}
      />
    </motion.button>
  );
}

/* ══════════════════════════════════════════════════════════════
   AFFILIATE VIEW
══════════════════════════════════════════════════════════════ */
function AffiliateView({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const { isFavorite, toggle } = useFavorites();
  const liked = isFavorite(product.id);
  const [showRedirect, setShowRedirect] = useState(false);
  const platform = detectPlatform(
    product.metadata.affiliate_link,
    product.metadata.platform,
  );
  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round(
          ((product.original_price - product.price) / product.original_price) *
            100,
        )
      : 0;

  // ── track shopee_cta_click — <a> tag mở link, handler chỉ track + overlay
  const handleCTA = () => {
    track("shopee_cta_click", { id: product.id, title: product.title });
    setShowRedirect(true);
    setTimeout(() => setShowRedirect(false), 1200);
  };

  return (
    <Page>
      <style>{SHIMMER_KEYFRAME}</style>
      <main className="pb-24">
        <MediaGallery product={product} onBack={() => router.back()} />
        <Stagger>
          <section className="px-5 pt-2">
            <StaggerItem>
              <div className="flex items-center gap-2 mb-3">
                {platform && (
                  <span
                    className="text-[10px] font-medium px-2.5 py-1 rounded-full"
                    style={{
                      color: "var(--muted)",
                      background: "var(--surface)",
                    }}
                  >
                    {platformLabel(platform)}
                  </span>
                )}
                <span
                  className="text-[10px] italic"
                  style={{ color: "var(--rose)" }}
                >
                  ✦ Stylist pick
                </span>
              </div>
            </StaggerItem>
            <StaggerItem>
              <h1
                className="f-display leading-[1.25] mb-3"
                style={{ fontSize: "24px" }}
              >
                {product.title}
              </h1>
            </StaggerItem>
            <StaggerItem>
              <div className="flex items-baseline gap-3 mb-5">
                <span
                  className="text-[22px] font-semibold tracking-tight"
                  style={{ color: "var(--ink)" }}
                >
                  {product.price > 0 ? fmt(product.price) : "Liên hệ"}
                </span>
                {discount > 0 && product.original_price && (
                  <>
                    <span
                      className="text-[13px] line-through"
                      style={{ color: "var(--muted)" }}
                    >
                      {fmt(product.original_price)}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        color: "var(--rose)",
                        background: "var(--rose-lt)",
                      }}
                    >
                      -{discount}%
                    </span>
                  </>
                )}
              </div>
            </StaggerItem>
            {product.tags?.length > 0 && (
              <StaggerItem>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2.5 py-1 rounded-full"
                      style={{
                        color: "var(--muted)",
                        background: "var(--surface)",
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </StaggerItem>
            )}
            <StaggerItem>
              <CuratorNote note={product.curator_note} />
            </StaggerItem>
          </section>
          <StaggerItem>
            <MixMatch items={product.mix_match_items} />
          </StaggerItem>
          <StaggerItem>
            <section className="px-5 mt-6">
              <div
                className="rounded-2xl p-4 space-y-3"
                style={{ background: "var(--surface)" }}
              >
                {[
                  { emoji: "📦", text: "Giao hàng 3–5 ngày (Nội thành HCM)" },
                  { emoji: "📐", text: "Xem chi tiết size trên sàn" },
                  { emoji: "🔄", text: "Chính sách đổi trả theo sàn" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <span className="text-[15px]">{item.emoji}</span>
                    <span
                      className="text-[12px] font-light"
                      style={{ color: "var(--body)" }}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </StaggerItem>
        </Stagger>
      </main>

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 backdrop-blur-xl border-t"
        style={{
          background: "color-mix(in srgb,var(--cream) 92%,transparent)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-3 px-5 py-3">
          {/* ── track product_favorite từ wishlist bar ── */}
          <WishlistBtn
            liked={liked}
            onToggle={() => {
              toggle(product.id);
              track("product_favorite", {
                id: product.id,
                title: product.title,
              });
            }}
          />
          <a
            href={product.metadata.affiliate_link ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCTA}
            className="flex-1 h-12 rounded-full font-semibold text-[13px] tracking-wide flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            style={
              platform === "shopee"
                ? { background: "#EE4D2D", color: "white" }
                : { background: "var(--ink)", color: "var(--cream)" }
            }
          >
            {platform === "shopee" && (
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <rect
                  width="32"
                  height="32"
                  rx="6"
                  fill="white"
                  fillOpacity="0.15"
                />
                <path
                  d="M16 4C13.2 4 11 6.2 11 9H9C7.9 9 7 9.9 7 11v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V11c0-1.1-.9-2-2-2h-2c0-2.8-2.2-5-5-5zm0 2c1.7 0 3 1.3 3 3h-6c0-1.7 1.3-3 3-3z"
                  fill="white"
                />
                <circle cx="13" cy="18" r="1.5" fill="white" />
                <circle cx="19" cy="18" r="1.5" fill="white" />
                <path
                  d="M13 21.5c.8.8 2 1.5 3 1.5s2.2-.7 3-1.5"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            )}
            {product.metadata.cta_label ??
              `Mua trên ${platformLabel(platform)}`}
            {platform !== "shopee" && (
              <ArrowUpRight size={15} strokeWidth={2.2} />
            )}
          </a>
        </div>
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>

      <AnimatePresence>
        {showRedirect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 300 }}
              className="relative rounded-3xl px-8 py-9 mx-8 max-w-[260px] w-full shadow-2xl text-center"
              style={{ background: "var(--cream)" }}
            >
              <div className="w-14 h-14 mx-auto mb-5 relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.9,
                    ease: "linear",
                  }}
                  className="absolute inset-0 rounded-full border-[2px]"
                  style={{
                    borderColor: "var(--border)",
                    borderTopColor: "var(--rose)",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ExternalLink size={16} style={{ color: "var(--body)" }} />
                </div>
              </div>
              <p className="f-display text-[19px] mb-1">Đang chuyển hướng</p>
              <p
                className="text-[11px] font-light"
                style={{ color: "var(--muted)" }}
              >
                đến {platformLabel(platform)}...
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.5,
                      delay: i * 0.12,
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
    </Page>
  );
}

/* ══════════════════════════════════════════════════════════════
   ORDER VIEW
══════════════════════════════════════════════════════════════ */
function OrderView({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const { isFavorite, toggle } = useFavorites();
  const liked = isFavorite(product.id);
  const [showAiToast, setShowAiToast] = useState(false);

  const igLink =
    product.metadata.ig_link ?? product.metadata.ig_post_url ?? product.ig_link;
  const estimatedTime =
    product.estimated_time ?? product.metadata.estimated_time;
  const depositRule = product.deposit_rule ?? product.metadata.deposit_rule;
  const sizeGuide = (product.size_guide ??
    product.metadata.size_guide ??
    []) as SizeRow[];

  return (
    <Page>
      <style>{SHIMMER_KEYFRAME}</style>
      <main className="pb-28">
        <MediaGallery
          product={product}
          onBack={() => router.back()}
          extraButton={
            <button
              onClick={() => {
                setShowAiToast(true);
                setTimeout(() => setShowAiToast(false), 2200);
              }}
              className="flex items-center gap-1.5 text-[11px] font-medium px-3.5 py-1.5 rounded-full active:scale-95 transition-transform border backdrop-blur-md"
              style={{
                background: "color-mix(in srgb,var(--cream) 70%,transparent)",
                color: "var(--body)",
                borderColor: "color-mix(in srgb,white 50%,transparent)",
              }}
            >
              <Sparkles size={11} style={{ color: "var(--rose)" }} /> Chức năng
              ẩn
            </button>
          }
        />

        <Stagger>
          <section className="px-5 pt-2">
            <StaggerItem>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-[10px] font-semibold text-white px-2.5 py-1 rounded-full tracking-wide"
                  style={{ background: "var(--ink)" }}
                >
                  Hàng Order
                </span>
                <span
                  className="text-[10px] italic"
                  style={{ color: "var(--rose)" }}
                >
                  ✦ Stylist pick
                </span>
              </div>
            </StaggerItem>
            <StaggerItem>
              <h1
                className="f-display leading-[1.25] mb-3"
                style={{ fontSize: "24px" }}
              >
                {product.title}
              </h1>
            </StaggerItem>
            <StaggerItem>
              <div className="mb-1">
                <span
                  className="text-[24px] font-semibold tracking-tight"
                  style={{ color: "var(--ink)" }}
                >
                  {product.price > 0 ? fmt(product.price) : "Liên hệ giá"}
                </span>
              </div>
              {estimatedTime && (
                <p
                  className="text-[11px] mb-5 leading-relaxed font-light"
                  style={{ color: "var(--muted)" }}
                >
                  Hàng Order QC {estimatedTime}
                  {depositRule && (
                    <>
                      {" · "}
                      <span
                        className="font-medium"
                        style={{ color: "var(--body)" }}
                      >
                        {depositRule}
                      </span>
                    </>
                  )}
                </p>
              )}
            </StaggerItem>
            {product.tags?.length > 0 && (
              <StaggerItem>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2.5 py-1 rounded-full"
                      style={{
                        color: "var(--muted)",
                        background: "var(--surface)",
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </StaggerItem>
            )}
            <StaggerItem>
              <CuratorNote note={product.curator_note} />
            </StaggerItem>
          </section>

          <StaggerItem>
            <section className="px-5 mt-6">
              <div
                className="rounded-2xl p-4"
                style={{ background: "var(--surface)" }}
              >
                <div className="flex items-center gap-2 mb-3.5">
                  <Info size={12} style={{ color: "var(--muted)" }} />
                  <span
                    className="text-[10px] font-bold tracking-[0.1em] uppercase"
                    style={{ color: "var(--body)" }}
                  >
                    Quy trình order
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      icon: MessageCircle,
                      title: "Tư vấn size 1:1",
                      desc: "Nhắn IG kèm chiều cao, cân nặng — shop chọn size chuẩn cho nàng",
                      line: true,
                    },
                    {
                      icon: Package,
                      title: "Kiếm hàng tại kho",
                      desc: "Ảnh thật QC chất lượng tại kho TQ trước khi gửi về",
                      line: true,
                    },
                    {
                      icon: Plane,
                      title: "Nhận hàng",
                      desc: `${estimatedTime ?? "7–15 ngày"} sau khi cọc thành công`,
                      line: false,
                    },
                  ].map((step) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.title} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm shrink-0 border"
                            style={{
                              background: "var(--cream)",
                              borderColor: "var(--border)",
                            }}
                          >
                            <Icon size={13} style={{ color: "var(--rose)" }} />
                          </div>
                          {step.line && (
                            <div
                              className="w-px flex-1 mt-1.5"
                              style={{ background: "var(--border)" }}
                            />
                          )}
                        </div>
                        <div className={step.line ? "pb-3" : ""}>
                          <p
                            className="text-[12px] font-semibold mb-0.5"
                            style={{ color: "var(--ink)" }}
                          >
                            {step.title}
                          </p>
                          <p
                            className="text-[11px] leading-relaxed font-light"
                            style={{ color: "var(--muted)" }}
                          >
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </StaggerItem>

          <StaggerItem>
            <SizeGuide sizeGuide={sizeGuide} />
          </StaggerItem>
          <StaggerItem>
            <MixMatch items={product.mix_match_items} />
          </StaggerItem>
        </Stagger>
      </main>

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 backdrop-blur-xl border-t"
        style={{
          background: "color-mix(in srgb,var(--cream) 92%,transparent)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-3 px-5 py-3">
          {/* ── track product_favorite từ wishlist bar ── */}
          <WishlistBtn
            liked={liked}
            onToggle={() => {
              toggle(product.id);
              track("product_favorite", {
                id: product.id,
                title: product.title,
              });
            }}
          />
          <motion.button
            onClick={() => igLink && window.open(igLink, "_blank")}
            whileTap={{ scale: 0.96 }}
            className="relative flex-1 h-12 rounded-full overflow-hidden shadow-md shadow-pink-200/20"
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg,#833AB4 0%,#C13584 30%,#E1306C 55%,#F77737 80%,#FCAF45 100%)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="relative flex items-center justify-center gap-2 h-full">
              <Instagram size={16} className="text-white" strokeWidth={2} />
              <span className="text-white text-[13px] font-semibold tracking-wide">
                Nhắn IG để đặt hàng
              </span>
            </div>
          </motion.button>
        </div>
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>

      <AnimatePresence>
        {showAiToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-3rem)] max-w-[calc(28rem-3rem)]"
          >
            <div
              className="rounded-2xl shadow-xl border p-4 flex items-center gap-3"
              style={{
                background: "var(--cream)",
                borderColor: "var(--border)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--rose-lt)" }}
              >
                <Sparkles size={17} style={{ color: "var(--rose)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[12px] font-semibold"
                  style={{ color: "var(--ink)" }}
                >
                  Chức năng ẩn — Sắp ra mắt ✨
                </p>
                <p
                  className="text-[11px] mt-0.5 font-light"
                  style={{ color: "var(--muted)" }}
                >
                  Tính năng đang hoàn thiện!
                </p>
              </div>
              <button
                onClick={() => setShowAiToast(false)}
                className="p-1 rounded-full shrink-0"
                style={{ background: "var(--surface)" }}
              >
                <X size={13} style={{ color: "var(--muted)" }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}
