// libs/use-image-search.ts
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { Product } from "./products";

function cosine(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

// Threshold thấp để bắt được kết quả dù ảnh hơi khác tỉ lệ
const SIMILARITY_THRESHOLD = 0.25;
const MAX_RESULTS = 20;

// ✅ Sau — bust cache mỗi 10 phút
function getEmbeddingsUrl() {
  const bust = Math.floor(Date.now() / (10 * 60 * 1000));
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/embeddings/products.json?t=${bust}`;
}

export type ImageSearchState = {
  searchByImage: (file: File) => Promise<Product[]>;
  modelReady: boolean;
  loadingPct: number;
  searching: boolean;
  error: string | null;
};

export function useImageSearch(products: Product[]): ImageSearchState {
  const workerRef = useRef<Worker | null>(null);
  const embeddingsRef = useRef<Record<string, number[]>>({});
  const embeddingsLoadedRef = useRef(false);

  const [modelReady, setModelReady] = useState(false);
  const [loadingPct, setLoadingPct] = useState(0);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef<Map<string, (emb: number[]) => void>>(new Map());

  useEffect(() => {
    // ── 1. Khởi tạo Worker ──────────────────────────────────────
    let worker: Worker;
    try {
      worker = new Worker("/workers/clip-worker.js", { type: "module" });
      workerRef.current = worker;
    } catch (e) {
      console.error("[ImageSearch] ❌ Không tạo được Worker:", e);
      console.error("  → Kiểm tra file tại: public/workers/clip-worker.js");
      setError("Không khởi tạo được search engine");
      return;
    }

    worker.onmessage = ({ data }) => {
      switch (data.type) {
        case "progress":
          setLoadingPct(data.pct ?? 0);
          break;
        case "ready":
          console.log("[ImageSearch] ✅ CLIP model sẵn sàng");
          setModelReady(true);
          break;
        case "result": {
          const resolver = pendingRef.current.get(data.requestId);
          if (resolver) {
            resolver(data.embedding);
            pendingRef.current.delete(data.requestId);
          }
          break;
        }
        case "error":
          console.error("[ImageSearch] ❌ Worker error:", data.message);
          setError(data.message ?? "Lỗi model");
          if (data.requestId) {
            const resolver = pendingRef.current.get(data.requestId);
            if (resolver) {
              resolver([]);
              pendingRef.current.delete(data.requestId);
            }
          }
          break;
      }
    };

    worker.onerror = (e) => {
      console.error("[ImageSearch] ❌ Worker onerror:", e.message);
      console.error(
        "  → Thường do lỗi syntax trong clip-worker.js hoặc CDN bị block",
      );
    };

    worker.postMessage({ type: "init" });

    // ── 2. Fetch embeddings.json từ Supabase Storage ────────────
    console.log("[ImageSearch] 📥 Fetching embeddings từ:", getEmbeddingsUrl());
    fetch(getEmbeddingsUrl())
      .then((r) => {
        if (!r.ok) {
          throw new Error(
            `HTTP ${r.status} — Kiểm tra bucket "embeddings" đã public chưa, và đã chạy script precompute chưa`,
          );
        }
        return r.json();
      })
      .then((data: Record<string, number[]>) => {
        embeddingsRef.current = data;
        embeddingsLoadedRef.current = true;
        const count = Object.keys(data).length;
        console.log(`[ImageSearch] ✅ Loaded ${count} embeddings`);
        if (count === 0) {
          console.warn(
            "[ImageSearch] ⚠️ File rỗng — chạy lại script precompute",
          );
        }
      })
      .catch((err) => {
        console.error(
          "[ImageSearch] ❌ Không load được embeddings.json:",
          err.message,
        );
        embeddingsLoadedRef.current = false;
      });

    return () => {
      worker.terminate();
      pendingRef.current.clear();
    };
  }, []);

  const searchByImage = useCallback(
    async (file: File): Promise<Product[]> => {
      // ── Guard checks ──────────────────────────────────────────
      if (!workerRef.current) {
        console.error("[ImageSearch] ❌ Worker chưa khởi tạo");
        setError("Search engine chưa sẵn sàng");
        return [];
      }
      if (!modelReady) {
        console.warn(
          "[ImageSearch] ⚠️ Model chưa load xong, loadingPct:",
          loadingPct,
        );
        setError("Model đang tải, vui lòng thử lại sau");
        return [];
      }
      if (
        !embeddingsLoadedRef.current ||
        Object.keys(embeddingsRef.current).length === 0
      ) {
        console.error("[ImageSearch] ❌ embeddings.json chưa load hoặc rỗng");
        console.error("  URL:", getEmbeddingsUrl());
        setError(
          "Dữ liệu tìm kiếm chưa sẵn sàng — kiểm tra Console để biết thêm",
        );
        return [];
      }

      setSearching(true);
      setError(null);

      try {
        // Convert File → base64 data URL
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error("Không đọc được file"));
          reader.readAsDataURL(file);
        });

        // Gửi sang Worker để embed
        const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const embedding = await new Promise<number[]>((resolve) => {
          pendingRef.current.set(requestId, resolve);
          workerRef.current!.postMessage({
            type: "embed",
            imageDataUrl: dataUrl,
            requestId,
          });
        });

        if (!embedding.length) {
          console.error("[ImageSearch] ❌ Worker trả về embedding rỗng");
          return [];
        }

        // Tính similarity
        const allProducts = products.filter((p) => embeddingsRef.current[p.id]);
        const missingCount = products.length - allProducts.length;
        if (missingCount > 0) {
          console.warn(
            `[ImageSearch] ⚠️ ${missingCount} sản phẩm chưa có embedding`,
          );
        }

        const allScored = allProducts
          .map((p) => ({
            p,
            score: cosine(embedding, embeddingsRef.current[p.id]),
          }))
          .sort((a, b) => b.score - a.score);

        // Log top 5 để dễ điều chỉnh threshold
        console.log(
          "[ImageSearch] 📊 Top 5 similarity scores:",
          allScored
            .slice(0, 5)
            .map((x) => `${x.score.toFixed(3)} — ${x.p.title.slice(0, 30)}`),
        );
        console.log(
          `[ImageSearch] Threshold: ${SIMILARITY_THRESHOLD} | Kết quả: ${allScored.filter((x) => x.score >= SIMILARITY_THRESHOLD).length}`,
        );

        const results = allScored
          .filter((x) => x.score >= SIMILARITY_THRESHOLD)
          .slice(0, MAX_RESULTS)
          .map((x) => x.p);

        return results;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[ImageSearch] ❌ searchByImage error:", msg);
        setError(msg);
        return [];
      } finally {
        setSearching(false);
      }
    },
    [products, modelReady, loadingPct],
  );

  return { searchByImage, modelReady, loadingPct, searching, error };
}
