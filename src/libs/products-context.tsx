// libs/products-context.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { fetchProducts } from "@/libs/api";
import type { Product, ProductDetail } from "@/libs/products";

const CACHE_KEY = "inshoo_products_v1";
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

type CacheEntry = { data: Product[]; ts: number };

function readCache(): Product[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) return null; // hết hạn
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache(data: Product[]) {
  try {
    const entry: CacheEntry = { data, ts: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* storage full — bỏ qua */
  }
}

type ProductsState = {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  getDetail: (id: string) => ProductDetail | undefined;
  setDetail: (id: string, detail: ProductDetail) => void;
};

const ProductsContext = createContext<ProductsState | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  // ✅ Khởi tạo từ cache ngay lập tức — không cần chờ fetch
  const [products, setProducts] = useState<Product[]>(() => readCache() ?? []);
  const [loading, setLoading] = useState(() => readCache() === null);
  const [error, setError] = useState<string | null>(null);
  const detailCache = useRef<Map<string, ProductDetail>>(new Map());
  const fetchedRef = useRef(false);

  const load = useCallback(async (force = false) => {
    // ✅ Nếu có cache hợp lệ và không force → bỏ qua fetch
    if (!force) {
      const cached = readCache();
      if (cached) {
        setProducts(cached);
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts();
      setProducts(data);
      writeCache(data); // ✅ Lưu cache sau khi fetch thành công
    } catch {
      setError("Không thể tải sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    load();
  }, [load]);

  const getDetail = useCallback(
    (id: string) => detailCache.current.get(id),
    [],
  );
  const setDetail = useCallback((id: string, detail: ProductDetail) => {
    detailCache.current.set(id, detail);
  }, []);

  // ✅ refetch có force=true để bỏ qua cache khi user bấm "Thử lại"
  return (
    <ProductsContext.Provider
      value={{
        products,
        loading,
        error,
        refetch: () => load(true),
        getDetail,
        setDetail,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used inside ProductsProvider");
  return ctx;
}
