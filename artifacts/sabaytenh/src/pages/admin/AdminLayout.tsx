import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, ShoppingBag, Package, Users, Boxes,
  ChevronRight, Menu, Home, ShoppingCart, Ticket,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const NAV_ITEMS = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    label: "Dashboard",
    labelKh: "ផ្ទាំងគ្រប់គ្រង",
    roles: ["admin"],
    exact: true,
  },
  {
    href: "/admin/pos",
    icon: ShoppingCart,
    label: "POS Cashier",
    labelKh: "ប្រព័ន្ធគិតប្រាក់",
    roles: ["admin", "cashier"],
    exact: false,
  },
  {
    href: "/admin/orders",
    icon: ShoppingBag,
    label: "Orders",
    labelKh: "ការបញ្ជា",
    roles: ["admin", "staff"],
    exact: false,
  },
  {
    href: "/admin/products",
    icon: Package,
    label: "Products",
    labelKh: "ផលិតផល",
    roles: ["admin", "staff"],
    exact: false,
  },
  {
    href: "/admin/inventory",
    icon: Boxes,
    label: "Inventory",
    labelKh: "សន្និធិ",
    roles: ["admin", "staff"],
    exact: false,
  },
  {
    href: "/admin/users",
    icon: Users,
    label: "Users",
    labelKh: "អ្នកប្រើ",
    roles: ["admin"],
    exact: false,
  },
  {
    href: "/admin/coupons",
    icon: Ticket,
    label: "Coupons",
    labelKh: "គូប៉ុង",
    roles: ["admin"],
    exact: false,
  },
];

const ROLE_BADGE: Record<string, { label: string; labelKh: string; color: string }> = {
  admin:   { label: "Manager",  labelKh: "អ្នកគ្រប់គ្រង", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  staff:   { label: "Staff",    labelKh: "បុគ្គលិក",        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  cashier: { label: "Cashier",  labelKh: "អ្នកគិតប្រាក់",   color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

function NavLink({ item, onClick }: { item: typeof NAV_ITEMS[0]; onClick?: () => void }) {
  const { t } = useLanguage();
  const [location] = useLocation();
  const { user } = useAuth();
  const Icon = item.icon;

  if (!user || !item.roles.includes(user.role)) return null;

  const isActive = item.exact
    ? location === item.href
    : location === item.href || location.startsWith(item.href + "/");

  return (
    <Link href={item.href} onClick={onClick}>
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-primary text-white shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
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
  const roleMeta = ROLE_BADGE[user?.role ?? ""] ?? ROLE_BADGE.staff;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b">
        <Link href="/" className="flex flex-col" onClick={onItemClick}>
          <span className="text-xl font-bold text-primary">SabayTenh</span>
          <span className="text-xs text-muted-foreground">{t("Admin Panel", "ផ្ទាំងរដ្ឋបាល")}</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {/* Role section headers */}
        {user?.role === "cashier" && (
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2">{t("Cashier Tools", "ឧបករណ៍អ្នកគិតប្រាក់")}</p>
        )}
        {user?.role === "staff" && (
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2">{t("Store Management", "គ្រប់គ្រងហាង")}</p>
        )}
        {user?.role === "admin" && (
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2">{t("Manager View", "ទិដ្ឋភាពអ្នកគ្រប់គ្រង")}</p>
        )}
        {NAV_ITEMS.map(item => (
          <NavLink key={item.href} item={item} onClick={onItemClick} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t space-y-2">
        <Link href="/" onClick={onItemClick}>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
            <Home className="h-4 w-4" />{t("Back to Store", "ត្រឡប់ទៅហាង")}
          </Button>
        </Link>
        <div className="px-3 py-2 bg-muted/50 rounded-lg">
          <p className="text-xs font-medium truncate">{user?.name}</p>
          <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-0.5 ${roleMeta.color}`}>
            {t(roleMeta.label, roleMeta.labelKh)}
          </span>
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
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
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
