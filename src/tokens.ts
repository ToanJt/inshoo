// ════════════════════════════════════════════════════════════════
// INSHOO DESIGN TOKENS — White Social (default, single theme)
// Tone: trắng sạch, quen thuộc như Facebook / Instagram / Twitter
// Chỉnh màu tại đây, toàn app tự cập nhật
// ════════════════════════════════════════════════════════════════

export const TOKENS = {
  // ── Palette ─────────────────────────────────────────────────
  cream: "#FFFFFF", // page background — trắng tinh như IG/FB
  surface: "#F0F2F5", // card / section bg — xám lạnh nhẹ (Facebook standard)
  blush: "#F7F3F0", // curator note, subtle bg — warm-neutral rất nhẹ
  border: "#E4E6EB", // borders — xám tinh tế (Instagram / Facebook)
  muted: "#65676B", // secondary text — xám trung tính đủ tương phản
  body: "#1C1E21", // body text — gần đen, dễ đọc trên nền trắng
  ink: "#050505", // headings, CTAs — đen tinh
  rose: "#FF7070", // accent: prices, active icons — giữ nguyên
  roseLt: "#FDF0EB", // accent light bg — sáng hơn, hòa với nền trắng
  roseDk: "#EB4C4C ", // accent hover — giữ nguyên

  // ── Typography ──────────────────────────────────────────────
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontBody: "'DM Sans', system-ui, sans-serif",
  googleFonts:
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500;1,600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&display=swap",
} as const;

// CSS variables — inject vào :root một lần duy nhất
export const INSHOO_VARS = `
  --cream:    ${TOKENS.cream};
  --surface:  ${TOKENS.surface};
  --blush:    ${TOKENS.blush};
  --border:   ${TOKENS.border};
  --muted:    ${TOKENS.muted};
  --body:     ${TOKENS.body};
  --ink:      ${TOKENS.ink};
  --rose:     ${TOKENS.rose};
  --rose-lt:  ${TOKENS.roseLt};
  --rose-dk:  ${TOKENS.roseDk};
`;

// Base structural CSS (không chứa màu cứng)
export const INSHOO_BASE_CSS = `
  @import url('${TOKENS.googleFonts}');

  .inshoo-root, .inshoo-root * {
    font-family: ${TOKENS.fontBody};
  }
  .inshoo-root .f-display {
    font-family: ${TOKENS.fontDisplay};
    font-style: italic;
    color: var(--ink);
  }
  .size-pill-on {
    box-shadow: 0 0 0 1.5px var(--ink),
                0 0 0 3.5px color-mix(in srgb, var(--ink) 8%, transparent);
  }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// ── Ghi chú thay đổi ────────────────────────────────────────────
//
//  Token      | Trước (Blossom)  | Sau (White Social)   | Lý do
//  -----------|------------------|----------------------|---------------------------
//  cream      | #FAF8F5          | #FFFFFF              | Trắng thuần — nền FB/IG
//  surface    | #F5F1EC          | #F0F2F5              | Xám lạnh nhẹ — Facebook bg
//  blush      | #F0E7DF          | #F7F3F0              | Giữ hơi ấm, sáng hơn nhiều
//  border     | #EDE8E2          | #E4E6EB              | Border xám tinh tế — IG/FB
//  muted      | #9E948A          | #65676B              | Xám trung tính — Facebook UX
//  body       | #4A453F          | #1C1E21              | Gần đen — tương phản rõ hơn
//  ink        | #1C1917          | #050505              | Đen tinh, sharp trên trắng
//  roseLt     | #F5E9E2          | #FDF0EB              | Sáng hơn, hòa nền trắng tốt
//  rose/roseDk| không đổi        | không đổi            | Accent signature giữ nguyên
