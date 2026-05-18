import { useState } from "react";
import { Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useListOrders, useUpdateOrderStatus, OrderStatusUpdateStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { StatusBadge } from "../orders";

const ALL_STATUSES = ["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: orders, isLoading } = useListOrders();

  const updateStatus = useUpdateOrderStatus({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/orders"] });
        toast({ title: t("Order status updated.", "ស្ថានភាពការបញ្ជាត្រូវបានធ្វើបច្ចុប្បន្នភាព។") });
      },
    },
  });

  const filtered = (orders ?? []).filter((o: any) => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesSearch = !search || String(o.id).includes(search) || o.userName?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <AdminLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{t("Orders Management", "គ្រប់គ្រងការបញ្ជា")}</h1>
            <span className="text-sm text-muted-foreground">{filtered.length} {t("orders", "ការបញ្ជា")}</span>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t("Search by ID or name...", "ស្វែងរក...")}
                className="pl-9 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map(s => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? t("All Status", "ស្ថានភាពទាំងអស់") : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">{t("No orders found", "រកមិនឃើញការបញ្ជា")}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Customer", "អតិថិជន")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Date", "កាលបរិច្ឆេទ")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Total", "សរុប")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Payment", "ការទូទាត់")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Status", "ស្ថានភាព")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Action", "សកម្មភាព")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map((order: any) => (
                        <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium">#{order.id}</td>
                          <td className="px-4 py-3 text-muted-foreground">{order.userName ?? "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-semibold text-primary">${Number(order.total).toFixed(2)}</td>
                          <td className="px-4 py-3 uppercase text-xs text-muted-foreground">{order.paymentMethod}</td>
                          <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                          <td className="px-4 py-3">
                            <Select
                              value={order.status}
                              onValueChange={(v) => updateStatus.mutate({ id: order.id, data: { status: v as OrderStatusUpdateStatus } })}
                            >
                              <SelectTrigger className="h-7 text-xs w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(OrderStatusUpdateStatus).map(s => (
                                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
