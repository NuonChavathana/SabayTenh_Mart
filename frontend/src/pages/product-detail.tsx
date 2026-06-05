import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { getDiscountPercent } from "@/lib/discount";
import {
  ShoppingCart, Heart, Star, Package, Truck, Shield,
  Plus, Minus, Check, RefreshCcw, HeadphonesIcon,
  ChevronRight, Share2, Zap, MapPin, RotateCcw, Clock,
  ZoomIn,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { RootLayout } from "@/components/layout/RootLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetProduct,
  useListProducts,
  useAddToCart,
  useAddToWishlist,
  useRemoveFromWishlist,
  useGetWishlist,
  useCreateReview,
  type ProductDetail,
  type Review,
} from "@workspace/api-client-react";

type RecentlyViewedProduct = {
  id: number;
  name: string;
  nameKh: string | null;
  price: number;
  image: string | null;
  discountPercent: number | null;
  stock: number;
};

type ProductDetailView = ProductDetail & { soldCount?: number };
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { getProductImageUrl } from "@/lib/images";

// ── Recently Viewed (shared with home.tsx) ──────────────────────────────────
const RV_KEY = "sabaytenh_rv";
function addRv(p: RecentlyViewedProduct) {
  try {
    const existing = JSON.parse(localStorage.getItem(RV_KEY) ?? "[]") as RecentlyViewedProduct[];
    const filtered = existing.filter((x) => x.id !== p.id);
    localStorage.setItem(RV_KEY, JSON.stringify([p, ...filtered].slice(0, 10)));
  } catch {}
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function StarRow({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`${cls} ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : s - 0.5 <= rating ? "fill-yellow-200 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
        />
      ))}
    </div>
  );
}

function RatingBreakdown({ reviews }: { reviews: Review[] }) {
  const { t } = useLanguage();
  const counts = [5, 4, 3, 2, 1].map(r => ({
    r,
    count: reviews.filter(rv => rv.rating === r).length,
  }));
  const max = Math.max(...counts.map(c => c.count), 1);

  return (
    <div className="space-y-1.5">
      {counts.map(({ r, count }) => (
        <div key={r} className="flex items-center gap-2 text-sm">
          <span className="w-3 text-right text-muted-foreground">{r}</span>
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="w-5 text-muted-foreground text-xs">{count}</span>
        </div>
      ))}
    </div>
  );
}

// ── Image Gallery ────────────────────────────────────────────────────────────
function ImageGallery({ images, productName }: { images: string[]; productName: string }) {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div
        ref={imgRef}
        className={`relative aspect-square rounded-2xl overflow-hidden bg-muted border border-border/50 ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        onMouseMove={handleMouseMove}
        onClick={() => setZoomed(z => !z)}
      >
        <img
          src={images[selected]}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-100"
          style={zoomed ? {
            transform: "scale(2.2)",
            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
          } : undefined}
        />
        {!zoomed && (
          <div className="absolute top-3 right-3 bg-black/40 text-white rounded-lg p-1.5 opacity-60">
            <ZoomIn className="h-3.5 w-3.5" />
          </div>
        )}
        {/* Prev/Next on mobile */}
        {images.length > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); setSelected(i => (i - 1 + images.length) % images.length); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-card/80 rounded-full p-1 md:hidden shadow"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); setSelected(i => (i + 1) % images.length); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-card/80 rounded-full p-1 md:hidden shadow"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === selected ? "border-primary shadow-md shadow-primary/20" : "border-transparent hover:border-muted-foreground/30"}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 md:hidden">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`rounded-full transition-all ${i === selected ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-muted-foreground/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Delivery Info ────────────────────────────────────────────────────────────
function DeliveryInfo({ price }: { price: number }) {
  const { t } = useLanguage();
  const freeShipping = price >= 30;
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  const latestDate = new Date();
  latestDate.setDate(latestDate.getDate() + 5);
  const fmtOpts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Delivery & Returns", "ការដឹក & ការត្រឡប់")}</p>
      </div>
      <div className="divide-y">
        {/* Delivery */}
        <div className="flex items-start gap-3 px-4 py-3">
          <Truck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {t("Standard Delivery", "ការដឹកជញ្ជូនស្តង់ដារ")}
              </p>
              <span className={`text-xs font-semibold ${freeShipping ? "text-green-600" : "text-primary"}`}>
                {freeShipping ? t("FREE", "ឥតគិតថ្លៃ") : "$3.00"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Estimated", "ប្រហាក់ប្រហែល")} {deliveryDate.toLocaleDateString("en", fmtOpts)} – {latestDate.toLocaleDateString("en", fmtOpts)}
            </p>
            {!freeShipping && (
              <p className="text-xs text-green-600 mt-0.5">
                {t(`Add $${(30 - price).toFixed(2)} more for free delivery`, `បន្ថែម $${(30 - price).toFixed(2)} ទៀតដើម្បីទទួលការដឹកជញ្ជូនឥតគិតថ្លៃ`)}
              </p>
            )}
          </div>
        </div>
        {/* Express */}
        <div className="flex items-start gap-3 px-4 py-3">
          <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">{t("Express Delivery", "ការដឹកជញ្ជូនរហ័ស")}</p>
            <p className="text-xs text-muted-foreground">{t("1–2 business days (+$5)", "1–2 ថ្ងៃការងារ (+$5)")}</p>
          </div>
        </div>
        {/* Pickup */}
        <div className="flex items-start gap-3 px-4 py-3">
          <MapPin className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">{t("Store Pickup", "ទទួលនៅហាង")}</p>
            <p className="text-xs text-muted-foreground">{t("Phnom Penh — Ready in 2 hours", "ភ្នំពេញ — រៀបចំក្នុង 2 ម៉ោង")}</p>
          </div>
        </div>
        {/* Returns */}
        <div className="flex items-start gap-3 px-4 py-3">
          <RotateCcw className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">{t("30-Day Returns", "ការត្រឡប់ 30 ថ្ងៃ")}</p>
            <p className="text-xs text-muted-foreground">{t("Original packaging required", "ត្រូវការការវេចខ្ចប់ដើម")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Specifications ────────────────────────────────────────────────────────────
function SpecsTable({ product }: { product: ProductDetailView }) {
  const { t } = useLanguage();

  const rows: { label: string; labelKh: string; value: string }[] = [
    { label: "SKU", labelKh: "លេខបញ្ជា", value: `#ST-${String(product.id).padStart(4, "0")}` },
    product.brandName && { label: "Brand", labelKh: "ម៉ាក", value: product.brandName },
    product.categoryName && { label: "Category", labelKh: "ប្រភេទ", value: product.categoryName },
    { label: "Stock", labelKh: "ស្តុក", value: product.stock > 0 ? `${product.stock} ${t("units available", "ចំណែក")}` : t("Out of stock", "អស់ស្តុក") },
    product.rating && { label: "Average Rating", labelKh: "ការវាយតម្លៃមធ្យម", value: `${Number(product.rating).toFixed(1)} / 5.0 (${product.reviewCount ?? 0} ${t("reviews", "ការវាយតម្លៃ")})` },
    product.isFeatured && { label: "Featured", labelKh: "ទំនិញពិសេស", value: t("Yes — Editor's Pick", "បាទ — ជម្រើសសម្រាប់") },
    { label: "Availability", labelKh: "ការលក់", value: t("In Store & Online", "នៅហាង & អនឡាញ") },
    { label: "Seller", labelKh: "អ្នកលក់", value: "SabayTenh Official" },
    { label: "Warranty", labelKh: "ការធានា", value: t("Standard 12-month warranty", "ការធានា 12 ខែ") },
    { label: "Country of Origin", labelKh: "ប្រទេសផលិត", value: t("Cambodia / Imported", "កម្ពុជា / នាំចូល") },
    product.tags && { label: "Tags / Features", labelKh: "លក្ខណៈ", value: product.tags },
  ].filter(Boolean) as { label: string; labelKh: string; value: string }[];

  return (
    <div className="border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? "bg-muted/30" : ""}>
              <td className="px-4 py-2.5 font-medium text-muted-foreground w-2/5">
                {t(row.label, row.labelKh)}
              </td>
              <td className="px-4 py-2.5">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Related Products ──────────────────────────────────────────────────────────
function RelatedProducts({ categoryId, currentId }: { categoryId: number; currentId: number }) {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const { data } = useListProducts({ categoryId, limit: 7 });
  const related = (data?.products ?? []).filter(p => p.id !== currentId).slice(0, 6);

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
        toast({ title: t("Added to cart!", "បានបន្ថែមទៅកន្រ្តក!") });
      },
    },
  });

  if (related.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t("Related Products", "ផលិតផលដែលពាក់ព័ន្ធ")}</h2>
        <Link href={`/products?categoryId=${categoryId}`}>
          <Button variant="ghost" size="sm" className="text-primary gap-1 text-xs">
            {t("See All", "មើលទាំងអស់")} <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {related.map(p => (
          <div key={p.id} className="bg-white dark:bg-card border rounded-xl overflow-hidden hover:shadow-md transition-all group">
            <Link href={`/products/${p.id}`} className="block relative aspect-square overflow-hidden bg-muted">
              <img
                src={getProductImageUrl(p.image)}
                alt={p.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {getDiscountPercent(p.price, p.originalPrice) && (
                <Badge className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] border-0">
                  -{getDiscountPercent(p.price, p.originalPrice)}%
                </Badge>
              )}
            </Link>
            <div className="p-2.5">
              <Link href={`/products/${p.id}`}>
                <p className="text-xs font-medium line-clamp-2 hover:text-primary transition-colors mb-1.5 leading-tight">{p.name}</p>
              </Link>
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-bold text-primary">${Number(p.price).toFixed(2)}</span>
                <button
                  onClick={() => {
                    if (!isAuthenticated) { toast({ title: t("Please login first", "សូមចូលជាមុន"), variant: "destructive" }); return; }
                    addToCart.mutate({ data: { productId: p.id, quantity: 1 } });
                  }}
                  className="p-1 rounded-lg bg-primary/10 hover:bg-primary hover:text-white text-primary transition-colors"
                  title={t("Add to cart", "បន្ថែមទៅក្នុងកន្រ្តក")}
                >
                  <ShoppingCart className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Product Detail Page ───────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">("description");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [copied, setCopied] = useState(false);

  const { data: product, isLoading } = useGetProduct(Number(id));

  // Track recently viewed
  useEffect(() => {
    if (product) {
      addRv({
        id: product.id,
        name: product.name,
        nameKh: product.nameKh ?? null,
        price: Number(product.price),
        image: product.images?.[0] ?? null,
        discountPercent: product.discountPercent ?? null,
        stock: product.stock,
      });
    }
  }, [product?.id]);

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
        toast({ title: t("Added to cart!", "បានបន្ថែមទៅកន្រ្តក!") });
      },
    },
  });

  const { data: wishlist } = useGetWishlist({
    query: {
      enabled: isAuthenticated,
      queryKey: ["/api/wishlist"],
    },
  });

  const isWishlisted = wishlist?.some(item => item.id === Number(id)) ?? false;

  const addToWishlist = useAddToWishlist({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/wishlist"] });
        toast({ title: t("Saved to wishlist!", "បានរក្សាទុក!") });
      },
    },
  });

  const removeFromWishlist = useRemoveFromWishlist({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/wishlist"] });
        toast({ title: t("Removed from wishlist", "បានដកចេញ") });
      },
    },
  });

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      toast({ title: t("Please login first", "សូមចូលជាមុន"), variant: "destructive" });
      return;
    }
    if (isWishlisted) {
      removeFromWishlist.mutate({ productId: Number(id) });
    } else {
      addToWishlist.mutate({ productId: Number(id) });
    }
  };

  const createReview = useCreateReview({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`/api/products/${id}`] });
        setReviewComment("");
        setReviewRating(5);
        toast({ title: t("Review submitted!", "បានដាក់ការវាយតម្លៃ!") });
      },
      onError: (err: any) => {
        console.log("Review error:", err);
        toast({
          title: t(
            err?.response?.data?.message ?? "Could not submit review.",
            err?.response?.data?.message === "You already reviewed this product"
              ? "អ្នកបានវាយតម្លៃផលិតផលនេះរួចហើយ"
              : "មិនអាចដាក់ការវាយតម្លៃបានទេ"
          ),
          variant: "destructive",
        });
      },
    },
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) { toast({ title: t("Please login first", "សូមចូលជាមុន"), variant: "destructive" }); return; }
    addToCart.mutate({ data: { productId: Number(id), quantity: qty } });
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) { toast({ title: t("Please login first", "សូមចូលជាមុន"), variant: "destructive" }); return; }
    addToCart.mutate(
      { data: { productId: Number(id), quantity: qty } },
      { onSuccess: () => navigate("/cart") }
    );
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: t("Link copied!", "បានចម្លងតំណ!") });
    });
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <RootLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-4 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-px" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </RootLayout>
    );
  }

  if (!product) {
    return (
      <RootLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium mb-1">{t("Product not found", "រកមិនឃើញផលិតផល")}</p>
          <p className="text-muted-foreground text-sm mb-6">{t("This product may have been removed.", "ផលិតផលនេះអាចត្រូវបានដកចេញ។")}</p>
          <Link href="/products">
            <Button>{t("Browse Products", "ស្វែងរកផលិតផល")}</Button>
          </Link>
        </div>
      </RootLayout>
    );
  }

  const images: string[] = product.images?.length ? product.images.map(img => getProductImageUrl(img)) : [];
  const detail = product as ProductDetailView;
  const reviews: Review[] = detail.reviews ?? [];
  const alreadyReviewed = reviews.some(
  (review) => review.userId === user?.id
  );
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : Number(product.rating ?? 0);
  const discountPercent =
  getDiscountPercent(
    Number(product.price),
    product.originalPrice ? Number(product.originalPrice) : null
  ) ?? 0;
const savings =
  discountPercent > 0 && product.originalPrice
    ? Number(product.originalPrice) - Number(product.price)
    : 0;

  const TABS = [
    { id: "description" as const, en: "Description", kh: "ការពិពណ៌នា" },
    { id: "specs" as const, en: "Specifications", kh: "លក្ខណៈបច្ចេកទេស" },
    { id: "reviews" as const, en: `Reviews (${reviews.length || product.reviewCount || 0})`, kh: `ការវាយតម្លៃ (${reviews.length || product.reviewCount || 0})` },
  ];

  return (
    <RootLayout>
      <div className="bg-muted/30 min-h-screen">
        <div className="container mx-auto px-4 py-6 max-w-6xl">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 flex-wrap">
            <Link href="/" className="hover:text-primary transition-colors">{t("Home", "ទំព័រដើម")}</Link>
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
            <Link href="/products" className="hover:text-primary transition-colors">{t("Products", "ផលិតផល")}</Link>
            {product.categoryName && (
              <>
                <ChevronRight className="h-3 w-3 flex-shrink-0" />
                <Link href={`/category/${product.categoryName.toLowerCase().replace(/ /g, "-")}`} className="hover:text-primary transition-colors">
                  {product.categoryName}
                </Link>
              </>
            )}
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
            <span className="text-foreground font-medium line-clamp-1 max-w-[200px]">{product.name}</span>
          </nav>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 mb-8">

            {/* LEFT — Image gallery */}
            <div>
              <ImageGallery images={images} productName={product.name} />
            </div>

            {/* RIGHT — Product info */}
            <div className="space-y-5">
              {/* Brand + Category + Share */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {product.brandName && (
                    <Badge variant="outline" className="text-xs font-medium">
                      {product.brandName}
                    </Badge>
                  )}
                  {product.categoryName && (
                    <Badge variant="secondary" className="text-xs">
                      {product.categoryName}
                    </Badge>
                  )}
                  {product.isFeatured && (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-xs">
                      ⭐ {t("Featured", "ពិសេស")}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={handleShare}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title={t("Share", "ចែករំលែក")}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
                </button>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold leading-tight mb-0.5">
                  {t(product.name, product.nameKh ?? product.name)}
                </h1>
                {product.nameKh && product.nameKh !== product.name && (
                  <p className="text-muted-foreground text-sm">{product.nameKh}</p>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <StarRow rating={avgRating} />
                <span className="font-semibold text-sm">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</span>
                <span className="text-muted-foreground text-sm">
                  ({reviews.length || product.reviewCount || 0} {t("reviews", "ការវាយតម្លៃ")})
                </span>
                {(detail.soldCount ?? 0) > 0 && (
                  <span className="text-muted-foreground text-sm ml-2">{detail.soldCount} {t("sold", "")}</span>
                )}
              </div>

              {/* Price */}
              <div className="bg-white dark:bg-card rounded-2xl p-4 border">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-4xl font-black text-primary">${Number(product.price).toFixed(2)}</span>
                  {discountPercent > 0 && product.originalPrice && (
                    <span className="text-xl text-muted-foreground line-through">
                      ${Number(product.originalPrice).toFixed(2)}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <Badge className="bg-red-500 text-white border-0 text-sm px-2 py-0.5">
                      -{discountPercent}% {t("OFF", "បញ្ចុះ")}
                    </Badge>
                  )}
                </div>
                {discountPercent > 0 && savings > 0 && (
                  <p className="text-green-600 text-sm font-medium mt-1">
                    {t(`You save $${savings.toFixed(2)}!`, `អ្នកសន្សំ $${savings.toFixed(2)}!`)}
                  </p>
                )}
              </div>

              {/* Stock status */}
              <div className="flex items-center gap-2">
                {product.stock > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    {product.stock <= 10 ? (
                      <span className="text-sm text-orange-600 font-medium">
                        {t(`Only ${product.stock} left in stock — order soon!`, `មានតែ ${product.stock} ចំណែកទៀតប៉ុណ្ណោះ!`)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        <span className="text-green-600 font-medium">{t("In Stock", "មានស្តុក")}</span>
                        {" "}&mdash; {product.stock} {t("units available", "ចំណែក")}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-500 font-medium">{t("Out of Stock", "អស់ស្តុក")}</span>
                  </>
                )}
              </div>

              {/* Quantity + Total */}
              {product.stock > 0 && (
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">{t("Quantity", "បរិមាណ")}</p>
                    <div className="flex items-center border rounded-xl overflow-hidden bg-white dark:bg-card">
                      <button
                        onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="px-3 py-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        disabled={qty <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-2 font-semibold text-sm min-w-[3.5rem] text-center border-x">{qty}</span>
                      <button
                        onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                        className="px-3 py-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        disabled={qty >= product.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">{t("Total", "សរុប")}</p>
                    <p className="text-xl font-bold text-primary py-2">${(Number(product.price) * qty).toFixed(2)}</p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 font-semibold"
                    disabled={product.stock === 0 || addToCart.isPending}
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {addToCart.isPending ? t("Adding...", "កំពុងបន្ថែម...") : t("Add to Cart", "បន្ថែមទៅរទ្ធ")}
                  </Button>
                  <Button
                    size="lg"
                    className="gap-2 font-semibold"
                    disabled={product.stock === 0}
                    onClick={handleBuyNow}
                  >
                    <Zap className="h-4 w-4" />
                    {t("Buy Now", "ទិញឥឡូវ")}
                  </Button>
                </div>

                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full gap-2 border ${isWishlisted ? "text-rose-500 border-rose-200 bg-rose-50 dark:bg-rose-950/20" : "text-muted-foreground"}`}
                    onClick={handleWishlistToggle}
                    disabled={addToWishlist.isPending || removeFromWishlist.isPending}
                  >
                    <Heart className={`h-4 w-4 ${isWishlisted ? "fill-rose-500" : ""}`} />
                    {isWishlisted ? t("Saved to Wishlist", "បានរក្សាទុក") : t("Save to Wishlist", "រក្សាទុក")}
                  </Button>
                )}
              </div>

              {/* Delivery & Return */}
              <DeliveryInfo price={Number(product.price)} />

              {/* Trust row */}
              <div className="flex gap-3 flex-wrap text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-green-500" />{t("Secure Payment", "ទូទាត់សុវត្ថិភាព")}</div>
                <div className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-primary" />{t("Authentic Products", "ផលិតផលពិតប្រាកដ")}</div>
                <div className="flex items-center gap-1"><HeadphonesIcon className="h-3.5 w-3.5 text-blue-500" />{t("24/7 Support", "ជំនួយ 24/7")}</div>
              </div>
            </div>
          </div>

          {/* ── Tabs: Description / Specs / Reviews ────────────────────────── */}
          <div className="bg-white dark:bg-card border rounded-2xl overflow-hidden mb-8">
            {/* Tab header */}
            <div className="flex border-b overflow-x-auto scrollbar-hide">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-6 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  {t(tab.en, tab.kh)}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {/* Description */}
              {activeTab === "description" && (
                <div>
                  {product.description ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-line">
                        {product.description}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">{t("No description available for this product.", "គ្មានការពិពណ៌នាសម្រាប់ផលិតផលនេះ។")}</p>
                  )}
                  {product.tags && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t("Tags", "ស្លាក")}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {product.tags.split(",").map((tag: string) => (
                          <Badge key={tag.trim()} variant="secondary" className="text-xs">{tag.trim()}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Specifications */}
              {activeTab === "specs" && <SpecsTable product={product} />}

              {/* Reviews */}
              {activeTab === "reviews" && (
                <div className="space-y-6">
                  {/* Summary */}
                  {reviews.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-6 p-4 bg-muted/40 rounded-xl">
                      <div className="text-center flex-shrink-0">
                        <p className="text-5xl font-black text-primary">{avgRating.toFixed(1)}</p>
                        <StarRow rating={avgRating} size="lg" />
                        <p className="text-xs text-muted-foreground mt-1">{reviews.length} {t("reviews", "ការវាយតម្លៃ")}</p>
                      </div>
                      <div className="flex-1">
                        <RatingBreakdown reviews={reviews} />
                      </div>
                    </div>
                  )}

                  {/* Write review form */}
                  {isAuthenticated && alreadyReviewed && (
                    <div className="border rounded-xl p-5 bg-muted/40">
                      <p className="text-sm font-medium">
                        {t("You already reviewed this product", "អ្នកបានវាយតម្លៃផលិតផលនេះរួចហើយ")}
                      </p>
                    </div>
                  )}
                  {isAuthenticated && !alreadyReviewed && (
                    <div className="border rounded-xl p-5 space-y-3">
                      <h3 className="font-semibold">{t("Write a Review", "សរសេរការវាយតម្លៃ")}</h3>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">{t("Your rating", "ការវាយតម្លៃ")}</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <button
                              key={s}
                              onMouseEnter={() => setHoveredStar(s)}
                              onMouseLeave={() => setHoveredStar(0)}
                              onClick={() => setReviewRating(s)}
                            >
                              <Star className={`h-7 w-7 cursor-pointer transition-all ${s <= (hoveredStar || reviewRating) ? "fill-yellow-400 text-yellow-400 scale-110" : "text-gray-300 dark:text-gray-600"}`} />
                            </button>
                          ))}
                          <span className="text-sm text-muted-foreground ml-2 self-center">
                            {["", t("Poor", "អន់"), t("Fair", "ធម្មតា"), t("Good", "ល្អ"), t("Very Good", "ល្អណាស់"), t("Excellent!", "ល្អប្រសើរ!")][hoveredStar || reviewRating]}
                          </span>
                        </div>
                      </div>
                      <Textarea
                        placeholder={t("Share your experience with this product...", "ចែករំលែកបទពិសោធន៍ជាមួយផលិតផលនេះ...")}
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        rows={3}
                        className="text-sm resize-none"
                      />
                      <Button
                        onClick={() => {
                          if (!reviewComment.trim()) {
                            toast({
                              title: t("Please write a review comment", "សូមសរសេរមតិវាយតម្លៃ"),
                              variant: "destructive",
                            });
                            return;
                          }

                          createReview.mutate({
                            id: Number(id),
                            data: {
                              rating: reviewRating,
                              comment: reviewComment.trim(),
                            },
                          });
                        }}
                        disabled={createReview.isPending}
                        size="sm"
                        className="gap-2"
                      >
                        {createReview.isPending ? (
                          <>{t("Submitting...", "កំពុងដាក់...")}</>
                        ) : (
                          <><Check className="h-3.5 w-3.5" />{t("Submit Review", "ដាក់ការវាយតម្លៃ")}</>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Review list */}
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="flex gap-3 py-4 border-b last:border-0">
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                            {review.userName?.[0]?.toUpperCase() ?? "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                              <span className="font-medium text-sm">{review.userName ?? t("Anonymous", "អ익名")}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {review.createdAt
                                  ? new Date(review.createdAt).toLocaleDateString()
                                  : ""}
                              </span>
                            </div>
                            <StarRow rating={review.rating} size="sm" />
                            {review.comment && (
                              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Star className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
                      <p className="font-medium">{t("No reviews yet", "មិនទាន់មានការវាយតម្លៃ")}</p>
                      <p className="text-sm text-muted-foreground">{t("Be the first to review this product!", "ក្លាយជាអ្នកដំបូងដែលវាយតម្លៃ!")}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          <RelatedProducts categoryId={product.categoryId} currentId={product.id} />

          {/* Bottom spacing */}
          <div className="h-10" />
        </div>
      </div>
    </RootLayout>
  );
}
