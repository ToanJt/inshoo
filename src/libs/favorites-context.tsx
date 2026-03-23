// libs/favorites-context.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-context";

const LS_GUEST_FAVS = "inshoo_favs_guest";
const LS_USER_FAVS = "inshoo_favs_user";
const META_KEY = "favorite_product_ids";

function readSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

type FavCtx = {
  favorites: Set<string>;
  toggle: (id: string) => void;
  isFavorite: (id: string) => boolean;
  count: number;
  mergeGuestFavoritesAfterRegister: () => Promise<void>;
};

const FavContext = createContext<FavCtx | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { customer, token, authLoading, updateCustomerMeta } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const syncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCustomerId = useRef<string | null>(null);
  const skipNextSync = useRef(false);

  /* ══════════════════════════════════════════
     AUTH STATE CHANGE
  ══════════════════════════════════════════ */
  useEffect(() => {
    if (authLoading) return;

    /* ── Logout ── */
    if (!customer) {
      prevCustomerId.current = null;
      localStorage.removeItem(LS_USER_FAVS);
      setFavorites(readSet(LS_GUEST_FAVS));
      return;
    }

    /* ── Đã login (tránh re-run) ── */
    if (prevCustomerId.current === customer.id) return;
    prevCustomerId.current = customer.id;

    const serverIds =
      (customer.metadata?.[META_KEY] as string[] | undefined) ?? [];
    const serverSet = new Set<string>(serverIds);
    const guestSet = readSet(LS_GUEST_FAVS);

    let finalSet: Set<string>;

    if (serverSet.size === 0 && guestSet.size > 0) {
      // ✅ Account này chưa có favorites trên server
      // → Có thể là tài khoản mới, hoặc register bị lỗi giữa chừng
      // → An toàn để merge guest favorites vào
      finalSet = guestSet;
      skipNextSync.current = false; // cho phép sync lên server
      localStorage.removeItem(LS_GUEST_FAVS);
    } else {
      // ✅ Account đã có favorites trên server
      // → Dùng server data, KHÔNG merge guest (tránh ô nhiễm)
      finalSet = serverSet;
      skipNextSync.current = true; // không cần sync lại lên server
      // Giữ guest favorites nguyên — không xoá, không merge
    }

    setFavorites(finalSet);
    writeSet(LS_USER_FAVS, finalSet);
  }, [customer, authLoading]); // eslint-disable-line

  /* ══════════════════════════════════════════
     SYNC LÊN SERVER (debounce 800ms)
  ══════════════════════════════════════════ */
  useEffect(() => {
    if (!token || !customer || authLoading) return;

    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }

    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(() => {
      writeSet(LS_USER_FAVS, favorites);
      updateCustomerMeta({ [META_KEY]: [...favorites] });
    }, 800);

    return () => {
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
    };
  }, [favorites]); // eslint-disable-line

  /* ══════════════════════════════════════════
     GUEST SYNC
  ══════════════════════════════════════════ */
  useEffect(() => {
    if (!customer && !authLoading) {
      writeSet(LS_GUEST_FAVS, favorites);
    }
  }, [favorites, customer, authLoading]);

  /* ══════════════════════════════════════════
     TOGGLE
  ══════════════════════════════════════════ */
  const toggle = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.has(id),
    [favorites],
  );

  /* ══════════════════════════════════════════
     MERGE THỦ CÔNG — chỉ dùng sau register
     (vẫn giữ để AuthModal gọi được, nhưng
      thực ra useEffect trên đã tự handle rồi)
  ══════════════════════════════════════════ */
  const mergeGuestFavoritesAfterRegister = useCallback(async () => {
    if (!token || !customer) return;
    // useEffect đã merge tự động khi server trống
    // Hàm này chỉ cần đảm bảo sync đã được gọi
    const current = readSet(LS_USER_FAVS);
    if (current.size > 0) {
      await updateCustomerMeta({ [META_KEY]: [...current] });
    }
  }, [token, customer, updateCustomerMeta]);

  return (
    <FavContext.Provider
      value={{
        favorites,
        toggle,
        isFavorite,
        count: favorites.size,
        mergeGuestFavoritesAfterRegister,
      }}
    >
      {children}
    </FavContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavContext);
  if (!ctx) throw new Error("useFavorites must be inside FavoritesProvider");
  return ctx;
}
