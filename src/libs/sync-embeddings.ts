// libs/sync-embeddings.ts
import { createClient } from "@supabase/supabase-js";
import { pipeline } from "@xenova/transformers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!;
const MEDUSA_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!;

function optimizeCloudinaryUrl(url: string): string {
  if (!url.includes("res.cloudinary.com")) return url;
  return url.replace(
    "/image/upload/",
    "/image/upload/w_300,h_300,c_fit,q_auto,f_jpg/",
  );
}

export async function syncNewEmbeddings() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Load embeddings hiện có từ Supabase Storage
  const { data: blob } = await supabase.storage
    .from("embeddings")
    .download("products.json");

  const existing: Record<string, number[]> = blob
    ? JSON.parse(await blob.text())
    : {};

  console.log(
    `[SyncEmbeddings] Hiện có ${Object.keys(existing).length} embeddings`,
  );

  // 2. Fetch toàn bộ sản phẩm từ Medusa
  const res = await fetch(
    `${MEDUSA_URL}/store/products?limit=500&fields=+metadata,+images`,
    {
      headers: {
        "x-publishable-api-key": MEDUSA_KEY,
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Medusa API error: ${res.status}`);
  }

  const { products } = await res.json();

  // 3. Chỉ lấy sản phẩm chưa có embedding (incremental)
  const newProducts = products.filter(
    (p: any) => !existing[p.id] && (p.images?.[0]?.url || p.thumbnail),
  );

  console.log(`[SyncEmbeddings] ${newProducts.length} sản phẩm mới cần embed`);

  if (newProducts.length === 0) {
    return { synced: 0, total: Object.keys(existing).length };
  }

  // 4. Load CLIP model và embed từng sản phẩm mới
  const extractor = await pipeline(
    "image-feature-extraction",
    "Xenova/clip-vit-base-patch32",
  );

  const embeddings = { ...existing };
  let synced = 0;
  let failed = 0;

  for (const p of newProducts) {
    const rawUrl = p.images?.[0]?.url ?? p.thumbnail;
    const url = optimizeCloudinaryUrl(rawUrl);

    try {
      const output = await extractor(url, {
        pooling: "mean",
        normalize: true,
      } as any);
      embeddings[p.id] = Array.from(output.data as Float32Array);
      synced++;
      console.log(`[SyncEmbeddings] ✓ ${p.title?.slice(0, 40)}`);
    } catch (e) {
      failed++;
      console.warn(`[SyncEmbeddings] ✗ ${p.id}:`, e);
    }
  }

  // 5. Upload lại lên Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("embeddings")
    .upload(
      "products.json",
      new Blob([JSON.stringify(embeddings)], { type: "application/json" }),
      { upsert: true, cacheControl: "3600" },
    );

  if (uploadError) {
    throw new Error(`Upload thất bại: ${uploadError.message}`);
  }

  console.log(
    `[SyncEmbeddings] ✅ Xong — synced: ${synced}, failed: ${failed}, total: ${Object.keys(embeddings).length}`,
  );

  return {
    synced,
    failed,
    total: Object.keys(embeddings).length,
  };
}
