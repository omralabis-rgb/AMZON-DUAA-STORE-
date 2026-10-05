import Link from "next/link";
import { CubeFace } from "@/components/cube-face";
import { فيسبوك, إنستغرام, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border/60 bg-muted/30">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-5">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand + Newsletter */}
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <CubeFace size="sm" />
              <span className="font-display text-sm font-semibold tracking-tight">
                Amazon Duaa
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-muted-foreground">
              متجر إلكتروني عربي مع إدارة ذكية للمنتجات والطلبات وخدمة عبر واتساب.
            </p>
          </div>

          {/* المتجر */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              المتجر
            </h3>
            <nav className="flex flex-col gap-1.5" aria-label="Footer shop links">
              <Link
                href="/products"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                كل المنتجات
              </Link>
              <Link
                href="/products?category=speed-cubes"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                منتجات مميزة
              </Link>
              <Link
                href="/products?category=puzzles"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                اختيارات ذكية
              </Link>
              <Link
                href="/products?category=collectibles"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                منتجات متنوعة
              </Link>
              <Link
                href="/cart"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                السلة
              </Link>
            </nav>
          </div>

          {/* تواصل معنا */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              تواصل معنا
            </h3>
            <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              <a
                href="https://wa.me/967777627595"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-foreground"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" />
                +967 777 627 595
              </a>
              <span className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                اليمن — خدمة العملاء عبر واتساب
              </span>
            </div>
          </div>

          {/* Follow */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              تابعنا
            </h3>
            <div className="flex flex-col gap-1.5">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <فيسبوك className="h-3.5 w-3.5 shrink-0" />
                فيسبوك
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <إنستغرام className="h-3.5 w-3.5 shrink-0" />
                إنستغرام
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>&copy; 2026 Amazon Duaa. All rights reserved.</p>
          <p className="font-display text-[11px] tracking-wide">
            Amazon Duaa — تسوق بذكاء.
          </p>
        </div>
      </div>
    </footer>
  );
}
