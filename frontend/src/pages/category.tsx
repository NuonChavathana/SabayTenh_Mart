import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { ShoppingCart, Heart, Star, SlidersHorizontal, X, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { RootLayout } from "@/components/layout/RootLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getDiscountPercent } from "@/lib/discount";
import {
  useListCategories,
  useListBrands,
  useListProducts,
  useAddToCart,
  useAddToWishlist,
  ListProductsSort,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { getProductImageUrl } from "@/lib/images";

const CATEGORY_ICONS: Record<string, string> = {};

const CATEGORY_BANNERS: Record<string, { bg: string; desc: string; descKh: string }> = {
  electronics: { bg: "from-blue-600 to-blue-800", desc: "Latest gadgets & tech", descKh: "ឧបករណ៍បច្ចេកវិទ្យាចុងក្រោយ" },
  clothing: { bg: "from-pink-500 to-rose-600", desc: "Fashion for everyone", descKh: "ម៉ូតសម្រាប់គ្រប់គ្នា" },
  groceries: { bg: "from-green-500 to-emerald-700", desc: "Fresh & affordable daily essentials", descKh: "គ្រឿងទេសស្រស់ & មានតម្លៃសន្សំ" },
  drinks: { bg: "from-cyan-500 to-blue-600", desc: "Beverages for every occasion", descKh: "ភេសជ្ជៈសម្រាប់រាល់ឱកាស" },
  beauty: { bg: "from-purple-500 to-fuchsia-600", desc: "Beauty & personal care", descKh: "ផ្នែកសម្រស់ & ថែរក្សាខ្លួន" },
  home: { bg: "from-orange-500 to-amber-600", desc: "Everything for your home", descKh: "ទំនិញគ្រប់យ៉ាងសម្រាប់ផ្ទះ" },
  school: { bg: "from-indigo-500 to-blue-700", desc: "School & office supplies", descKh: "គ្រឿងបន្លែ & ការិយាល័យ" },
  "fresh-food": { bg: "from-lime-500 to-green-600", desc: "Farm-fresh produce daily", descKh: "ផ្លែឈើ & បន្លែស្រស់ប្រចាំថ្ងៃ" },
  "baby-kids": { bg: "from-yellow-400 to-orange-500", desc: "Safe & fun for little ones", descKh: "សុវត្ថិភាព & សប្បាយសម្រាប់ក្មេង" },
  sports: { bg: "from-teal-500 to-cyan-600", desc: "Gear up for every sport", descKh: "ឧបករណ៍សម្រាប់កីឡា" },
  health: { bg: "from-red-500 to-rose-700", desc: "Health & wellness products", descKh: "ផលិតផលសុខភាព" },
  essentials: { bg: "from-slate-500 to-slate-700", desc: "Everyday household essentials", descKh: "គ្រឿងប្រើប្រាស់ប្រចាំថ្ងៃ" },
};

function ProductCard({ product }: { product: any }) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const discountPercent = getDiscountPercent(
    Number(product.price),
    product.originalPrice ? Number(product.originalPrice) : null
  ) ?? 0;

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
    <div className="bg-white dark:bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 group">
      <Link href={`/products/${product.id}`} className="relative block overflow-hidden bg-muted">
        <div className="aspect-square overflow-hidden">
          <img
            src={getProductImageUrl(product.image)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        {discountPercent > 0 && (
          <Badge className="absolute top-2 left-2 bg-destructive text-white text-xs font-bold border-0 shadow-sm">
            -{discountPercent}%
          </Badge>
        )}
        {product.isFeatured && discountPercent === 0 && (
          <Badge className="absolute top-2 left-2 bg-primary text-white text-xs font-bold border-0 shadow-sm">
            ★ {t("Featured", "ពិសេស")}
          </Badge>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-black/70 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {t("Out of Stock", "អស់ស្តុក")}
            </span>
          </div>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <Badge className="absolute bottom-2 left-2 bg-orange-500 text-white text-[10px] font-bold border-0">
            {t("Only", "សល់")} {product.stock} {t("left", "")}
          </Badge>
        )}
        {isAuthenticated && (
          <button
            onClick={(e) => { e.preventDefault(); addToWishlist.mutate({ productId: product.id }); }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/85 hover:bg-white text-muted-foreground hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
          >
            <Heart className="h-3.5 w-3.5" />
          </button>
        )}
      </Link>
      <div className="p-3">
        <Link href={`/products/${product.id}`}>
          {product.brandName && <p className="text-[11px] text-muted-foreground mb-0.5">{product.brandName}</p>}
          <h3 className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors leading-snug mb-1.5">
            {t(product.name, product.nameKh ?? product.name)}
          </h3>
        </Link>

        {/* Rating */}
        {product.rating ? (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star
                  key={s}
                  className={`h-3 w-3 ${s <= Math.round(Number(product.rating)) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-medium">{Number(product.rating).toFixed(1)}</span>
            {product.reviewCount > 0 && (
              <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
            )}
          </div>
        ) : (
          <div className="h-5 mb-2" />
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base font-bold text-primary">${Number(product.price).toFixed(2)}</span>
              {discountPercent > 0 && product.originalPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  ${Number(product.originalPrice).toFixed(2)}
                </span>
              )}
            </div>
            {product.soldCount > 0 && (
              <span className="text-[11px] text-muted-foreground">{product.soldCount} {t("sold", "")}</span>
            )}
          </div>
          <Button
            size="sm"
            className="h-8 px-3 text-xs gap-1 flex-shrink-0"
            disabled={product.stock === 0}
            onClick={() => {
              if (!isAuthenticated) {
                toast({ title: t("Please sign in first", "សូមចូលជាមុន"), variant: "destructive" });
                return;
              }
              addToCart.mutate({ data: { productId: product.id, quantity: 1 } });
            }}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
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
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex justify-between items-center pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<ListProductsSort>(ListProductsSort.newest);
  const [selectedBrandId, setSelectedBrandId] = useState<number | undefined>(undefined);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  useEffect(() => {
  const timer = setTimeout(() => {
    setMinPrice(minPriceInput);
    setMaxPrice(maxPriceInput);
    setPage(1);
  }, 600);

  return () => clearTimeout(timer);
}, [minPriceInput, maxPriceInput]);

  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  const { data: categories } = useListCategories();
  const { data: brands } = useListBrands();

  // Resolve slug → category object
  const category = categories?.find(c => c.slug === slug);
  const categoryId = category?.id;

  const { data, isLoading } = useListProducts({
    categoryId,
    brandId: selectedBrandId,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    minRating,
    sort: sortBy,
    page,
    limit: 24,
  });

  const banner = CATEGORY_BANNERS[slug] ?? { bg: "from-primary to-orange-600", desc: "Shop the best products", descKh: "ទំនិញល្អបំផុត" };

  const clearFilters = () => {
    setSelectedBrandId(undefined);
    setMinPriceInput("");
    setMaxPriceInput("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating(undefined);
    setSortBy(ListProductsSort.newest); setPage(1);
  };

  const hasFilters = selectedBrandId !== undefined || minPrice || maxPrice || minRating !== undefined;
  const totalPages = data ? Math.ceil(data.total / 24) : 1;

  // Sidebar filter content
  const renderFilterContent = () => (
    <div className="space-y-6">
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full gap-2 text-sm">
          <X className="h-3.5 w-3.5" /> {t("Clear All Filters", "សម្អាតតម្រងទាំងអស់")}
        </Button>
      )}

      {/* Brand */}
      {brands && brands.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3 text-foreground">{t("Brand", "ម៉ាក")}</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {brands.map(brand => (
              <div key={brand.id} className="flex items-center gap-2.5">
                <Checkbox
                  id={`brand-${brand.id}`}
                  checked={selectedBrandId === brand.id}
                  onCheckedChange={() => {
                    setSelectedBrandId(prev => prev === brand.id ? undefined : brand.id);
                    setPage(1);
                  }}
                />
                <Label htmlFor={`brand-${brand.id}`} className="text-sm font-normal cursor-pointer leading-tight">
                  {brand.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-sm mb-3 text-foreground">{t("Price Range ($)", "ជួរតម្លៃ ($)")}</h3>
        <div className="flex gap-2">
          <Input
            placeholder={t("Min", "ទាប")}
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            type="number"
            min="0"
            className="h-8 text-sm"
          />
          <Input
            placeholder={t("Max", "ខ្ពស់")}
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            type="number"
            min="0"
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <h3 className="font-semibold text-sm mb-3 text-foreground">{t("Min Rating", "ចំណាត់ទាបបំផុត")}</h3>
        <div className="space-y-2">
          {[4, 3, 2].map(r => (
            <button
              key={r}
              onClick={() => { setMinRating(prev => prev === r ? undefined : r); setPage(1); }}
              className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors ${minRating === r ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
            >
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`h-3.5 w-3.5 ${s <= r ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`} />
                ))}
              </div>
              <span className="text-muted-foreground text-xs">{t("& up", "ឡើង")}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Other categories */}
      <div>
        <h3 className="font-semibold text-sm mb-3 text-foreground">{t("Browse Categories", "រកមើលប្រភេទ")}</h3>
        <div className="space-y-1">
          {categories?.map(cat => (
            <Link key={cat.id} href={`/category/${cat.slug}`}>
              <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${cat.slug === slug ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"}`}>
                <span>{CATEGORY_ICONS[cat.slug]}</span>
                <span className="flex-1 truncate">{t(cat.name, cat.nameKh ?? cat.name)}</span>
                {cat.slug === slug && <ChevronRight className="h-3 w-3" />}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <RootLayout>
      {/* Category Banner */}
      <div className={`bg-gradient-to-r ${banner.bg} text-white`}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-white/70 text-sm mb-3">
            <Link href="/" className="hover:text-white transition-colors">{t("Home", "ទំព័រដើម")}</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/products" className="hover:text-white transition-colors">{t("Products", "ផលិតផល")}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">{category ? t(category.name, category.nameKh ?? category.name) : slug}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{CATEGORY_ICONS[slug]}</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {category ? t(category.name, category.nameKh ?? category.name) : slug}
              </h1>
              <p className="text-white/80 text-sm mt-1">{t(banner.desc, banner.descKh)}</p>
              {data && (
                <p className="text-white/70 text-xs mt-1">
                  {data.total} {t("products available", "ផលិតផលមាន")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Sort + filter bar */}
        <div className="flex items-center justify-between mb-5 gap-3">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden gap-2">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {t("Filters", "តម្រង")}
                  {hasFilters && <Badge className="h-4 w-4 p-0 text-[10px] flex items-center justify-center bg-primary">!</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader><SheetTitle>{t("Filters", "តម្រង")}</SheetTitle></SheetHeader>
                <div className="mt-4 overflow-y-auto">{renderFilterContent()}</div>
              </SheetContent>
            </Sheet>
            {data && <span className="text-sm text-muted-foreground hidden sm:block">{data.total} {t("results", "លទ្ធផល")}</span>}
          </div>

          <Select value={sortBy} onValueChange={(v) => { setSortBy(v as ListProductsSort); setPage(1); }}>
            <SelectTrigger className="h-8 text-sm w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ListProductsSort.newest}>{t("Newest First", "ថ្មីបំផុត")}</SelectItem>
              <SelectItem value={ListProductsSort.price_asc}>{t("Price: Low to High", "តម្លៃ: ទាប → ខ្ពស់")}</SelectItem>
              <SelectItem value={ListProductsSort.price_desc}>{t("Price: High to Low", "តម្លៃ: ខ្ពស់ → ទាប")}</SelectItem>
              <SelectItem value={ListProductsSort.best_selling}>{t("Best Selling", "លក់ដាច់")}</SelectItem>
              <SelectItem value={ListProductsSort.rating_desc}>{t("Highest Rated", "ចំណាត់ខ្ពស់")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden md:block w-56 flex-shrink-0">
            <div className="bg-white dark:bg-card border rounded-xl p-4 sticky top-24">
              <h2 className="font-bold mb-4 text-sm">{t("Filters", "តម្រង")}</h2>
              {renderFilterContent()}
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {!categories ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array(12).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : data?.products.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">{CATEGORY_ICONS[slug]}</div>
                <h3 className="text-lg font-bold mb-2">{t("No products found", "រកមិនឃើញផលិតផល")}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {t("Try adjusting your filters.", "សាកល្បងកែតម្រង។")}
                </p>
                {hasFilters && (
                  <Button variant="outline" onClick={clearFilters} className="gap-2">
                    <X className="h-3.5 w-3.5" /> {t("Clear Filters", "សម្អាតតម្រង")}
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data?.products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      {t("Previous", "មុន")}
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === pageNum ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground"}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      {t("Next", "បន្ទាប់")}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
