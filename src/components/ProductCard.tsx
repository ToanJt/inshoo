"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export type Product = {
  id: number;
  title: string;
  price: string;
  image: string;
  height: string;
  category: string;
  productType: string;
  isBestSeller?: boolean;
  like?: string;
};

type ProductCardProps = {
  product: Product;
  isLiked: boolean;
  onToggleLike: (id: number) => void;
};

export default function ProductCard({
  product,
  isLiked,
  onToggleLike,
}: ProductCardProps) {
  const router = useRouter();
  const lastTapRef = useRef<number>(0);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  const handleClick = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (!isLiked) {
        onToggleLike(product.id);
      }
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    } else {
      setTimeout(() => {
        if (Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY) {
          router.push("/product/" + product.id);
        }
      }, DOUBLE_TAP_DELAY);
    }
    lastTapRef.current = now;
  };

  return (
    <div className="break-inside-avoid mb-2.5">
      {/* Image */}
      <div
        className="relative group cursor-pointer"
        style={{ height: getHeight(product.height) }}
        onClick={handleClick}
      >
        <Image
          src={product.image}
          alt={product.title}
          fill
          sizes="50vw"
          className="object-cover rounded-2xl"
        />

        {/* Bottom gradient for readability */}
        <div
          className="absolute inset-x-0 bottom-0 h-16 rounded-b-2xl pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.08), transparent)",
          }}
        />

        {/* Best seller tag */}
        {product.isBestSeller && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
              style={{
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(8px)",
                color: "#292524",
              }}
            >
              Best Seller
            </span>
          </div>
        )}

        {/* Heart button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike(product.id);
          }}
          className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full transition-all duration-200 active:scale-75"
          style={{
            background: isLiked
              ? "rgba(244,63,94,0.95)"
              : "rgba(255,255,255,0.9)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Heart
            size={14}
            strokeWidth={2.5}
            className={isLiked ? "text-white fill-white" : "text-stone-500"}
          />
        </button>

        {/* Double-tap heart animation */}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart
              size={56}
              className="text-white fill-white heart-pop"
              style={{
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
              }}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-1 pt-2 pb-1">
        <h3 className="text-[13px] font-semibold text-stone-800 leading-tight line-clamp-2">
          {product.title}
        </h3>
        <p className="text-[13px] font-bold mt-1" style={{ color: "#e11d48" }}>
          {product.price}
        </p>
      </div>

      <style jsx global>{`
        @keyframes heartPop {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          30% {
            opacity: 1;
            transform: scale(1.15);
          }
          50% {
            transform: scale(0.95);
          }
          70% {
            transform: scale(1.05);
          }
          100% {
            opacity: 0;
            transform: scale(1);
          }
        }
        .heart-pop {
          animation: heartPop 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

function getHeight(h: string): string {
  const map: Record<string, string> = {
    "h-48": "192px",
    "h-52": "208px",
    "h-56": "224px",
    "h-60": "240px",
    "h-64": "256px",
    "h-72": "288px",
  };
  return map[h] || "224px";
}
