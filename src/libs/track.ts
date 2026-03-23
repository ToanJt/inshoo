// libs/track.ts
// Gọi hàm này bất cứ đâu trong Next.js để ghi analytics event

export type TrackEvent =
  | "page_view"
  | "product_click"
  | "product_favorite"
  | "shopee_cta_click"
  | "image_search";

export function track(
  event: TrackEvent,
  product?: { id: string; title: string },
) {
  // fire-and-forget — không await, không làm chậm UI
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      product_id: product?.id,
      product_title: product?.title,
    }),
  }).catch(() => {
    /* analytics không được làm crash app */
  });
}
