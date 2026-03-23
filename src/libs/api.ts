// libs/api.ts
import { medusa } from "./medusa";
import type {
  Product,
  ProductDetail,
  ProductVariant,
  ProductOption,
} from "./products";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=500&auto=format&fit=crop";

/* ═══════════════════════════════════════════════════════════════
   REGION — cache cả trong memory lẫn localStorage
   ═══════════════════════════════════════════════════════════════ */

const REGION_CACHE_KEY = "inshoo_region_id";

let memoryRegionId: string | null = null;

async function getRegionId(): Promise<string> {
  // 1. Memory cache (trong cùng session, nhanh nhất)
  if (memoryRegionId) return memoryRegionId;

  // 2. localStorage cache (tồn tại qua refresh)
  try {
    const stored = localStorage.getItem(REGION_CACHE_KEY);
    if (stored) {
      memoryRegionId = stored;
      return stored;
    }
  } catch {
    /* ignore */
  }

  // 3. Fetch từ server (chỉ chạy lần đầu tiên duy nhất)
  const { regions } = await medusa.store.region.list();
  if (!regions.length) throw new Error("Không tìm thấy region nào");

  memoryRegionId = regions[0].id;

  try {
    localStorage.setItem(REGION_CACHE_KEY, memoryRegionId);
  } catch {
    /* ignore */
  }

  return memoryRegionId;
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function optimizeCloudinaryUrl(url: string, width = 600): string {
  if (!url.includes("res.cloudinary.com")) return url;
  // Chèn transform params vào URL Cloudinary
  // Từ: https://res.cloudinary.com/xxx/image/upload/v123/abc.jpg
  // Thành: https://res.cloudinary.com/xxx/image/upload/f_auto,q_auto,w_600/v123/abc.jpg
  return url.replace(
    "/image/upload/",
    `/image/upload/f_auto,q_auto,w_${width}/`,
  );
}

function getPriceFromVariant(variant: any): number {
  if (variant?.calculated_price?.calculated_amount) {
    return variant.calculated_price.calculated_amount;
  }
  const prices: any[] = variant?.prices ?? [];
  const vnd = prices.find((p) => p.currency_code === "vnd");
  return vnd?.amount ?? prices[0]?.amount ?? 0;
}

function extractLowestPrice(variants: any[], metadata: any): number {
  if (metadata?.price) return Number(metadata.price);
  if (!variants?.length) return 0;
  const prices = variants
    .map(getPriceFromVariant)
    .filter((p) => p > 0 && p !== 10);
  return prices.length > 0 ? Math.min(...prices) : 0;
}

function mapVariants(variants: any[]): ProductVariant[] {
  return (variants ?? []).map((v) => ({
    id: v.id ?? "",
    title: v.title ?? "",
    prices: (v.prices ?? []).map((p: any) => ({
      amount: p.amount ?? 0,
      currency_code: p.currency_code ?? "",
    })),
    options: Object.fromEntries(
      (v.options ?? []).map((o: any) => [
        o.option?.title ?? o.option_id ?? "",
        o.value ?? "",
      ]),
    ),
  }));
}

function mapOptions(options: any[]): ProductOption[] {
  return (options ?? []).map((o) => ({
    title: o.title ?? "",
    values: (o.values ?? []).map((v: any) =>
      typeof v === "string" ? v : (v.value ?? ""),
    ),
  }));
}

function mapImages(images: any[]): string[] {
  const urls = (images ?? [])
    .map((img: any) => img.url)
    .filter(Boolean)
    .map((url: string) => optimizeCloudinaryUrl(url, 600)); // 600px đủ cho mobile
  return urls.length > 0 ? urls : [FALLBACK_IMAGE];
}

function mapProduct(p: any): Product {
  return {
    id: p.id ?? "",
    title: p.title ?? "",
    description: p.description ?? "",
    price: extractLowestPrice(p.variants ?? [], p.metadata ?? {}),
    image_urls: mapImages(p.images ?? []),
    options: mapOptions(p.options ?? []),
    variants: mapVariants(p.variants ?? []),
    metadata: {
      product_type:
        (p.metadata?.product_type as "affiliate" | "order") ?? "order",
      taobao_link: p.metadata?.taobao_link,
      ig_post_url: p.metadata?.ig_post_url,
      deposit_amount: p.metadata?.deposit_amount
        ? Number(p.metadata.deposit_amount)
        : undefined,
      estimated_time: p.metadata?.estimated_time,
      deposit_rule: p.metadata?.deposit_rule,
      ig_link: p.metadata?.ig_link ?? p.metadata?.ig_post_url,
      size_guide: p.metadata?.size_guide,
      affiliate_link: p.metadata?.affiliate_link,
      platform: p.metadata?.platform,
      cta_label: p.metadata?.cta_label,
      curator_note: p.metadata?.curator_note,
      original_price: p.metadata?.original_price
        ? Number(p.metadata.original_price)
        : undefined,
      // ✅ Thêm vibe vào đây nếu dùng trong ProductCard
      vibe: p.metadata?.vibe,
    },
  };
}

/* ═══════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════ */

export async function fetchProducts(): Promise<Product[]> {
  // ✅ getRegionId() giờ không còn tốn ~800ms nữa sau lần đầu
  const region_id = await getRegionId();

  const { products } = await medusa.store.product.list({
    limit: 1000,
    region_id,
    fields: "+metadata",
  });

  return products.map(mapProduct);
}

export async function fetchProductDetail(
  id: string,
): Promise<ProductDetail | null> {
  try {
    const region_id = await getRegionId();

    const { product: p } = await medusa.store.product.retrieve(id, {
      region_id,
      fields: "+metadata",
    });

    const base = mapProduct(p);

    return {
      ...base,
      original_price: base.metadata.original_price,
      curator_note: base.metadata.curator_note ?? p.description ?? "",
      tags: (p.tags ?? []).map((t: any) => t.value ?? ""),
      estimated_time: base.metadata.estimated_time,
      deposit_rule: base.metadata.deposit_rule,
      ig_link: base.metadata.ig_link,
      size_guide: base.metadata.size_guide,
      mix_match_items: [],
    };
  } catch (err) {
    console.error("fetchProductDetail error:", err);
    return null;
  }
}
