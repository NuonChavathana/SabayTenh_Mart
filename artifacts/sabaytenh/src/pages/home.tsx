import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight, Star, ShoppingCart, Heart, Zap, Truck, Shield,
  RotateCcw, Headphones, ChevronLeft, ChevronRight, X, Tag,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { RootLayout } from "@/components/layout/RootLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useListCategories,
  useListFeaturedProducts,
  useListBestSellers,
  useListProducts,
  useAddToCart,
  useAddToWishlist,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// ── Recently Viewed (localStorage) ─────────────────────────────────────────
const RV_KEY = "sabaytenh_rv";
interface RvProduct { id: number; name: string; nameKh: string | null; price: number; image: string | null; discountPercent: number | null; stock: number; }

function getRv(): RvProduct[] {
  try { return JSON.parse(localStorage.getItem(RV_KEY) ?? "[]"); } catch { return []; }
}
function addRv(p: RvProduct) {
  try {
    const list = getRv().filter(x => x.id !== p.id);
    localStorage.setItem(RV_KEY, JSON.stringify([p, ...list].slice(0, 10)));
  } catch {}
}

// ── Countdown hook ──────────────────────────────────────────────────────────
function useMidnightCountdown() {
  const calc = () => {
    const now = new Date();
    const target = new Date(now);
    target.setHours(24, 0, 0, 0);
    return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  };
  const [secs, setSecs] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return {
    h: String(Math.floor(secs / 3600)).padStart(2, "0"),
    m: String(Math.floor((secs % 3600) / 60)).padStart(2, "0"),
    s: String(secs % 60).padStart(2, "0"),
  };
}

// ── AnnouncementBar ─────────────────────────────────────────────────────────
const ANNOUNCEMENTS = [
  { en: "🎉 FREE delivery on orders over $30 — Today Only!", kh: "ការដឹកជញ្ជូនឥតគិតថ្លៃ លើការបញ្ជាលើស $30 — ថ្ងៃនេះប៉ុណ្ណោះ!" },
  { en: "🔥 Flash Sale: Up to 50% OFF — Limited Time!", kh: "បញ្ចុះតម្លៃ 50% — ពេលវេលាមានកំណត់!" },
  { en: "💳 Pay with KHQR or ABA — Instant & Secure", kh: "ទូទាត់ជាមួយ KHQR ឬ ABA — ភ្លាមៗ និងសុវត្ថិភាព" },
  { en: "🌟 New customers: 5% OFF — use code WELCOME5", kh: "អ្នកប្រើថ្មី: បញ្ចុះ 5% — ប្រើកូដ WELCOME5" },
];

function AnnouncementBar({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useLanguage();
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % ANNOUNCEMENTS.length), 4000);
    return () => clearInterval(id);
  }, []);
  const a = ANNOUNCEMENTS[idx];
  return (
    <div className="bg-gray-900 text-white text-center text-xs sm:text-sm py-2 px-8 relative">
      <span className="animate-pulse-text">{t(a.en, a.kh)}</span>
      <button onClick={onDismiss} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Hero Slider ─────────────────────────────────────────────────────────────
const SLIDES = [
  {
    gradient: "from-orange-600 via-primary to-amber-500",
    badge: "🔥 Weekend Mega Sale",
    badgeKh: "🔥 ការបញ្ចុះតម្លៃចុងសប្ដាហ៍",
    title: "Up to 50% OFF",
    titleKh: "បញ្ចុះតម្លៃ 50%",
    sub: "Shop everything at the lowest prices of the year",
    subKh: "ទិញទំនិញគ្រប់យ៉ាងក្នុងតម្លៃទាបបំផុត",
    cta: "Shop Now",
    ctaKh: "ទិញឥឡូវ",
    href: "/products",
    accent: "text-yellow-200",
    img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=700&q=80",
    imgAlt: "Shopping sale",
  },
  {
    gradient: "from-green-700 via-emerald-600 to-teal-500",
    badge: "🌿 Fresh Market",
    badgeKh: "🌿 ផ្សារស្រស់",
    title: "Fresh Groceries Delivered",
    titleKh: "ទំនិញស្រស់ ដឹកដល់ផ្ទះ",
    sub: "Daily essentials & fresh produce — fast delivery across Cambodia",
    subKh: "ទំនិញប្រចាំថ្ងៃ & ស្រស់ — ដឹកជញ្ជូនលឿនទូទាំងកម្ពុជា",
    cta: "Order Now",
    ctaKh: "បញ្ជាឥឡូវ",
    href: "/category/groceries",
    accent: "text-lime-200",
    img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&q=80",
    imgAlt: "Fresh groceries market",
  },
  {
    gradient: "from-indigo-800 via-blue-700 to-blue-600",
    badge: "📱 Tech Fest 2026",
    badgeKh: "📱 បុណ្យបច្ចេកវិទ្យា 2026",
    title: "Latest Electronics",
    titleKh: "គ្រឿងអេឡិចត្រូនិចថ្មីបំផុត",
    sub: "Smartphones, laptops, gadgets — all the latest arrivals",
    subKh: "ស្មាតហ្វូន ល្ហ្roprop ឧបករណ៍ — ទំនិញចុងក្រោយបំផុត",
    cta: "Explore",
    ctaKh: "រុករក",
    href: "/category/electronics",
    accent: "text-sky-200",
    img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=700&q=80",
    imgAlt: "Electronics tech",
  },
];

function HeroSlider() {
  const { t } = useLanguage();
  const [idx, setIdx] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const go = useCallback((next: number) => {
    setTransitioning(true);
    setTimeout(() => {
      setIdx((next + SLIDES.length) % SLIDES.length);
      setTransitioning(false);
    }, 200);
  }, []);

  useEffect(() => {
    const id = setInterval(() => go(idx + 1), 5000);
    return () => clearInterval(id);
  }, [idx, go]);

  const slide = SLIDES[idx];

  return (
    <section className={`relative bg-gradient-to-r ${slide.gradient} overflow-hidden`}>
      <div
        className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay"
        style={{ backgroundImage: `url(${slide.img})` }}
      />
      <div
        className={`relative container mx-auto px-4 py-12 md:py-16 flex flex-col md:flex-row items-center gap-8 transition-opacity duration-200 ${transitioning ? "opacity-0" : "opacity-100"}`}
      >
        {/* Text */}
        <div className="flex-1 text-center md:text-left text-white">
          <Badge className="bg-white/25 text-white border-white/30 mb-3 text-xs font-semibold">
            {t(slide.badge, slide.badgeKh)}
          </Badge>
          <h1 className={`text-4xl md:text-6xl font-black leading-tight mb-3 ${slide.accent}`}>
            {t(slide.title, slide.titleKh)}
          </h1>
          <p className="text-white/85 text-base md:text-lg mb-6 max-w-lg">
            {t(slide.sub, slide.subKh)}
          </p>
          <Link href={slide.href}>
            <Button size="lg" className="bg-white text-gray-900 hover:bg-white/90 font-bold shadow-lg">
              {t(slide.cta, slide.ctaKh)} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Image */}
        <div className="flex-shrink-0 hidden md:block">
          <img
            src={slide.img}
            alt={slide.imgAlt}
            className="w-72 h-52 object-cover rounded-2xl shadow-2xl opacity-90"
          />
        </div>
      </div>

      {/* Prev / Next */}
      <button
        onClick={() => go(idx - 1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-1.5 transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => go(idx + 1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-1.5 transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`rounded-full transition-all ${i === idx ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40"}`}
          />
        ))}
      </div>
    </section>
  );
}

// ── Category Grid (Mega Menu) ───────────────────────────────────────────────
const CAT_COLORS: Record<string, { bg: string; icon: string; text: string }> = {
  groceries:    { bg: "bg-amber-50 dark:bg-amber-900/20",   icon: "🛒", text: "text-amber-700 dark:text-amber-300" },
  drinks:       { bg: "bg-sky-50 dark:bg-sky-900/20",       icon: "🥤", text: "text-sky-700 dark:text-sky-300" },
  electronics:  { bg: "bg-indigo-50 dark:bg-indigo-900/20", icon: "📱", text: "text-indigo-700 dark:text-indigo-300" },
  clothing:     { bg: "bg-pink-50 dark:bg-pink-900/20",     icon: "👗", text: "text-pink-700 dark:text-pink-300" },
  beauty:       { bg: "bg-rose-50 dark:bg-rose-900/20",     icon: "💄", text: "text-rose-700 dark:text-rose-300" },
  home:         { bg: "bg-orange-50 dark:bg-orange-900/20", icon: "🏠", text: "text-orange-700 dark:text-orange-300" },
  school:       { bg: "bg-purple-50 dark:bg-purple-900/20", icon: "📚", text: "text-purple-700 dark:text-purple-300" },
  "fresh-food": { bg: "bg-green-50 dark:bg-green-900/20",   icon: "🥦", text: "text-green-700 dark:text-green-300" },
  "baby-kids":  { bg: "bg-yellow-50 dark:bg-yellow-900/20", icon: "🍼", text: "text-yellow-700 dark:text-yellow-300" },
  sports:       { bg: "bg-teal-50 dark:bg-teal-900/20",     icon: "⚽", text: "text-teal-700 dark:text-teal-300" },
  health:       { bg: "bg-emerald-50 dark:bg-emerald-900/20",icon: "💊",text: "text-emerald-700 dark:text-emerald-300"},
  essentials:   { bg: "bg-gray-100 dark:bg-gray-800",       icon: "📦", text: "text-gray-700 dark:text-gray-300" },
};

function CategoryGrid() {
  const { t } = useLanguage();
  const { data: categories, isLoading } = useListCategories();

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-8">
        <Skeleton className="h-7 w-48 mb-4" />
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
          {Array(12).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold">{t("Shop by Category", "ទិញតាមប្រភេទ")}</h2>
          <p className="text-xs text-muted-foreground">{t("Browse our 12 departments", "រុករក 12 ផ្នែក")}</p>
        </div>
        <Link href="/products">
          <Button variant="ghost" size="sm" className="text-primary gap-1 text-xs">
            {t("All Products", "ទំនិញទាំងអស់")} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
        {(categories ?? []).map((cat: any) => {
          const style = CAT_COLORS[cat.slug] ?? { bg: "bg-muted", icon: "🛍️", text: "text-foreground" };
          return (
            <Link key={cat.id} href={`/category/${cat.slug}`}>
              <div className={`${style.bg} rounded-2xl p-2.5 flex flex-col items-center gap-1.5 hover:shadow-md hover:scale-105 transition-all cursor-pointer text-center group aspect-square justify-center`}>
                <span className="text-3xl leading-none">{style.icon}</span>
                <span className={`text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 ${style.text}`}>
                  {t(cat.name, cat.nameKh ?? cat.name)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ── Flash Deals Section ─────────────────────────────────────────────────────
function FlashDealsSection() {
  const { t } = useLanguage();
  const { h, m, s } = useMidnightCountdown();
  const { data: featured } = useListFeaturedProducts();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "l" | "r") => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir === "l" ? -280 : 280, behavior: "smooth" });
  };

  const flashProducts = (featured ?? []).filter((p: any) => p.discountPercent && Number(p.discountPercent) > 0);

  if (!flashProducts.length) return null;

  return (
    <section className="bg-gradient-to-r from-red-600 to-orange-500 py-1">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1.5">
              <Zap className="h-4 w-4 text-yellow-200 fill-yellow-200" />
              <span className="font-black text-white text-sm uppercase tracking-wide">{t("Flash Deals", "ការផ្ដល់ជូនរហ័ស")}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-white/80 text-xs">
              <span>{t("Ends in:", "ត្រូវបញ្ចប់ក្នុង:")}</span>
              {[h, m, s].map((v, i) => (
                <span key={i} className="flex items-center gap-0.5">
                  <span className="bg-gray-900 text-white font-mono font-bold text-sm px-1.5 py-0.5 rounded">{v}</span>
                  {i < 2 && <span className="font-bold">:</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/products?featured=true">
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 text-xs gap-1">
                {t("See All", "មើលទាំងអស់")} <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
            <button onClick={() => scroll("l")} className="bg-white/20 hover:bg-white/40 text-white rounded-full p-1 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => scroll("r")} className="bg-white/20 hover:bg-white/40 text-white rounded-full p-1 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scroll row */}
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-4">
          {flashProducts.map((p: any) => (
            <Link key={p.id} href={`/products/${p.id}`} className="flex-shrink-0 w-36 sm:w-44">
              <div className="bg-white dark:bg-card rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={p.image || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200"}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] font-bold border-0">
                    -{p.discountPercent}%
                  </Badge>
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium line-clamp-2 leading-tight mb-1">{p.name}</p>
                  <p className="text-sm font-bold text-primary">${Number(p.price).toFixed(2)}</p>
                  {p.originalPrice && (
                    <p className="text-[10px] text-muted-foreground line-through">${Number(p.originalPrice).toFixed(2)}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Trust Badges ────────────────────────────────────────────────────────────
function TrustBadges() {
  const { t } = useLanguage();
  const badges = [
    { icon: <Truck className="h-6 w-6" />, label: t("Free Delivery", "ដឹកឥតគិតថ្លៃ"), sub: t("Orders over $30", "លើការបញ្ជា $30+"), color: "text-primary" },
    { icon: <Shield className="h-6 w-6" />, label: t("Secure Payment", "ទូទាត់សុវត្ថិភាព"), sub: t("100% protected", "ការពារ 100%"), color: "text-blue-500" },
    { icon: <RotateCcw className="h-6 w-6" />, label: t("Easy Returns", "ត្រឡប់ងាយ"), sub: t("30-day policy", "គោលការណ៍ 30 ថ្ងៃ"), color: "text-green-500" },
    { icon: <Headphones className="h-6 w-6" />, label: t("24/7 Support", "ជំនួយ 24/7"), sub: t("Always here for you", "ត្រៀមជួយជានិច្ច"), color: "text-purple-500" },
  ];
  return (
    <section className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {badges.map((b, i) => (
          <div key={i} className="bg-white dark:bg-card border rounded-2xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className={`${b.color} flex-shrink-0`}>{b.icon}</div>
            <div>
              <p className="text-sm font-semibold">{b.label}</p>
              <p className="text-xs text-muted-foreground">{b.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Product Card ────────────────────────────────────────────────────────────
function ProductCard({ product, onView, compact = false }: { product: any; onView?: (p: any) => void; compact?: boolean }) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
        toast({ title: t("Added to cart!", "បានបន្ថែមទៅរទ្ធ!") });
      },
    },
  });
  const addToWishlist = useAddToWishlist({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/wishlist"] });
        toast({ title: t("Saved to wishlist!", "បានរក្សាទុក!") });
      },
    },
  });

  return (
    <div className="bg-white dark:bg-card border rounded-xl overflow-hidden hover:shadow-md transition-all group flex flex-col">
      <Link
        href={`/products/${product.id}`}
        className="relative block overflow-hidden bg-muted"
        style={{ aspectRatio: "1" }}
        onClick={() => onView?.(product)}
      >
        <img
          src={product.image || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.discountPercent && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold border-0">
            -{product.discountPercent}%
          </Badge>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <Badge className="absolute bottom-2 left-2 bg-yellow-500 text-white text-[10px] border-0">
            {t(`Only ${product.stock} left!`, `មានតែ ${product.stock}!`)}
          </Badge>
        )}
        {isAuthenticated && (
          <button
            onClick={e => { e.preventDefault(); addToWishlist.mutate({ productId: product.id }); }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-muted-foreground hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 shadow"
          >
            <Heart className="h-3.5 w-3.5" />
          </button>
        )}
      </Link>
      <div className={`flex flex-col flex-1 ${compact ? "p-2" : "p-3"}`}>
        <Link href={`/products/${product.id}`} onClick={() => onView?.(product)}>
          <h3 className={`font-medium line-clamp-2 hover:text-primary transition-colors mb-1 ${compact ? "text-xs" : "text-sm"}`}>
            {t(product.name, product.nameKh ?? product.name)}
          </h3>
        </Link>
        {!compact && (
          <div className="flex items-center gap-1 mb-2">
            {product.rating && (
              <>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground">{Number(product.rating).toFixed(1)}</span>
              </>
            )}
            {product.soldCount > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">{product.soldCount} {t("sold", "")}</span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-1 mt-auto">
          <div>
            <span className={`font-bold text-primary ${compact ? "text-sm" : "text-base"}`}>${Number(product.price).toFixed(2)}</span>
            {product.originalPrice && !compact && (
              <span className="text-xs text-muted-foreground line-through ml-1">${Number(product.originalPrice).toFixed(2)}</span>
            )}
          </div>
          {!compact && (
            <Button
              size="sm"
              className="h-7 text-xs px-2 gap-1 flex-shrink-0"
              onClick={() => {
                if (!isAuthenticated) { toast({ title: t("Please login first", "សូមចូលជាមុន"), variant: "destructive" }); return; }
                addToCart.mutate({ data: { productId: product.id, quantity: 1 } });
              }}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="h-3 w-3" />
              {product.stock === 0 ? t("Out", "អស់") : t("Add", "បន្ថែម")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="bg-white dark:bg-card border rounded-xl overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className={`${compact ? "p-2" : "p-3"} space-y-2`}>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    </div>
  );
}

// ── Category Product Section ────────────────────────────────────────────────
interface SectionProps {
  titleEn: string;
  titleKh: string;
  subtitleEn?: string;
  subtitleKh?: string;
  categoryId?: number;
  products?: any[];
  isLoading?: boolean;
  href?: string;
  sideBanner?: React.ReactNode;
  onView?: (p: any) => void;
  cols?: number;
  limit?: number;
}

function CategorySection({ titleEn, titleKh, subtitleEn, subtitleKh, categoryId, products: externalProducts, isLoading: externalLoading, href = "/products", sideBanner, onView, cols = 5, limit = 10 }: SectionProps) {
  const { t } = useLanguage();
  const { data, isLoading: fetchLoading } = useListProducts(
    { categoryId: categoryId ?? undefined, limit: categoryId ? limit : 1 }
  );
  const products = externalProducts ?? data?.products ?? [];
  const loading = externalLoading ?? (!!categoryId && fetchLoading);

  const gridCols = cols === 3 ? "grid-cols-2 sm:grid-cols-3" : cols === 4 ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

  return (
    <section className="container mx-auto px-4 py-4">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">{t(titleEn, titleKh)}</h2>
          {(subtitleEn || subtitleKh) && (
            <p className="text-sm text-muted-foreground">{t(subtitleEn ?? "", subtitleKh ?? "")}</p>
          )}
        </div>
        <Link href={href}>
          <Button variant="ghost" size="sm" className="text-primary gap-1 text-xs">
            {t("See All", "មើលទាំងអស់")} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {sideBanner ? (
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-44 hidden md:block">{sideBanner}</div>
          <div className={`flex-1 grid gap-3 ${gridCols}`}>
            {loading ? Array(cols).fill(0).map((_, i) => <ProductSkeleton key={i} />) : products.slice(0, cols).map((p: any) => <ProductCard key={p.id} product={p} onView={onView} />)}
          </div>
        </div>
      ) : (
        <div className={`grid gap-4 ${gridCols}`}>
          {loading ? Array(cols).fill(0).map((_, i) => <ProductSkeleton key={i} />) : products.slice(0, cols).map((p: any) => <ProductCard key={p.id} product={p} onView={onView} />)}
        </div>
      )}
    </section>
  );
}

// ── Promo Banner ────────────────────────────────────────────────────────────
function PromoBanner() {
  const { t } = useLanguage();
  return (
    <section className="container mx-auto px-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/category/fresh-food">
          <div className="relative rounded-2xl overflow-hidden h-36 bg-gradient-to-r from-green-600 to-emerald-500 flex items-center px-6 cursor-pointer hover:opacity-95 transition-opacity">
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30 bg-cover bg-center"
              style={{ backgroundImage: "url(https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400)" }} />
            <div className="relative text-white">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80 mb-0.5">{t("Fresh Daily", "ស្រស់ប្រចាំថ្ងៃ")}</p>
              <p className="text-xl font-black">{t("Fresh Food Deals", "ទំនិញស្រស់")}</p>
              <p className="text-sm text-white/85 mt-0.5">{t("Up to 30% OFF", "បញ្ចុះដល់ 30%")}</p>
            </div>
          </div>
        </Link>
        <Link href="/category/electronics">
          <div className="relative rounded-2xl overflow-hidden h-36 bg-gradient-to-r from-indigo-700 to-blue-600 flex items-center px-6 cursor-pointer hover:opacity-95 transition-opacity">
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30 bg-cover bg-center"
              style={{ backgroundImage: "url(https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400)" }} />
            <div className="relative text-white">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80 mb-0.5">{t("Tech Sale", "បញ្ចុះតម្លៃបច្ចេកវិទ្យា")}</p>
              <p className="text-xl font-black">{t("New Electronics", "អេឡិចត្រូនិចថ្មី")}</p>
              <p className="text-sm text-white/85 mt-0.5">{t("Latest arrivals", "ទំនិញចុងក្រោយ")}</p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

// ── KHQR Banner ─────────────────────────────────────────────────────────────
function KhqrBanner() {
  const { t } = useLanguage();
  return (
    <section className="container mx-auto px-4 py-4">
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="text-white text-center sm:text-left">
          <p className="text-xs uppercase tracking-wider text-white/70 mb-0.5">{t("Cambodia's Favourite", "ការចូលចិត្តរបស់កម្ពុជា")}</p>
          <h3 className="text-xl font-black">{t("Pay with KHQR", "ទូទាត់ជាមួយ KHQR 🇰🇭")}</h3>
          <p className="text-white/80 text-sm mt-0.5">
            {t("Scan & pay instantly — ABA, Wing, ACLEDA, Canadia", "ស្កែន​ ដើម្បីទូទាត់ភ្លាមៗ — ABA, Wing, ACLEDA, Canadia")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          {["🇰🇭 KHQR", "ABA", "WING", "ACLEDA", "Canadia"].map(m => (
            <div key={m} className="bg-white/15 border border-white/25 rounded-xl px-3 py-2 text-white text-sm font-bold">{m}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Recently Viewed Section ─────────────────────────────────────────────────
function RecentlyViewedSection() {
  const { t } = useLanguage();
  const [rv] = useState<RvProduct[]>(() => getRv());

  if (rv.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t("Recently Viewed", "បានមើលថ្មីៗ")}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {rv.map(p => (
          <Link key={p.id} href={`/products/${p.id}`} className="block">
            <div className="bg-white dark:bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={p.image || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200"}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-2">
                <p className="text-[11px] font-medium line-clamp-2 leading-tight">{p.name}</p>
                <p className="text-xs font-bold text-primary mt-0.5">${Number(p.price).toFixed(2)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Side Banner slot ────────────────────────────────────────────────────────
function GrocerySideBanner() {
  const { t } = useLanguage();
  return (
    <Link href="/category/fresh-food">
      <div className="h-full min-h-48 bg-gradient-to-b from-green-500 to-emerald-600 rounded-2xl flex flex-col items-center justify-center text-white text-center p-4 gap-2 hover:opacity-95 transition-opacity">
        <span className="text-4xl">🥦</span>
        <p className="font-bold text-sm">{t("Fresh Food", "អាហារស្រស់")}</p>
        <Badge className="bg-white/25 text-white border-0 text-[10px]">{t("Up to 30% OFF", "ដល់ 30%")}</Badge>
      </div>
    </Link>
  );
}

function ElectronicsSideBanner() {
  const { t } = useLanguage();
  return (
    <Link href="/category/electronics">
      <div className="h-full min-h-48 bg-gradient-to-b from-indigo-700 to-blue-600 rounded-2xl flex flex-col items-center justify-center text-white text-center p-4 gap-2 hover:opacity-95 transition-opacity">
        <span className="text-4xl">📱</span>
        <p className="font-bold text-sm">{t("Tech Sale", "បញ្ចុះតម្លៃ")}</p>
        <Badge className="bg-white/25 text-white border-0 text-[10px]">{t("New Arrivals", "ទំនិញថ្មី")}</Badge>
      </div>
    </Link>
  );
}

// ── Main Home Page ──────────────────────────────────────────────────────────
export default function Home() {
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState<RvProduct[]>([]);

  const { data: featured, isLoading: featLoading } = useListFeaturedProducts();
  const { data: bestSellers, isLoading: bsLoading } = useListBestSellers();

  const trackView = useCallback((product: any) => {
    const p: RvProduct = { id: product.id, name: product.name, nameKh: product.nameKh, price: Number(product.price), image: product.image, discountPercent: product.discountPercent, stock: product.stock };
    addRv(p);
    setRecentlyViewed(prev => [p, ...prev.filter(x => x.id !== p.id)].slice(0, 10));
  }, []);

  return (
    <RootLayout>
      {showAnnouncement && <AnnouncementBar onDismiss={() => setShowAnnouncement(false)} />}

      <HeroSlider />
      <CategoryGrid />
      <FlashDealsSection />
      <TrustBadges />

      {/* Grocery Deals */}
      <CategorySection
        titleEn="Grocery Deals"
        titleKh="ការផ្ដល់ជូនគ្រឿងទំនិញ"
        subtitleEn="Fresh picks at best prices"
        subtitleKh="ការដកស្រង់ស្រស់ក្នុងតម្លៃល្អ"
        categoryId={1}
        href="/category/groceries"
        sideBanner={<GrocerySideBanner />}
        onView={trackView}
        cols={4}
        limit={4}
      />

      <PromoBanner />

      {/* Electronics */}
      <CategorySection
        titleEn="Electronics & Tech"
        titleKh="អេឡិចត្រូនិច & បច្ចេកវិទ្យា"
        subtitleEn="Smartphones, gadgets & accessories"
        subtitleKh="ស្មាតហ្វូន ឧបករណ៍ & គ្រឿងបន្លាស់"
        categoryId={3}
        href="/category/electronics"
        sideBanner={<ElectronicsSideBanner />}
        onView={trackView}
        cols={4}
        limit={4}
      />

      {/* Home Essentials */}
      <CategorySection
        titleEn="Home Essentials"
        titleKh="ទំនិញចាំបាច់ក្នុងផ្ទះ"
        subtitleEn="Everything your home needs"
        subtitleKh="អ្វីៗដែលផ្ទះអ្នកត្រូវការ"
        categoryId={6}
        href="/category/home"
        onView={trackView}
        cols={5}
        limit={5}
      />

      <KhqrBanner />

      {/* Beauty & Personal Care */}
      <CategorySection
        titleEn="Beauty & Personal Care"
        titleKh="ផលិតផលសម្រស់ & ថែរក្សាខ្លួន"
        subtitleEn="Look and feel your best"
        subtitleKh="រូបរាងល្អ ហើយអារម្មណ៍ល្អ"
        categoryId={5}
        href="/category/beauty"
        onView={trackView}
        cols={5}
        limit={5}
      />

      {/* Featured / Recommended */}
      <CategorySection
        titleEn="Recommended For You"
        titleKh="ណែនាំសម្រាប់អ្នក"
        subtitleEn="Hand-picked deals just for you"
        subtitleKh="ការចាប់ព្រួញពិសេសសម្រាប់អ្នក"
        products={featured ?? []}
        isLoading={featLoading}
        href="/products?featured=true"
        onView={trackView}
        cols={5}
        limit={10}
      />

      {/* Best Sellers */}
      <section className="bg-gradient-to-b from-orange-50 to-white dark:from-orange-950/20 dark:to-background py-1">
        <CategorySection
          titleEn="Best Sellers"
          titleKh="លក់ដាច់បំផុត"
          subtitleEn="Most popular products this week"
          subtitleKh="ផលិតផលពេញនិយមបំផុតសប្ដាហ៍នេះ"
          products={bestSellers ?? []}
          isLoading={bsLoading}
          href="/products"
          onView={trackView}
          cols={5}
          limit={10}
        />
      </section>

      <RecentlyViewedSection />

      {/* Bottom spacing */}
      <div className="h-8" />
    </RootLayout>
  );
}
