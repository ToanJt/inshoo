// libs/shimmer.ts
// Dùng chung cho tất cả trang

export const SHIMMER_KEYFRAME = `
  @keyframes shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(250%); }
  }
`;

export function shimmerClass(delay = "0s") {
  return {
    position: "absolute" as const,
    inset: 0,
    background:
      "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--cream) 55%, transparent) 50%, transparent 100%)",
    animation: `shimmer 1.5s ${delay} infinite`,
    transform: "translateX(-100%)",
  };
}
