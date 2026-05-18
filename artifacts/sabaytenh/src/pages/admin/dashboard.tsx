import { Link } from "wouter";
import { ShoppingBag, Users, DollarSign, Package, TrendingUp, ArrowUpRight, Clock, AlertTriangle } from "lucide-react";
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { StatusBadge } from "../orders";

export default function DashboardPage() {
  const { t } = useLanguage();
  const { data: summary, isLoading: sumLoading } = useGetDashboardSummary();
  const { data: sales, isLoading: salesLoading } = useGetDailySales();
  const { data: recentOrders } = useGetRecentOrders();

  const stats = [
    {
      label: t("Total Revenue", "ចំណូលសរុប"),
      value: `$${Number(summary?.totalRevenue ?? 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/20",
    },
    {
      label: t("Total Orders", "ការបញ្ជាសរុប"),
      value: summary?.totalOrders ?? 0,
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      label: t("Total Users", "អ្នកប្រើ"),
      value: summary?.totalUsers ?? 0,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      label: t("Total Products", "ផលិតផល"),
      value: summary?.totalProducts ?? 0,
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin", "staff", "cashier"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{t("Dashboard", "ផ្ទាំងគ្រប់គ្រង")}</h1>
            <p className="text-muted-foreground text-sm">{t("Welcome back! Here's your store overview.", "ស្វាគមន៍! នេះជាទិដ្ឋភាពហាងរបស់អ្នក។")}</p>
          </div>

          {/* Stats */}
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
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-2xl font-bold mt-1">{stat.value}</p>
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

          {/* Today's stats */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-card border rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">{t("Today Revenue", "ចំណូលថ្ងៃនេះ")}</p>
                <p className="text-lg font-bold text-primary">${Number(summary.todayRevenue ?? 0).toFixed(2)}</p>
              </div>
              <div className="bg-white dark:bg-card border rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">{t("Today Orders", "ការបញ្ជាថ្ងៃនេះ")}</p>
                <p className="text-lg font-bold">{summary.todayOrders ?? 0}</p>
              </div>
              <div className="bg-white dark:bg-card border rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">{t("Pending Orders", "ការបញ្ជារង់ចាំ")}</p>
                <p className="text-lg font-bold text-yellow-600">{summary.pendingOrders ?? 0}</p>
              </div>
              <div className="bg-white dark:bg-card border rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                  {t("Low Stock Items", "ស្តុកទាប")}
                </p>
                <p className="text-lg font-bold text-destructive">{summary.lowStockCount ?? 0}</p>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {t("Sales (30 Days)", "ការលក់ (30 ថ្ងៃ)")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesLoading ? <Skeleton className="h-48" /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={sales ?? []}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(32, 98%, 52%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(32, 98%, 52%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" })} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                      <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`, t("Revenue", "ចំណូល")]} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(32, 98%, 52%)" strokeWidth={2} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-secondary" />
                  {t("Top Categories", "ប្រភេទពេញនិយម")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!summary?.topCategories || summary.topCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{t("No data yet", "មិនទាន់មានទិន្នន័យ")}</p>
                ) : (
                  <div className="space-y-2">
                    {summary.topCategories.slice(0, 6).map((cat: any) => (
                      <div key={cat.categoryName} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{cat.categoryName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{cat.orderCount} {t("orders", "")}</span>
                          <Badge variant="outline" className="text-xs font-semibold">${Number(cat.revenue).toFixed(0)}</Badge>
                        </div>
                      </div>
                    ))}
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
                  <Badge variant="outline" className="gap-1 cursor-pointer">
                    {t("View All", "មើលទាំងអស់")} <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {(recentOrders ?? []).slice(0, 8).map((order: any) => (
                  <div key={order.id} className="flex items-center gap-3 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      #{order.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{order.userName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-semibold text-primary">${Number(order.total).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
