/* ═══════════════════════════════════════════════════════════════
   SHARED TYPES — Schema đồng bộ với Medusa V2
   ═══════════════════════════════════════════════════════════════ */

export interface ProductOption {
  title: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  title: string;
  prices: {
    amount: number;
    currency_code: string;
  }[];
  options: Record<string, string>;
}

export interface SizeEntry {
  size: string;
  weight: string;
  waist: string;
}

export interface MixMatchItem {
  id: string;
  title: string;
  price: number;
  image: string;
  is_preorder?: boolean;
}

export interface ProductMetadata {
  product_type: "affiliate" | "order";

  // --- HÀNG ORDER ---
  taobao_link?: string;
  ig_post_url?: string;
  deposit_amount?: number;
  estimated_time?: string;
  deposit_rule?: string;
  ig_link?: string;
  size_guide?: SizeEntry[];

  // --- HÀNG AFFILIATE ---
  affiliate_link?: string;
  platform?: "shopee" | "lazada" | "tiktok";
  cta_label?: string;

  // --- CHUNG ---
  curator_note?: string;
  price?: number;
  original_price?: number;

  /**
   * Danh mục sản phẩm — được AI điền vào write_content.py
   * VD: "áo", "quần", "váy", "áo khoác", "set đồ", "phụ-kiện"
   */
  clothing_type?: string;

  /**
   * Vibe / phong cách — từ khoá AI generate
   * VD: "y2k", "coquette", "minimal", "vintage", "sporty", "tiểu thư"
   */
  vibe?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_urls: string[];
  options: ProductOption[];
  variants: ProductVariant[];
  metadata: ProductMetadata;
}

export interface ProductDetail extends Product {
  original_price?: number;
  curator_note: string;
  tags: string[];
  estimated_time?: string;
  deposit_rule?: string;
  ig_link?: string;
  size_guide?: SizeEntry[];
  mix_match_items: MixMatchItem[];
}

/* ═══════════════════════════════════════════════════════════════
   CLOTHING CATEGORIES
   ═══════════════════════════════════════════════════════════════ */

export type ClothingType =
  | "áo"
  | "quần"
  | "váy"
  | "áo-khoác"
  | "set-đồ"
  | "phụ-kiện"
  | "other";

/** Danh sách category hiển thị trên filter bar */
export const CLOTHING_CATEGORIES: {
  id: ClothingType | "all" | "best-seller";
  label: string;
  emoji: string;
}[] = [
  { id: "all", label: "Tất cả", emoji: "✦" },
  { id: "best-seller", label: "Hot", emoji: "🔥" },
  { id: "áo", label: "Áo", emoji: "👚" },
  { id: "quần", label: "Quần", emoji: "👖" },
  { id: "váy", label: "Váy", emoji: "👗" },
  { id: "áo-khoác", label: "Áo khoác", emoji: "🧥" },
  { id: "set-đồ", label: "Set đồ", emoji: "🎀" },
  { id: "phụ-kiện", label: "Phụ kiện", emoji: "👜" },
];

/* ═══════════════════════════════════════════════════════════════
   VIBE / STYLE TAGS
   ═══════════════════════════════════════════════════════════════ */

export type VibeId =
  | "y2k"
  | "coquette"
  | "minimal"
  | "vintage"
  | "sporty"
  | "tiểu-thư"
  | "chanh-sả"
  | "office"
  | "ootd";

export const VIBES: { id: VibeId; label: string; emoji: string; bg: string }[] =
  [
    { id: "y2k", label: "Y2K", emoji: "✨", bg: "bg-violet-50" },
    { id: "coquette", label: "Coquette", emoji: "🎀", bg: "bg-rose-50" },
    { id: "minimal", label: "Minimal", emoji: "🤍", bg: "bg-stone-100" },
    { id: "vintage", label: "Vintage", emoji: "🌸", bg: "bg-amber-50" },
    { id: "sporty", label: "Sporty", emoji: "⚡", bg: "bg-sky-50" },
    { id: "tiểu-thư", label: "Tiểu thư", emoji: "🪷", bg: "bg-pink-50" },
    { id: "chanh-sả", label: "Chanh sả", emoji: "🍋", bg: "bg-yellow-50" },
    { id: "office", label: "Office", emoji: "💼", bg: "bg-slate-50" },
    { id: "ootd", label: "OOTD", emoji: "📸", bg: "bg-stone-50" },
  ];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

export const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(n) + "đ";

export const detectPlatform = (
  link?: string,
  platform?: string,
): "shopee" | "lazada" | "tiktok" | null => {
  if (platform) return platform as "shopee" | "lazada" | "tiktok";
  if (!link) return null;
  if (link.includes("shopee")) return "shopee";
  if (link.includes("lazada")) return "lazada";
  if (link.includes("tiktok")) return "tiktok";
  return null;
};

export const platformLabel = (
  p: "shopee" | "lazada" | "tiktok" | null,
): string => {
  if (p === "shopee") return "Shopee";
  if (p === "lazada") return "Lazada";
  if (p === "tiktok") return "TikTok Shop";
  return "Cửa hàng";
};

/**
 * Lấy clothing_type từ metadata (AI đã gán) hoặc fallback về
 * phân tích tiêu đề tiếng Việt.
 */
export const categoryOf = (product: Product): ClothingType => {
  // Ưu tiên 1: metadata.clothing_type do AI điền
  const meta = product.metadata?.clothing_type?.toLowerCase().trim();
  if (meta) {
    if (
      meta.includes("áo khoác") ||
      meta.includes("khoác") ||
      meta.includes("jacket") ||
      meta.includes("coat")
    )
      return "áo-khoác";
    if (meta.includes("set") || meta.includes("bộ")) return "set-đồ";
    if (
      meta.includes("váy") ||
      meta.includes("skirt") ||
      meta.includes("dress")
    )
      return "váy";
    if (
      meta.includes("quần") ||
      meta.includes("jean") ||
      meta.includes("pant") ||
      meta.includes("short")
    )
      return "quần";
    if (meta.includes("áo")) return "áo";
    if (
      meta.includes("túi") ||
      meta.includes("giày") ||
      meta.includes("phụ kiện") ||
      meta.includes("mũ") ||
      meta.includes("kính")
    )
      return "phụ-kiện";
  }

  // Fallback: phân tích title
  const t = (product.title ?? "").toLowerCase();
  if (
    t.includes("áo khoác") ||
    t.includes("jacket") ||
    t.includes("blazer") ||
    t.includes("cardigan")
  )
    return "áo-khoác";
  if (t.includes("set ") || t.includes("bộ ") || t.includes("co-ord"))
    return "set-đồ";
  if (t.includes("váy") || t.includes("skirt") || t.includes("dress"))
    return "váy";
  if (
    t.includes("quần") ||
    t.includes("jean") ||
    t.includes("short") ||
    t.includes("legging")
  )
    return "quần";
  if (
    t.includes("áo") ||
    t.includes("thun") ||
    t.includes("croptop") ||
    t.includes("blouse") ||
    t.includes("top")
  )
    return "áo";
  if (
    t.includes("túi") ||
    t.includes("giày") ||
    t.includes("dép") ||
    t.includes("mũ") ||
    t.includes("kính") ||
    t.includes("phụ kiện")
  )
    return "phụ-kiện";

  return "other";
};

/**
 * Lấy vibe của sản phẩm từ metadata hoặc tags.
 * Trả về mảng VibeId để 1 sản phẩm có thể thuộc nhiều vibe.
 */
export const vibesOf = (product: Product): VibeId[] => {
  const results: Set<VibeId> = new Set();

  const candidates = [
    product.metadata?.vibe ?? "",
    ...(product.metadata?.curator_note ? [product.metadata.curator_note] : []),
    product.title ?? "",
    product.description ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const VIBE_KEYWORDS: Record<VibeId, string[]> = {
    y2k: ["y2k", "2000s", "butterfly", "low rise", "cargo", "rhinestone"],
    coquette: [
      "coquette",
      "bow",
      "nơ",
      "ribbon",
      "lace",
      "ren",
      "ballet",
      "babydoll",
    ],
    minimal: ["minimal", "basic", "trơn", "simple", "clean", "tối giản"],
    vintage: ["vintage", "retro", "cổ điển", "floral", "hoa nhí", "boho"],
    sporty: ["sporty", "sport", "thể thao", "jogger", "hoodie", "track"],
    "tiểu-thư": [
      "tiểu thư",
      "sang",
      "feminine",
      "elegant",
      "thanh lịch",
      "lụa",
      "satin",
    ],
    "chanh-sả": [
      "chanh sả",
      "năng động",
      "tươi",
      "bright",
      "playful",
      "summer",
    ],
    office: ["office", "công sở", "blazer", "formal", "professional", "sơ mi"],
    ootd: ["ootd", "trendy", "xuống phố", "street", "outfit"],
  };

  for (const [vibe, keywords] of Object.entries(VIBE_KEYWORDS) as [
    VibeId,
    string[],
  ][]) {
    if (keywords.some((k) => candidates.includes(k))) {
      results.add(vibe);
    }
  }

  return Array.from(results);
};
