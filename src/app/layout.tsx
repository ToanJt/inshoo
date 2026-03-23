import type { Metadata } from "next";
import type { ReactNode } from "react";
import { INSHOO_VARS, INSHOO_BASE_CSS } from "@/tokens";
import { AuthProvider } from "@/libs/auth-context";
import { FavoritesProvider } from "@/libs/favorites-context";
import { ProductsProvider } from "@/libs/products-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inshoo",
  description: "Shop thời trang phong cách",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `:root{${INSHOO_VARS}}` }} />
        <style dangerouslySetInnerHTML={{ __html: INSHOO_BASE_CSS }} />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <FavoritesProvider>
            <ProductsProvider>{children}</ProductsProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
