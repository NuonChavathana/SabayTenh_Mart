import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, ShoppingBag, Package, Users, BarChart2,
  ChevronRight, Menu, X, Boxes, Home
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", labelKh: "ផ្ទាំងគ្រប់គ្រង", roles: ["admin", "staff", "cashier"] },
  { href: "/admin/orders", icon: ShoppingBag, label: "Orders", labelKh: "ការបញ្ជា", roles: ["admin", "staff", "cashier"] },
  { href: "/admin/products", icon: Package, label: "Products", labelKh: "ផលិតផល", roles: ["admin", "staff"] },
  { href: "/admin/inventory", icon: Boxes, label: "Inventory", labelKh: "សន្និធិ", roles: ["admin", "staff"] },
  { href: "/admin/users", icon: Users, label: "Users", labelKh: "អ្នកប្រើ", roles: ["admin"] },
];

function NavLink({ item, onClick }: { item: typeof NAV_ITEMS[0]; onClick?: () => void }) {
  const { t } = useLanguage();
  const [location] = useLocation();
  const { user } = useAuth();
  const Icon = item.icon;

  if (!user || !item.roles.includes(user.role)) return null;

  const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));

  return (
    <Link href={item.href} onClick={onClick}>
      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{t(item.label, item.labelKh)}</span>
        {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
      </div>
    </Link>
  );
}

function Sidebar({ onItemClick }: { onItemClick?: () => void }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Link href="/" className="flex flex-col" onClick={onItemClick}>
          <span className="text-xl font-bold text-primary">SabayTenh</span>
          <span className="text-xs text-muted-foreground">{t("Admin Panel", "ផ្ទាំងរ​ដ្ឋបាល")}</span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => <NavLink key={item.href} item={item} onClick={onItemClick} />)}
      </nav>
      <div className="p-3 border-t">
        <Link href="/" onClick={onItemClick}>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
            <Home className="h-4 w-4" />{t("Back to Store", "ត្រឡប់ទៅហាង")}
          </Button>
        </Link>
        <div className="mt-2 px-3 py-2 bg-muted/50 rounded-lg">
          <p className="text-xs font-medium truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-muted/20 dark:bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white dark:bg-card border-r flex-shrink-0 fixed top-0 bottom-0 left-0 z-40">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-56">
          <Sidebar onItemClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-30 bg-white dark:bg-card border-b px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-bold text-primary">SabayTenh Admin</span>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
