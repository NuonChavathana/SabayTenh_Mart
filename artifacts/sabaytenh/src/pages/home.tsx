import { Link } from "wouter";
import { ArrowRight, Star, ShoppingCart, Heart, Tag, Zap, Truck, Shield } from "lucide-react";
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
  useAddToCart,
  useAddToWishlist,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const CATEGORY_ICONS: Record<string, string> = {
  groceries: "🛒", drinks: "🥤", electronics: "📱", clothing: "👗",
  beauty: "💄", home: "🏠", school: "📚", "fresh-food": "🥦",
  "baby-kids": "👶", sports: "⚽", health: "💊", essentials: "🧴",
};

function ProductCard({ product }: { product: any }) {
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
        toast({ title: t("Added to wishlist!", "បានបន្ថែម!") });
      },
    },
  });

  return (
    <div className="bg-white dark:bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
      <Link href={`/products/${product.id}`} className="relative block aspect-square overflow-hidden bg-muted">
        <img
          src={product.image || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.discountPercent && (
          <Badge className="absolute top-2 left-2 bg-destructive text-white text-xs font-bold border-0">
            -{product.discountPercent}%
          </Badge>
        )}
        {isAuthenticated && (
          <button
            onClick={(e) => {
              e.preventDefault();
              addToWishlist.mutate({ productId: product.id });
            }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
          >
            <Heart className="h-3.5 w-3.5" />
          </button>
        )}
      </Link>
      <div className="p-3">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors mb-1">
            {t(product.name, product.nameKh ?? product.name)}
          </h3>
        </Link>
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
        <div className="flex items-center justify-between gap-1">
          <div>
            <span className="text-base font-bold text-primary">${Number(product.price).toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through ml-1">${Number(product.originalPrice).toFixed(2)}</span>
            )}
          </div>
          <Button
            size="sm"
            className="h-7 text-xs px-2 gap-1"
            onClick={() => {
              if (!isAuthenticated) {
                toast({ title: t("Please login first", "សូមចូលជាមុន"), variant: "destructive" });
                return;
              }
              addToCart.mutate({ data: { productId: product.id, quantity: 1 } });
            }}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="h-3 w-3" />
            {product.stock === 0 ? t("Out", "អស់") : t("Add", "បន្ថែម")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-white dark:bg-card border rounded-xl overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const { data: categories, isLoading: catLoading } = useListCategories();
  const { data: featured, isLoading: featLoading } = useListFeaturedProducts();
  const { data: bestSellers, isLoading: bsLoading } = useListBestSellers();

  return (
    <RootLayout>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/90 to-orange-600 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200)", backgroundSize: "cover" }}
        />
        <div className="relative container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <Badge className="bg-white/20 text-white border-white/30 mb-4">
              🇰🇭 {t("Cambodia's #1 Marketplace", "ទីផ្សារ #1 នៅកម្ពុជា")}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
              {t("Shop Everything,", "ទិញបានគ្រប់យ៉ាង,")}<br />
              <span className="text-yellow-300">{t("Delivered Fast", "ដឹកជញ្ជូនលឿន")}</span>
            </h1>
            <p className="text-lg opacity-90 mb-6 max-w-md">
              {t(
                "From daily groceries to the latest electronics — all in one place with fast delivery across Cambodia.",
                "ចាប់ពីគ្រឿងទេសប្រចាំថ្ងៃរហូតដល់គ្រឿងអេឡិចត្រូនិចចុងក្រោយបំផុត — ក្នុងកន្លែងតែមួយ ជាមួយការដឹកជញ្ជូនលឿនទូទាំងកម្ពុជា។"
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link href="/products">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
                  {t("Shop Now", "ទិញឥឡូវ")} <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/products?featured=true">
                <Button size="lg" variant="outline" className="border-white/60 text-white hover:bg-white/10">
                  {t("View Deals", "មើលប្រូម៉ូ")}
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-shrink-0 grid grid-cols-2 gap-3 w-full max-w-xs">
            {[
              { icon: <Truck className="h-5 w-5" />, label: t("Fast Delivery", "ដឹកជញ្ជូនលឿន") },
              { icon: <Shield className="h-5 w-5" />, label: t("Secure Payment", "ទូទាត់សុវត្ថិភាព") },
              { icon: <Tag className="h-5 w-5" />, label: t("Best Prices", "តម្លៃល្អបំផុត") },
              { icon: <Zap className="h-5 w-5" />, label: t("24/7 Support", "ជំនួយ 24/7") },
            ].map((item, i) => (
              <div key={i} className="bg-white/15 backdrop-blur rounded-xl p-3 flex flex-col items-center gap-1 text-center">
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{t("Shop by Category", "ទិញតាមប្រភេទ")}</h2>
          <Link href="/products">
            <Button variant="ghost" size="sm" className="text-primary gap-1">{t("All", "ទាំងអស់")} <ArrowRight className="h-3.5 w-3.5" /></Button>
          </Link>
        </div>
        {catLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {Array(12).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {categories?.map(cat => (
              <Link key={cat.id} href={`/category/${cat.slug}`}>
                <div className="bg-white dark:bg-card border rounded-xl p-3 flex flex-col items-center gap-2 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer text-center group">
                  <span className="text-3xl">{CATEGORY_ICONS[cat.slug] ?? "🛍️"}</span>
                  <span className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {t(cat.name, cat.nameKh ?? cat.name)}
                  </span>
                  {cat.productCount != null && (
                    <span className="text-[10px] text-muted-foreground">{cat.productCount}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">{t("Featured Products", "ផលិតផលពិសេស")}</h2>
            <p className="text-sm text-muted-foreground">{t("Hand-picked deals for you", "ការចាប់ព្រួញពិសេសសម្រាប់អ្នក")}</p>
          </div>
          <Link href="/products?featured=true">
            <Button variant="ghost" size="sm" className="text-primary gap-1">{t("See All", "មើលទាំងអស់")} <ArrowRight className="h-3.5 w-3.5" /></Button>
          </Link>
        </div>
        {featLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array(10).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {featured?.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Promo Banner */}
      <section className="container mx-auto px-4 py-4">
        <div className="bg-gradient-to-r from-secondary to-green-700 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center gap-4 justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">{t("Pay with KHQR", "ទូទាត់ជាមួយ KHQR")}</h3>
            <p className="text-white/85">{t("Scan to pay instantly with ABA, Wing, or any KHQR-compatible app.", "ស្កែន​ ដើម្បីទូទាត់ភ្លាមៗជាមួយ ABA, Wing ឬ KHQR។")}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {["KHQR", "ABA", "WING", "ACLEDA"].map(m => (
              <div key={m} className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm font-bold">{m}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="container mx-auto px-4 py-4 pb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">{t("Best Sellers", "លក់ដាច់បំផុត")}</h2>
            <p className="text-sm text-muted-foreground">{t("Most popular products this week", "ផលិតផលពេញនិយម")}</p>
          </div>
          <Link href="/products">
            <Button variant="ghost" size="sm" className="text-primary gap-1">{t("See All", "មើលទាំងអស់")} <ArrowRight className="h-3.5 w-3.5" /></Button>
          </Link>
        </div>
        {bsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array(10).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {bestSellers?.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </RootLayout>
  );
}
