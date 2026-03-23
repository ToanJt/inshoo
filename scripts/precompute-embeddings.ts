// scripts/precompute-embeddings.ts
//
// Chạy: npx tsx scripts/precompute-embeddings.ts
//
// Yêu cầu: npm install -D @xenova/transformers tsx
// (@supabase/supabase-js thường đã có sẵn trong dự án)
//
// Script này:
//  1. Fetch toàn bộ sản phẩm từ Medusa API
//  2. Tạo embedding 512 chiều cho mỗi ảnh (qua CLIP)
//  3. Merge với embeddings cũ (incremental — bỏ qua product đã có)
//  4. Upload file products.json lên Supabase Storage bucket "embeddings"

import { pipeline } from "@xenova/transformers";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

/* ── Env ──────────────────────────────────────────────────────── */
const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!;
const MEDUSA_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!MEDUSA_URL || !MEDUSA_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Thiếu biến môi trường. Kiểm tra .env.local");
  process.exit(1);
}

/* ── Cloudinary optimization ──────────────────────────────────── */
// CLIP chỉ cần 224×224 — không cần gửi ảnh full resolution lên
function optimizeCloudinaryUrl(url: string): string {
  if (!url.includes("res.cloudinary.com")) return url;
  return url.replace(
    "/image/upload/",
    "/image/upload/w_300,h_300,c_fit,q_auto,f_jpg/",
  );
}

/* ── Fetch tất cả sản phẩm từ Medusa (có phân trang) ─────────── */
async function fetchAllProducts(): Promise<any[]> {
  const products: any[] = [];
  let offset = 0;
  const limit = 100;

  console.log("📦 Fetching products từ Medusa...");

  while (true) {
    const res = await fetch(
      `${MEDUSA_URL}/store/products?limit=${limit}&offset=${offset}&fields=+metadata,+images`,
      {
        headers: {
          "x-publishable-api-key": MEDUSA_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) {
      throw new Error(`Medusa API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const batch = data.products ?? [];
    products.push(...batch);

    console.log(
      `  → Fetched ${products.length} / ${data.count ?? "?"} products`,
    );

    if (products.length >= (data.count ?? 0) || batch.length < limit) break;
    offset += limit;
  }

  return products;
}

/* ── Main ─────────────────────────────────────────────────────── */
async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ── Bước 1: Load embeddings hiện có từ Supabase Storage ────────
  let existing: Record<string, number[]> = {};
  try {
    const { data: blob, error } = await supabase.storage
      .from("embeddings")
      .download("products.json");

    if (blob && !error) {
      const text = await blob.text();
      existing = JSON.parse(text);
      console.log(`📂 Loaded ${Object.keys(existing).length} embeddings đã có`);
    } else {
      console.log("📂 Chưa có embeddings, bắt đầu từ đầu");
    }
  } catch {
    console.log("📂 Bắt đầu fresh");
  }

  // ── Bước 2: Load CLIP model ─────────────────────────────────────
  console.log("\n⏳ Loading CLIP model (lần đầu sẽ download ~80MB)...");
  const extractor = await pipeline(
    "image-feature-extraction",
    "Xenova/clip-vit-base-patch32",
  );
  console.log("✅ CLIP model sẵn sàng\n");

  // ── Bước 3: Fetch products & generate embeddings ────────────────
  const products = await fetchAllProducts();
  console.log(`\n📊 Tổng: ${products.length} sản phẩm\n`);

  const embeddings: Record<string, number[]> = { ...existing };
  let processed = 0,
    skipped = 0,
    failed = 0;

  for (const product of products) {
    // Incremental: bỏ qua nếu đã có embedding
    if (embeddings[product.id]) {
      skipped++;
      continue;
    }

    // Lấy URL ảnh đầu tiên
    const rawUrl = product.images?.[0]?.url ?? product.thumbnail ?? null;

    if (!rawUrl) {
      console.warn(`  ✗ [no image] ${product.id}: ${product.title}`);
      failed++;
      continue;
    }

    const imageUrl = optimizeCloudinaryUrl(rawUrl);

    try {
      const output = await extractor(imageUrl, {
        pooling: "mean",
        normalize: true,
      } as any);

      embeddings[product.id] = Array.from(output.data as Float32Array);
      processed++;
      console.log(`  ✓ [${processed}] ${product.title?.slice(0, 50)}`);
    } catch (e) {
      failed++;
      console.warn(`  ✗ [error] ${product.id}: ${e}`);
    }
  }

  // ── Bước 4: Upload lên Supabase Storage ────────────────────────
  console.log("\n📤 Uploading lên Supabase Storage...");

  const json = JSON.stringify(embeddings);
  const blob = new Blob([json], { type: "application/json" });

  const { error: uploadError } = await supabase.storage
    .from("embeddings")
    .upload("products.json", blob, {
      upsert: true, // ghi đè nếu đã tồn tại
      cacheControl: "3600", // browser cache 1 giờ
      contentType: "application/json",
    });

  if (uploadError) {
    console.error("❌ Upload thất bại:", uploadError.message);
    console.log(
      "\n💡 Tạo bucket 'embeddings' trong Supabase Storage (public) trước nhé!",
    );
    process.exit(1);
  }

  // ── Kết quả ────────────────────────────────────────────────────
  const totalEmbedded = Object.keys(embeddings).length;
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Hoàn thành!`);
  console.log(`   Đã xử lý mới : ${processed}`);
  console.log(`   Bỏ qua (có rồi): ${skipped}`);
  console.log(`   Thất bại     : ${failed}`);
  console.log(`   Tổng embedding: ${totalEmbedded}`);
  console.log(`   File size    : ${(json.length / 1024).toFixed(1)} KB`);
  console.log(
    `\n🔗 URL: ${SUPABASE_URL}/storage/v1/object/public/embeddings/products.json`,
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((err) => {
  console.error("❌ Script lỗi:", err);
  process.exit(1);
});
