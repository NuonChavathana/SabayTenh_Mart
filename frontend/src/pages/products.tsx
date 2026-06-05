import { useEffect, useState } from "react";
import { useSearch, Link, useLocation } from "wouter";
import {
  ShoppingCart, Heart, Star, X, Filter, SlidersHorizontal,
  Search as SearchIcon, PackageX, TrendingUp, ArrowUpDown,
  ChevronRight, Sparkles,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { RootLayout } from "@/components/layout/RootLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  useListProducts, useListCategories, useListBrands,
  useAddToCart, useAddToWishlist, ListProductsSort,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { getProductImageUrl } from "@/lib/images";
import { getDiscountPercent } from "@/lib/discount";

// ── Sort config ───────────────────────────────────────────────────────────────
const SORTS: { value: ListProductsSort; en: string; kh: string }[] = [
  { value: ListProductsSort.newest,      en: "Newest",        kh: "ថ្មីបំផុត" },
  { value: ListProductsSort.price_asc,   en: "Price: Low→High", kh: "តម្លៃ: ទាប→ខ្ពស់" },
  { value: ListProductsSort.price_desc,  en: "Price: High→Low", kh: "តម្លៃ: ខ្ពស់→ទាប" },
  { value: ListProductsSort.best_selling,en: "Best Selling",  kh: "លក់ដាច់" },
  { value: ListProductsSort.rating_desc, en: "Top Rated",     kh: "ចំណាត់ខ្ពស់" },
];

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product }: { product: any }) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const discountPercent =
  getDiscountPercent(
    Number(product.price),
    product.originalPrice ? Number(product.originalPrice) : null
  ) ?? 0;

  const addToCart = useAddToCart({
    mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/cart"] }); toast({ title: t("Added to cart!", "បានបន្ថែម!") }); } },
  });
  const addToWishlist = useAddToWishlist({
    mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/wishlist"] }); toast({ title: t("Saved!", "បានរក្សាទុក!") }); } },
  });

  return (
    <div className="bg-white dark:bg-card border rounded-xl overflow-hidden hover:shadow-md transition-all group flex flex-col">
      <Link href={`/products/${product.id}`} className="relative block aspect-square overflow-hidden bg-muted flex-shrink-0">
        <img
          src={getProductImageUrl(product.image)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {discountPercent > 0 && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold border-0">
            -{discountPercent}%
          </Badge>
        )}
        {product.isFeatured && discountPercent === 0 && (
          <Badge className="absolute top-2 left-2 bg-amber-400 text-white text-xs border-0">
            ⭐
          </Badge>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded">
              {t("Out of Stock", "អស់ស្តុក")}
            </span>
          </div>
        )}
        {isAuthenticated && (
          <button
            onClick={e => { e.preventDefault(); addToWishlist.mutate({ productId: product.id }); }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-muted-foreground hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
          >
            <Heart className="h-3.5 w-3.5" />
          </button>
        )}
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <Link href={`/products/${product.id}`}>
          <p className="text-[11px] text-muted-foreground mb-0.5">{product.categoryName}</p>
          <h3 className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors leading-tight mb-1.5">
            {t(product.name, product.nameKh ?? product.name)}
          </h3>
        </Link>
        {product.brandName && (
          <p className="text-[11px] text-muted-foreground mb-1">{product.brandName}</p>
        )}
        <div className="flex items-center gap-1 mb-2">
          {product.rating && (
            <>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{Number(product.rating).toFixed(1)}</span>
              {product.reviewCount > 0 && (
                <span className="text-[11px] text-muted-foreground">({product.reviewCount})</span>
              )}
            </>
          )}
          {product.soldCount > 0 && (
            <span className="text-[11px] text-muted-foreground ml-auto">{product.soldCount} {t("sold", "")}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1 mt-auto">
          <div>
            <span className="text-base font-bold text-primary">${Number(product.price).toFixed(2)}</span>
            {discountPercent > 0 && product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through ml-1">
                ${Number(product.originalPrice).toFixed(2)}
              </span>
            )}
          </div>
          <Button
            size="sm"
            className="h-7 text-xs px-2 gap-1 flex-shrink-0"
            disabled={product.stock === 0 || addToCart.isPending}
            onClick={() => {
              if (!isAuthenticated) { toast({ title: t("Please login first", "សូមចូលជាមុន"), variant: "destructive" }); return; }
              addToCart.mutate({ data: { productId: product.id, quantity: 1 } });
            }}
          >
            <ShoppingCart className="h-3 w-3" />
            {t("Add", "បន្ថែម")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array(12).fill(0).map((_, i) => (
        <div key={i} className="bg-white dark:bg-card border rounded-xl overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex justify-between items-center pt-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-7 w-14 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── No Results ────────────────────────────────────────────────────────────────
function NoResults({
  query, categories, onClear,
}: {
  query: string;
  categories: any[];
  onClear: () => void;
}) {
  const { t } = useLanguage();
  const [, navigate] = useLocation();

  const suggestions = ["Rice", "Smartphone", "Shampoo", "Coffee", "Nike", "Samsung"];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
          <PackageX className="h-12 w-12 text-muted-foreground/40" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <SearchIcon className="h-4 w-4 text-primary" />
        </div>
      </div>

      {query ? (
        <>
          <h2 className="text-xl font-bold mb-1">
            {t(`No results for "${query}"`, `មិនមានលទ្ធផលសម្រាប់ "${query}"`)}
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm">
            {t("Try checking your spelling, using fewer keywords, or browsing by category.", "សូមពិនិត្យអក្ខរាវិរុទ្ធ ឬស្វែងរកតាមប្រភេទ។")}
          </p>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold mb-1">{t("No products found", "រកមិនឃើញផលិតផល")}</h2>
          <p className="text-muted-foreground text-sm mb-6">{t("Try adjusting your filters.", "សូមកែតម្រងរបស់អ្នក។")}</p>
        </>
      )}

      {/* Try these searches */}
      {query && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            {t("Try searching for", "សាកល្បងស្វែងរក")}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => navigate(`/products?search=${encodeURIComponent(s)}`)}
                className="px-3 py-1.5 rounded-full border text-sm hover:bg-primary/10 hover:border-primary hover:text-primary transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Browse by category */}
      {categories.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            {t("Browse by category", "រុករកតាមប្រភេទ")}
          </p>
          <div className="flex flex-wrap gap-2 justify-center max-w-lg">
            {categories.slice(0, 8).map(cat => (
              <Link key={cat.id} href={`/category/${cat.slug}`}>
                <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors text-sm py-1 px-3">
                  {t(cat.name, cat.nameKh ?? cat.name)}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onClear}>{t("Clear Filters", "សម្អាតតម្រង")}</Button>
        <Button asChild>
          <Link href="/products">{t("Browse All Products", "រុករកផលិតផលទាំងអស់")}</Link>
        </Button>
      </div>
    </div>
  );
}

// ── Products Page ─────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const { t } = useLanguage();
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<ListProductsSort>(ListProductsSort.newest);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(
    params.get("categoryId") ? Number(params.get("categoryId")) : undefined
  );
  const [selectedBrandId, setSelectedBrandId] = useState<number | undefined>(undefined);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const searchQuery = params.get("search") ?? "";
  const featuredOnly = params.get("featured") === "true";
  useEffect(() => {
  const timer = setTimeout(() => {
    setMinPrice(minPriceInput);
    setMaxPrice(maxPriceInput);
    setPage(1);
  }, 600);

  return () => clearTimeout(timer);
}, [minPriceInput, maxPriceInput]);

  const { data: categories } = useListCategories();
  const { data: brands } = useListBrands();

  const { data, isLoading } = useListProducts({
    page,
    limit: 20,
    search: searchQuery || undefined,
    categoryId: selectedCategoryId,
    brandId: selectedBrandId,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort: sortBy,
  });

  const toggleCategory = (id: number) => { setSelectedCategoryId(p => p === id ? undefined : id); setPage(1); };
  const toggleBrand = (id: number) => { setSelectedBrandId(p => p === id ? undefined : id); setPage(1); };

  const clearFilters = () => {
    setSelectedCategoryId(undefined);
    setSelectedBrandId(undefined);
    setMinPriceInput("");
    setMaxPriceInput("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy(ListProductsSort.newest);
    setPage(1);
  };

  const hasFilters = selectedCategoryId !== undefined || selectedBrandId !== undefined || minPrice || maxPrice;
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const activeCategoryName = categories?.find(c => c.id === selectedCategoryId);
  const activeBrandName = brands?.find(b => b.id === selectedBrandId);

  // ── Filters panel (shared desktop + mobile sheet) ─────────────────────────
  const renderFiltersContent = () => (
    <div className="space-y-5">
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full gap-2 text-xs">
          <X className="h-3.5 w-3.5" /> {t("Clear All Filters", "សម្អាតតម្រងទាំងអស់")}
        </Button>
      )}

      {/* Categories */}
      <div>
        <h3 className="font-semibold text-sm mb-2.5 flex items-center gap-1.5">
          <span className="w-1 h-4 bg-primary rounded-full" />
          {t("Category", "ប្រភេទ")}
        </h3>
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-hide">
          {categories?.map(cat => (
            <div key={cat.id} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${cat.id}`}
                checked={selectedCategoryId === cat.id}
                onCheckedChange={() => toggleCategory(cat.id)}
              />
              <Label htmlFor={`cat-${cat.id}`} className="text-sm font-normal cursor-pointer flex-1 flex items-center justify-between">
                <span>{t(cat.name, cat.nameKh ?? cat.name)}</span>
                {cat.productCount != null && (
                  <span className="text-muted-foreground text-xs ml-1">({cat.productCount})</span>
                )}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-semibold text-sm mb-2.5 flex items-center gap-1.5">
          <span className="w-1 h-4 bg-secondary rounded-full" />
          {t("Brand", "ម៉ាក")}
        </h3>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
          {brands?.map(brand => (
            <div key={brand.id} className="flex items-center gap-2">
              <Checkbox
                id={`brand-${brand.id}`}
                checked={selectedBrandId === brand.id}
                onCheckedChange={() => toggleBrand(brand.id)}
              />
              <Label htmlFor={`brand-${brand.id}`} className="text-sm font-normal cursor-pointer">
                {brand.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="font-semibold text-sm mb-2.5 flex items-center gap-1.5">
          <span className="w-1 h-4 bg-green-500 rounded-full" />
          {t("Price Range ($)", "ជួរតម្លៃ ($)")}
        </h3>
        <div className="flex gap-2">
          <Input
          placeholder={t("Min", "ទាប")}
          value={minPriceInput}
          onChange={(e) => setMinPriceInput(e.target.value)}
          type="number"
          className="h-8 text-sm"
        />
          <Input
          placeholder={t("Max", "ខ្ពស់")}
          value={maxPriceInput}
          onChange={(e) => setMaxPriceInput(e.target.value)}
          type="number"
          className="h-8 text-sm"
       />
        </div>
        {/* Quick price presets */}
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {[["Under $5","","5"], ["$5–$20","5","20"], ["$20–$50","20","50"], ["$50+","50",""]].map(([label, min, max]) => (
            <button
              key={label}
              onClick={() => {
                setMinPriceInput(min);
                setMaxPriceInput(max);
                setMinPrice(min);
                setMaxPrice(max);
                setPage(1);
              }}
              className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                minPrice === min && maxPrice === max
                  ? "bg-primary text-white border-primary"
                  : "hover:border-primary hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <RootLayout>
      <div className="bg-muted/30 min-h-screen">
        <div className="container mx-auto px-4 py-6">

          {/* Page header */}
          <div className="mb-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-bold">
                  {searchQuery
                    ? <>{t("Results for", "លទ្ធផលសម្រាប់")} <span className="text-primary">"{searchQuery}"</span></>
                    : featuredOnly
                    ? <><Sparkles className="inline h-5 w-5 text-amber-400 mr-1" />{t("Featured Products", "ផលិតផលពិសេស")}</>
                    : t("All Products", "ផលិតផលទាំងអស់")}
                </h1>
                {data && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {data.total.toLocaleString()} {t("products found", "ផលិតផលត្រូវបានរកឃើញ")}
                  </p>
                )}
              </div>

              {/* Mobile filter button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden gap-2">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    {t("Filter", "តម្រង")}
                    {hasFilters && <Badge className="h-4 w-4 p-0 text-[10px] bg-primary ml-0.5">!</Badge>}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader><SheetTitle>{t("Filters", "តម្រង")}</SheetTitle></SheetHeader>
                  <div className="mt-4 overflow-y-auto">{renderFiltersContent()}</div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active filter chips */}
            {(searchQuery || hasFilters || featuredOnly) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1.5 pr-1.5 text-xs">
                    <SearchIcon className="h-3 w-3" />
                    {searchQuery}
                    <button onClick={() => navigate("/products")} className="hover:text-destructive ml-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {featuredOnly && (
                  <Badge variant="secondary" className="gap-1.5 pr-1.5 text-xs">
                    ⭐ {t("Featured", "ពិសេស")}
                    <button onClick={() => navigate("/products")} className="hover:text-destructive ml-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {activeCategoryName && (
                  <Badge variant="secondary" className="gap-1.5 pr-1.5 text-xs">
                    {t(activeCategoryName.name, activeCategoryName.nameKh ?? activeCategoryName.name)}
                    <button onClick={() => setSelectedCategoryId(undefined)} className="hover:text-destructive ml-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {activeBrandName && (
                  <Badge variant="secondary" className="gap-1.5 pr-1.5 text-xs">
                    {activeBrandName.name}
                    <button onClick={() => setSelectedBrandId(undefined)} className="hover:text-destructive ml-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {minPrice && (
                  <Badge variant="secondary" className="gap-1.5 pr-1.5 text-xs">
                    ${minPrice}+ 
                    <button
                      onClick={() => {
                      setMinPriceInput("");
                      setMinPrice("");
                    }}
                    className="hover:text-destructive ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  </Badge>
                )}
                {maxPrice && (
                  <Badge variant="secondary" className="gap-1.5 pr-1.5 text-xs">
                    {t("Under", "ក្រោម")} ${maxPrice}
                    <button
                      onClick={() => {
                      setMaxPriceInput("");
                      setMaxPrice("");
                    }}
                    className="hover:text-destructive ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  </Badge>
                )}
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline"
                  >
                    {t("Clear all", "លុបទាំងអស់")}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sort pills */}
          <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground flex-shrink-0 mr-1">{t("Sort:", "តម្រៀប:")}</span>
            {SORTS.map(s => (
              <button
                key={s.value}
                onClick={() => { setSortBy(s.value); setPage(1); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                  sortBy === s.value
                    ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                    : "bg-white dark:bg-card hover:border-primary/50 hover:text-primary border-border"
                }`}
              >
                {t(s.en, s.kh)}
              </button>
            ))}
          </div>

          {/* Main layout */}
          <div className="flex gap-6">
            {/* Sidebar */}
            <aside className="hidden md:block w-56 flex-shrink-0">
              <div className="bg-white dark:bg-card border rounded-xl p-4 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold flex items-center gap-1.5">
                    <Filter className="h-4 w-4" />
                    {t("Filters", "តម្រង")}
                  </h2>
                  {hasFilters && (
                    <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                      {t("Clear", "លុប")}
                    </button>
                  )}
                </div>
                {renderFiltersContent()}
              </div>
            </aside>

            {/* Products grid */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <LoadingSkeleton />
              ) : data?.products.length === 0 ? (
                <NoResults
                  query={searchQuery}
                  categories={categories ?? []}
                  onClear={clearFilters}
                />
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

                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                          const p = totalPages <= 7 ? i + 1
                            : page <= 4 ? i + 1
                            : page >= totalPages - 3 ? totalPages - 6 + i
                            : page - 3 + i;
                          return (
                            <button
                              key={p}
                              onClick={() => setPage(p)}
                              className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                                p === page
                                  ? "bg-primary text-white font-semibold"
                                  : "hover:bg-muted text-muted-foreground"
                              }`}
                            >
                              {p}
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
      </div>
    </RootLayout>
  );
}
