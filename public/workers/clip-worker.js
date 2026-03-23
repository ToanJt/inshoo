// public/workers/clip-worker.js
// Đặt file này tại: public/workers/clip-worker.js
// Web Worker chạy CLIP model — hoàn toàn tách khỏi main thread, không block UI

import {
  pipeline,
  env,
} from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js";

// Luôn dùng HuggingFace CDN, cache vào IndexedDB của browser
env.allowLocalModels = false;
env.useBrowserCache = true;

let extractor = null;

self.onmessage = async ({ data }) => {
  // ── INIT: Download & khởi tạo model ────────────────────────────
  if (data.type === "init") {
    try {
      self.postMessage({ type: "status", message: "Đang tải model..." });

      extractor = await pipeline(
        "image-feature-extraction",
        "Xenova/clip-vit-base-patch32",
        {
          progress_callback: (p) => {
            // Báo tiến độ download về main thread
            if (p.status === "downloading" && p.total > 0) {
              const pct = Math.round((p.loaded / p.total) * 100);
              self.postMessage({ type: "progress", pct });
            }
          },
        },
      );

      self.postMessage({ type: "ready" });
    } catch (err) {
      self.postMessage({ type: "error", message: String(err) });
    }
  }

  // ── EMBED: Nhận ảnh → trả về vector 512 chiều ─────────────────
  if (data.type === "embed") {
    if (!extractor) {
      self.postMessage({
        type: "error",
        requestId: data.requestId,
        message: "Model chưa sẵn sàng",
      });
      return;
    }

    try {
      // data.imageDataUrl là base64 data URL từ FileReader
      const output = await extractor(data.imageDataUrl, {
        pooling: "mean",
        normalize: true, // bắt buộc để cosine similarity chính xác
      });

      self.postMessage({
        type: "result",
        requestId: data.requestId,
        embedding: Array.from(output.data), // Float32Array → số thường
      });
    } catch (err) {
      self.postMessage({
        type: "error",
        requestId: data.requestId,
        message: String(err),
      });
    }
  }
};
