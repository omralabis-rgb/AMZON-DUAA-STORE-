"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CubeFace } from "@/components/cube-face";

export function StorefrontNav() {
  const pathname = usePathname();
  const isالرئيسية = pathname === "/";
  const isالمنتجات = pathname.startsWith("/products");
  const isTrack = pathname === "/track";

  return (
    <>
      <Link
        href="/"
        className={`flex shrink-0 items-center gap-2 transition-opacity ${isالرئيسية ? "text-foreground" : "text-foreground/80 hover:opacity-80"}`}
      >
        <CubeFace size="sm" />
        <span className="font-display text-sm font-semibold tracking-tight">
          Amazon Duaa
        </span>
      </Link>

      <nav className="hidden items-center gap-6 md:flex" aria-label="المتجر">
        <Link
          href="/"
          className={`relative text-sm font-medium transition-colors ${isالرئيسية ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
        >
          الرئيسية
        </Link>
        <Link
          href="/products"
          className={`relative text-sm font-medium transition-colors ${isالمنتجات ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
        >
          المنتجات
        </Link>
        <Link
          href="/track"
          className={`relative text-sm font-medium transition-colors ${isTrack ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
        >
          تتبع الطلب
        </Link>
      </nav>
    </>
  );
}
