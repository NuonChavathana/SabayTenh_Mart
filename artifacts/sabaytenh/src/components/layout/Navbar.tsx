import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Heart, User, Search, Menu, X, Sun, Moon, ChevronDown, LogOut, Settings, Package, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGetCart, useListCategories } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [, navigate] = useLocation();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: cart } = useGetCart({ query: { enabled: isAuthenticated, queryKey: ["/api/cart"] } });
  const { data: categories } = useListCategories();

  const cartCount = cart?.itemCount ?? 0;

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  const isStaff = user && ["admin", "staff", "cashier"].includes(user.role);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-card/95 backdrop-blur-sm border-b shadow-sm">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center gap-3 h-16">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <div className="flex flex-col gap-4 mt-6">
                <Link href="/" onClick={() => setMobileOpen(false)} className="text-lg font-bold text-primary">SabayTenh</Link>
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
          <Link href="/" className="flex-shrink-0 flex flex-col leading-none mr-2">
            <span className="text-xl font-bold text-primary tracking-tight">SabayTenh</span>
            <span className="text-xs text-muted-foreground font-medium hidden sm:block">សប្បាយទិញ</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search products...", "ស្វែងរកផលិតផល...")}
                className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
            <Button type="submit" size="sm" className="bg-primary text-white">
              {t("Search", "ស្វែងរក")}
            </Button>
          </form>

          <div className="flex items-center gap-1 ml-auto">
            {/* Language switcher */}
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

        {/* Category nav bar */}
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
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search...", "ស្វែងរក...")}
              className="pl-9 bg-muted/50 border-0 h-9 text-sm"
            />
          </div>
          <Button type="submit" size="sm">{t("Go", "ស្វែង")}</Button>
        </form>
      </div>
    </header>
  );
}
