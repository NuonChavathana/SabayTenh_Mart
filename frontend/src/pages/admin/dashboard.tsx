import { Link } from "wouter";
import {
  ShoppingBag, Users, DollarSign, Package, TrendingUp,
  ArrowUpRight, Clock, AlertTriangle, Star, BarChart3, Banknote,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetDashboardSummary,
  useGetDailySales,
  useGetRecentOrders,
} from "@workspace/api-client-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { StatusBadge } from "../orders";
import { getProductImageUrl } from "@/lib/images";

const PAYMENT_LOGOS: Record<string, { logo: string; label: string }> = {
  khqr:    { logo: "/logo-khqr.jpeg",    label: "KHQR Bakong" },
  aba:     { logo: "/logo-aba.jpeg",     label: "ABA Bank" },
  acleda:  { logo: "/logo-acleda.jpeg",  label: "ACLEDA" },
  canadia: { logo: "/logo-vatanak.jpeg", label: "Vatanak" },
  wing:    { logo: "/logo-wing.jpeg",    label: "Wing Money" },
  cash:    { logo: "",                   label: "Cash on Delivery" },
};

export default function DashboardPage() {
  const { t } = useLanguage();
  const { data: summary, isLoading: sumLoading } = useGetDashboardSummary();
  const { data: sales, isLoading: salesLoading } = useGetDailySales();
  const { data: recentOrders } = useGetRecentOrders();

  // KPI cards
  const stats = [
    {
      label: t("Total Revenue", "ចំណូលសរុប"),
      value: `$${Number(summary?.totalRevenue ?? 0).toFixed(2)}`,
      sub: `$${Number(summary?.todayRevenue ?? 0).toFixed(2)} ${t("today", "ថ្ងៃនេះ")}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/20",
    },
    {
      label: t("Total Orders", "ការបញ្ជាសរុប"),
      value: summary?.totalOrders ?? 0,
      sub: `${summary?.todayOrders ?? 0} ${t("today", "ថ្ងៃនេះ")}`,
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      label: t("Total Users", "អ្នកប្រើ"),
      value: summary?.totalUsers ?? 0,
      sub: `${summary?.pendingOrders ?? 0} ${t("pending orders", "ការបញ្ជារង់ចាំ")}`,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      label: t("Total Products", "ផលិតផល"),
      value: summary?.totalProducts ?? 0,
      sub: `${summary?.lowStockCount ?? 0} ${t("low stock", "ស្តុកទាប")}`,
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  const lowStockItems = (summary?.bestSellers ?? []).filter((p: any) => p.stock <= 10);

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page title */}
          <div>
            <h1 className="text-2xl font-bold">{t("Manager Dashboard", "ផ្ទាំងអ្នកគ្រប់គ្រង")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("Store overview & performance", "ទិដ្ឋភាព និងប្រតិបត្តការហាង")}
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i}>
                  <CardContent className="pt-5">
                    {sumLoading ? (
                      <Skeleton className="h-16" />
                    ) : (
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                          <p className="text-2xl font-bold mt-0.5">{stat.value}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                        </div>
                        <div className={`p-2 rounded-xl ${stat.bg}`}>
                          <Icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Daily summary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: t("Today Revenue", "ចំណូលថ្ងៃនេះ"), value: `$${Number(summary?.todayRevenue ?? 0).toFixed(2)}`, color: "text-primary" },
              { label: t("Today Orders", "ការបញ្ជាថ្ងៃនេះ"), value: summary?.todayOrders ?? 0, color: "" },
              { label: t("Pending Orders", "ការបញ្ជារង់ចាំ"), value: summary?.pendingOrders ?? 0, color: "text-yellow-600" },
              { label: t("Low Stock Items", "ទំនិញស្តុកទាប"), value: summary?.lowStockCount ?? 0, color: "text-destructive", alert: (summary?.lowStockCount ?? 0) > 0 },
            ].map((item, i) => (
              <div key={i} className={`bg-white dark:bg-card border rounded-xl p-3 text-center ${item.alert ? "border-destructive/40 bg-destructive/5 dark:bg-destructive/5" : ""}`}>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  {item.alert && <AlertTriangle className="h-3 w-3 text-destructive" />}
                  {item.label}
                </p>
                <p className={`text-xl font-bold mt-0.5 ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Sales area chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {t("Sales — Last 30 Days", "ការលក់ — 30 ថ្ងៃចុងក្រោយ")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesLoading ? <Skeleton className="h-48" /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={sales ?? []}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(32,98%,52%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(32,98%,52%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" })} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                      <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`, t("Revenue", "ចំណូល")]} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(32,98%,52%)" strokeWidth={2} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-secondary" />
                  {t("Top Categories", "ប្រភេទពេញនិយម")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!summary?.topCategories || summary.topCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{t("No data yet", "មិនទាន់មានទិន្នន័យ")}</p>
                ) : (
                  <div className="space-y-2">
                    {summary.topCategories.slice(0, 6).map((cat: any, i) => {
                      const maxRev = Math.max(...summary.topCategories!.map((c: any) => Number(c.revenue)));
                      const pct = maxRev > 0 ? (Number(cat.revenue) / maxRev) * 100 : 0;
                      return (
                        <div key={cat.categoryName}>
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="text-muted-foreground">{cat.categoryName}</span>
                            <span className="font-semibold">${Number(cat.revenue).toFixed(0)}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Best Sellers + Low Stock Alerts */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Best Sellers */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {t("Best Sellers", "ផលិតផលលក់ដាច់")}
                  </CardTitle>
                  <Link href="/admin/products">
                    <Badge variant="outline" className="gap-1 cursor-pointer text-xs">
                      {t("View All", "មើលទាំងអស់")} <ArrowUpRight className="h-3 w-3" />
                    </Badge>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {sumLoading ? (
                  <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-10" />)}</div>
                ) : !summary?.bestSellers || summary.bestSellers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{t("No sales data yet", "មិនទាន់មានទិន្នន័យ")}</p>
                ) : (
                  <div className="space-y-2">
                    {summary.bestSellers.slice(0, 6).map((p: any, i) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}`}>
                          {i + 1}
                        </div>
                        {p.image && (
                          <img src={getProductImageUrl(p.image)} alt={p.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                          <p className="text-xs text-muted-foreground">${Number(p.price).toFixed(2)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-semibold text-primary">{p.stock} {t("in stock", "ក្នុងស្តុក")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Alerts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    {t("Low Stock Alerts", "ការជូនដំណឹងស្តុកទាប")}
                    {(summary?.lowStockCount ?? 0) > 0 && (
                      <Badge variant="destructive" className="text-xs ml-1">{summary?.lowStockCount}</Badge>
                    )}
                  </CardTitle>
                  <Link href="/admin/inventory">
                    <Badge variant="outline" className="gap-1 cursor-pointer text-xs">
                      {t("Manage", "គ្រប់គ្រង")} <ArrowUpRight className="h-3 w-3" />
                    </Badge>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {sumLoading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}</div>
                ) : (summary?.lowStockCount ?? 0) === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-2">
                      <Package className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm text-green-600 font-medium">{t("All stock levels OK", "ស្តុកទាំងអស់ល្អ")}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(summary?.bestSellers ?? []).filter((p: any) => p.stock <= 10).slice(0, 6).map((p: any) => (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                        {p.image && (
                          <img src={getProductImageUrl(p.image)} alt={p.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.categoryName}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge
                            className={p.stock === 0
                              ? "bg-destructive text-white text-xs"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-0 text-xs"
                            }
                          >
                            {p.stock === 0 ? t("Out", "អស់") : `${p.stock} ${t("left", "នៅ")}`}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {(summary?.lowStockCount ?? 0) > 6 && (
                      <Link href="/admin/inventory">
                        <p className="text-xs text-primary text-center pt-1 hover:underline cursor-pointer">
                          +{(summary?.lowStockCount ?? 0) - 6} {t("more items need restocking", "ទំនិញទៀតត្រូវការបញ្ចូល")}
                        </p>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {t("Recent Orders", "ការបញ្ជាថ្មីៗ")}
                </CardTitle>
                <Link href="/admin/orders">
                  <Badge variant="outline" className="gap-1 cursor-pointer text-xs">
                    {t("View All", "មើលទាំងអស់")} <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {(recentOrders ?? []).slice(0, 8).map((order: any) => (
                  <Link key={order.id} href={`/admin/orders`}>
                    <div className="flex items-center gap-3 py-2.5 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        #{order.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{order.userName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          {PAYMENT_LOGOS[order.paymentMethod ?? ""]?.logo
                            ? <img src={PAYMENT_LOGOS[order.paymentMethod].logo} alt="" className="w-4 h-4 rounded object-cover" />
                            : <Banknote className="h-4 w-4 text-green-600 flex-shrink-0" />}
                          <span className="text-xs text-muted-foreground">{PAYMENT_LOGOS[order.paymentMethod ?? ""]?.label ?? order.paymentMethod?.toUpperCase()}</span>
                        </div>
                      </div>
                      <StatusBadge status={order.status} />
                      <span className="text-sm font-semibold text-primary flex-shrink-0">${Number(order.total).toFixed(2)}</span>
                    </div>
                  </Link>
                ))}
                {(recentOrders ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">{t("No orders yet", "មិនទាន់មានការបញ្ជា")}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
