import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://169.254.82.84:3000", "http://localhost:3000"],

  images: {
    // ✅ Cache ảnh 30 ngày — xóa hoàn toàn 304 requests
    minimumCacheTTL: 60 * 60 * 24 * 30,

    // ✅ Chỉ generate đúng sizes cần thiết cho mobile app
    deviceSizes: [390, 430, 768],
    imageSizes: [210, 420],

    // ✅ Ưu tiên AVIF (nhỏ hơn WebP ~30%)
    formats: ["image/avif", "image/webp"],

    // ✅ Production trên Netlify: dùng Cloudinary tự optimize
    // Development: Next.js optimize local
    unoptimized: isProd, // ← Netlify không có image server

    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "169.254.82.84",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
    ],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
