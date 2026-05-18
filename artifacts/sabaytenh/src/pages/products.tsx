import { useState } from "react";
import { useSearch, Link } from "wouter";
import { Search as SearchIcon, ShoppingCart, Heart, Star, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { RootLayout } from "@/components/layout/RootLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter } from "lucide-react";
import {
  useListProducts,
  useListCategories,
  useListBrands,
  useAddToCart,
  useAddToWishlist,
  ListProductsSort,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

function ProductCard({ product }: { product: any }) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
        toast({ title: t("Added to cart!", "បានបន្ថែម!") });
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
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded">{t("Out of Stock", "អស់ស្តុក")}</span>
          </div>
        )}
        {isAuthenticated && (
          <button
            onClick={(e) => { e.preventDefault(); addToWishlist.mutate({ productId: product.id }); }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
          >
            <Heart className="h-3.5 w-3.5" />
          </button>
        )}
      </Link>
      <div className="p-3">
        <Link href={`/products/${product.id}`}>
          <p className="text-xs text-muted-foreground mb-1">{product.categoryName}</p>
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

export default function ProductsPage() {
  const { t } = useLanguage();
  const search = useSearch();
  const params = new URLSearchParams(search);

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<ListProductsSort>(ListProductsSort.newest);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [selectedBrandId, setSelectedBrandId] = useState<number | undefined>(undefined);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const searchQuery = params.get("search") ?? "";
  const featuredOnly = params.get("featured") === "true";

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

  const toggleCategory = (id: number) => {
    setSelectedCategoryId(prev => prev === id ? undefined : id);
    setPage(1);
  };

  const toggleBrand = (id: number) => {
    setSelectedBrandId(prev => prev === id ? undefined : id);
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedCategoryId(undefined);
    setSelectedBrandId(undefined);
    setMinPrice(""); setMaxPrice("");
    setSortBy(ListProductsSort.newest);
    setPage(1);
  };

  const hasFilters = selectedCategoryId !== undefined || selectedBrandId !== undefined || minPrice || maxPrice;

  const FiltersContent = () => (
    <div className="space-y-6">
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full gap-2">
          <X className="h-3.5 w-3.5" /> {t("Clear Filters", "សម្អាតតម្រង")}
        </Button>
      )}
      <div>
        <h3 className="font-semibold text-sm mb-3">{t("Category", "ប្រភេទ")}</h3>
        <div className="space-y-2">
          {categories?.map(cat => (
            <div key={cat.id} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${cat.id}`}
                checked={selectedCategoryId === cat.id}
                onCheckedChange={() => toggleCategory(cat.id)}
              />
              <Label htmlFor={`cat-${cat.id}`} className="text-sm font-normal cursor-pointer">
                {t(cat.name, cat.nameKh ?? cat.name)}
                {cat.productCount != null && <span className="text-muted-foreground ml-1 text-xs">({cat.productCount})</span>}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-3">{t("Brand", "ម៉ាក")}</h3>
        <div className="space-y-2">
          {brands?.map(brand => (
            <div key={brand.id} className="flex items-center gap-2">
              <Checkbox
                id={`brand-${brand.id}`}
                checked={selectedBrandId === brand.id}
                onCheckedChange={() => toggleBrand(brand.id)}
              />
              <Label htmlFor={`brand-${brand.id}`} className="text-sm font-normal cursor-pointer">{brand.name}</Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-3">{t("Price Range ($)", "ជួរតម្លៃ ($)")}</h3>
        <div className="flex gap-2">
          <Input placeholder={t("Min", "ទាប")} value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} type="number" className="h-8 text-sm" />
          <Input placeholder={t("Max", "ខ្ពស់")} value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} type="number" className="h-8 text-sm" />
        </div>
      </div>
    </div>
  );

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <RootLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold">
              {searchQuery ? `${t("Results for", "លទ្ធផល")} "${searchQuery}"` :
               featuredOnly ? t("Featured Products", "ផលិតផលពិសេស") :
               t("All Products", "ផលិតផលទាំងអស់")}
            </h1>
            {data && <p className="text-sm text-muted-foreground">{data.total} {t("products", "ផលិតផល")}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v as ListProductsSort); setPage(1); }}>
              <SelectTrigger className="h-8 text-sm w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ListProductsSort.newest}>{t("Newest", "ថ្មីបំផុត")}</SelectItem>
                <SelectItem value={ListProductsSort.price_asc}>{t("Price: Low", "តម្លៃ: ទាប")}</SelectItem>
                <SelectItem value={ListProductsSort.price_desc}>{t("Price: High", "តម្លៃ: ខ្ពស់")}</SelectItem>
                <SelectItem value={ListProductsSort.best_selling}>{t("Popular", "ពេញនិយម")}</SelectItem>
                <SelectItem value={ListProductsSort.rating_desc}>{t("Top Rated", "ចំណាត់ខ្ពស់")}</SelectItem>
              </SelectContent>
            </Select>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden gap-2">
                  <Filter className="h-3.5 w-3.5" /> {t("Filter", "តម្រង")}
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader><SheetTitle>{t("Filters", "តម្រង")}</SheetTitle></SheetHeader>
                <div className="mt-4"><FiltersContent /></div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-6">
          <aside className="hidden md:block w-56 flex-shrink-0">
            <div className="bg-white dark:bg-card border rounded-xl p-4 sticky top-24">
              <h2 className="font-bold mb-4">{t("Filters", "តម្រង")}</h2>
              <FiltersContent />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array(12).fill(0).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-card border rounded-xl overflow-hidden">
                    <Skeleton className="aspect-square w-full" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-6 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.products.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="text-5xl mb-3">🔍</div>
                <p className="font-medium">{t("No products found", "រកមិនឃើញផលិតផល")}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data?.products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t("Previous", "មុន")}</Button>
                    <span className="flex items-center text-sm text-muted-foreground px-3">{page} / {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>{t("Next", "បន្ទាប់")}</Button>
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
