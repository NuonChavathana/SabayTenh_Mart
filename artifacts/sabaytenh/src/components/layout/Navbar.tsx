import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  ShoppingCart, Heart, User, Search, Menu, Sun, Moon,
  ChevronDown, LogOut, Settings, Package, LayoutDashboard,
  Clock, X, TrendingUp, Tag, Boxes, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useGetCart, useListCategories, useListBrands, useListProducts,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// ── Recent searches helpers ───────────────────────────────────────────────────
const RS_KEY = "sabaytenh_searches";
const MAX_RECENT = 8;
function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RS_KEY) ?? "[]"); } catch { return []; }
}
function addRecent(term: string) {
  const prev = getRecent().filter(s => s !== term);
  localStorage.setItem(RS_KEY, JSON.stringify([term, ...prev].slice(0, MAX_RECENT)));
}
function removeRecent(term: string) {
  localStorage.setItem(RS_KEY, JSON.stringify(getRecent().filter(s => s !== term)));
}
function clearRecent() { localStorage.removeItem(RS_KEY); }

// ── SmartSearch ───────────────────────────────────────────────────────────────
function SmartSearch({ mobile = false }: { mobile?: boolean }) {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: categories } = useListCategories();
  const { data: brands } = useListBrands();

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Live product suggestions
  const { data: suggestions } = useListProducts(
    debounced.length >= 2 ? { search: debounced, limit: 6 } : {},
    { query: { enabled: debounced.length >= 2 } } as any,
  );

  // Category matches
  const catMatches = debounced.length >= 2
    ? (categories ?? []).filter(c =>
        c.name.toLowerCase().includes(debounced.toLowerCase()) ||
        (c.nameKh ?? "").includes(debounced))
      .slice(0, 3)
    : [];

  // Brand matches
  const brandMatches = debounced.length >= 2
    ? (brands ?? []).filter(b => b.name.toLowerCase().includes(debounced.toLowerCase())).slice(0, 3)
    : [];

  const productHits = suggestions?.products?.slice(0, 5) ?? [];
  const hasResults = catMatches.length > 0 || brandMatches.length > 0 || productHits.length > 0;
  const showRecent = recent.length > 0 && !debounced;
  const showDropdown = open && (showRecent || (debounced.length >= 2));

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const refreshRecent = () => setRecent(getRecent());

  const handleFocus = () => {
    refreshRecent();
    setOpen(true);
  };

  const doSearch = (term: string) => {
    if (!term.trim()) return;
    addRecent(term.trim());
    navigate(`/products?search=${encodeURIComponent(term.trim())}`);
    setQuery("");
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  const handleRemoveRecent = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    removeRecent(term);
    setRecent(getRecent());
  };

  const handleClearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecent();
    setRecent([]);
  };

  return (
    <div ref={containerRef} className={`relative ${mobile ? "w-full" : "flex-1 max-w-xl"}`}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={handleFocus}
            placeholder={t("Search products, brands, categories...", "ស្វែងរកផលិតផល, ម៉ាក, ប្រភេទ...")}
            className={`w-full pl-9 pr-3 ${mobile ? "h-9 text-sm" : "h-10"} rounded-lg bg-muted/60 border border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-card focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm placeholder:text-muted-foreground`}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setDebounced(""); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button type="submit" size="sm" className={`bg-primary text-white ${mobile ? "h-9 px-3 text-xs" : ""}`}>
          {mobile ? t("Go", "ស្វែង") : t("Search", "ស្វែងរក")}
        </Button>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-card border rounded-2xl shadow-xl shadow-black/10 z-[200] overflow-hidden max-h-[480px] overflow-y-auto">

          {/* Recent searches */}
          {showRecent && (
            <div>
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("Recent Searches", "ស្វែងរកថ្មីៗ")}
                </span>
                <button onClick={handleClearRecent} className="text-[11px] text-muted-foreground hover:text-destructive transition-colors">
                  {t("Clear all", "លុបទាំងអស់")}
                </button>
              </div>
              <div className="pb-2">
                {recent.map(term => (
                  <div
                    key={term}
                    onClick={() => doSearch(term)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-muted/60 cursor-pointer group"
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-sm">{term}</span>
                    <button
                      onClick={e => handleRemoveRecent(e, term)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground transition-all"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {debounced.length >= 2 && !hasResults && (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              {t(`No suggestions for "${debounced}"`, `មិនមានការណែនាំ "${debounced}"`)}
            </div>
          )}

          {/* Category matches */}
          {catMatches.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("Categories", "ប្រភេទ")}
                </span>
              </div>
              {catMatches.map(cat => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 cursor-pointer"
                >
                  <Tag className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">
                    {t(cat.name, cat.nameKh ?? cat.name)}
                  </span>
                  {cat.productCount != null && (
                    <span className="ml-auto text-xs text-muted-foreground">{cat.productCount} {t("items", "ផលិតផល")}</span>
                  )}
                  <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                </Link>
              ))}
            </div>
          )}

          {/* Brand matches */}
          {brandMatches.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("Brands", "ម៉ាក")}
                </span>
              </div>
              {brandMatches.map(brand => (
                <div
                  key={brand.id}
                  onClick={() => doSearch(brand.name)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 cursor-pointer"
                >
                  <Boxes className="h-3.5 w-3.5 text-secondary flex-shrink-0" />
                  <span className="text-sm font-medium">{brand.name}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/50 ml-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Product suggestions */}
          {productHits.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("Products", "ផលិតផល")}
                </span>
              </div>
              {productHits.map(p => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  onClick={() => { addRecent(debounced); setOpen(false); }}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-muted/60 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                    <img
                      src={p.image || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=80"}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.categoryName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-primary">${Number(p.price).toFixed(2)}</p>
                    {p.discountPercent && (
                      <Badge className="bg-red-500 text-white border-0 text-[10px] px-1 py-0">-{p.discountPercent}%</Badge>
                    )}
                  </div>
                </Link>
              ))}
              <div className="px-4 py-2 border-t">
                <button
                  onClick={() => doSearch(debounced)}
                  className="w-full text-center text-sm text-primary font-medium hover:underline py-1"
                >
                  {t(`See all results for "${debounced}"`, `មើលលទ្ធផលទាំងអស់ "${debounced}"`)}
                </button>
              </div>
            </div>
          )}

          {/* Popular searches hint when empty query */}
          {!debounced && !recent.length && (
            <div className="px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {t("Popular Searches", "ស្វែងរកពេញនិយម")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["Rice", "Smartphone", "Shampoo", "Notebook", "Coffee", "Nike"].map(term => (
                  <button
                    key={term}
                    onClick={() => doSearch(term)}
                    className="px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary text-xs transition-colors border"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [, navigate] = useLocation();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: cart } = useGetCart({ query: { enabled: isAuthenticated, queryKey: ["/api/cart"] } });
  const { data: categories } = useListCategories();

  const cartCount = cart?.itemCount ?? 0;

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark(d => !d);
  };

  const isStaff = user && ["admin", "staff", "cashier"].includes(user.role);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-card/95 backdrop-blur-sm border-b shadow-sm">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center gap-3 h-20">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <div className="flex flex-col gap-4 mt-6">
                <Link href="/" onClick={() => setMobileOpen(false)}>
                  <img src="/logo.png" alt="SabayTenh" className="h-20 w-auto object-contain" />
                </Link>
                <Link href="/products" onClick={() => setMobileOpen(false)} className="text-sm font-medium hover:text-primary">{t("All Products", "ផលិតផលទាំងអស់")}</Link>
                {categories?.map(c => (
                  <Link key={c.id} href={`/category/${c.slug}`} onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-primary">
                    {t(c.name, c.nameKh ?? c.name)}
                  </Link>
                ))}
                {isStaff && <Link href="/admin" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-secondary hover:text-secondary/80">{t("Dashboard", "ផ្ទាំងគ្រប់គ្រង")}</Link>}
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 mr-2">
            <img src="/logo.png" alt="SabayTenh" className="h-[72px] w-auto object-contain" />
          </Link>

          {/* Smart Search — desktop */}
          <div className="flex-1 max-w-xl hidden md:flex">
            <SmartSearch />
          </div>

          <div className="flex items-center gap-1 ml-auto">
            {/* Language */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "kh" : "en")}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2"
            >
              {language === "en" ? "ខ្មែរ" : "EN"}
            </Button>

            {/* Dark mode */}
            <Button variant="ghost" size="icon" onClick={toggleDark}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link href="/wishlist">
                <Button variant="ghost" size="icon">
                  <Heart className="h-4 w-4" />
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary text-white border-0">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 px-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:block text-xs max-w-20 truncate">{user?.name}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/account"><User className="h-4 w-4 mr-2" />{t("My Account", "គណនីរបស់ខ្ញុំ")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders"><Package className="h-4 w-4 mr-2" />{t("My Orders", "ការបញ្ជាទិញ")}</Link>
                  </DropdownMenuItem>
                  {isStaff && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin"><LayoutDashboard className="h-4 w-4 mr-2" />{t("Dashboard", "ផ្ទាំងគ្រប់គ្រង")}</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />{t("Logout", "ចេញ")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-xs px-2">{t("Login", "ចូល")}</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="text-xs px-3">{t("Register", "ចុះឈ្មោះ")}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Category nav */}
        <nav className="hidden md:flex items-center gap-1 h-10 overflow-x-auto scrollbar-hide">
          <Link href="/products">
            <Button variant="ghost" size="sm" className="text-xs whitespace-nowrap">
              {t("All", "ទាំងអស់")}
            </Button>
          </Link>
          {categories?.slice(0, 10).map(cat => (
            <Link key={cat.id} href={`/category/${cat.slug}`}>
              <Button variant="ghost" size="sm" className="text-xs whitespace-nowrap">
                {t(cat.name, cat.nameKh ?? cat.name)}
              </Button>
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <SmartSearch mobile />
      </div>
    </header>
  );
}
