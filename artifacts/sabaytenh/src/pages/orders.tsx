import { Link } from "wouter";
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useListOrders } from "@workspace/api-client-react";

const STATUS_CONFIG: Record<string, { label: string; labelKh: string; color: string; icon: any }> = {
  pending: { label: "Pending", labelKh: "រង់ចាំ", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  confirmed: { label: "Confirmed", labelKh: "បានបញ្ជាក់", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle },
  processing: { label: "Processing", labelKh: "កំពុងដំណើរការ", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: RefreshCw },
  shipped: { label: "Shipped", labelKh: "កំពុងដឹក", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400", icon: Truck },
  delivered: { label: "Delivered", labelKh: "បានដឹកជញ្ជូន", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  cancelled: { label: "Cancelled", labelKh: "បានលុបចោល", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {t(cfg.label, cfg.labelKh)}
    </span>
  );
}

export default function OrdersPage() {
  const { t } = useLanguage();
  const { data: orders, isLoading } = useListOrders();

  return (
    <ProtectedRoute>
      <RootLayout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <h1 className="text-2xl font-bold mb-6">{t("My Orders", "ការបញ្ជាទិញរបស់ខ្ញុំ")}</h1>

          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-bold mb-2">{t("No orders yet", "មិនទាន់មានការបញ្ជា")}</h2>
              <p className="text-muted-foreground mb-6">{t("Your orders will appear here.", "ការបញ្ជារបស់អ្នកនឹងលេចឡើងនៅទីនេះ។")}</p>
              <Link href="/products"><Button>{t("Start Shopping", "ចាប់ផ្ដើមទិញ")}</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div className="bg-white dark:bg-card border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm">#{order.id} — {t("Order", "ការបញ្ជា")}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="font-medium text-foreground">${Number(order.total).toFixed(2)}</span>
                        <span>•</span>
                        <span>{t(order.paymentMethod?.toUpperCase() ?? "—", order.paymentMethod?.toUpperCase() ?? "—")}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </RootLayout>
    </ProtectedRoute>
  );
}
