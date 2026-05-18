import { useState } from "react";
import {
  Search, ChevronDown, ChevronUp, ShoppingBag, CreditCard,
  Package, Truck, CheckCircle2, XCircle, Check, ArrowRight, MapPin,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useListOrders, useUpdateOrderStatus, OrderStatusUpdateStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// ── Tracking stages (matches customer order-detail.tsx) ────────────────────────
const STAGES = [
  { status: "pending",    label: "Order Placed",      labelKh: "ការបញ្ជាបានដាក់",       Icon: ShoppingBag },
  { status: "confirmed",  label: "Payment Confirmed",  labelKh: "ការទូទាត់បានបញ្ជាក់",    Icon: CreditCard },
  { status: "processing", label: "Preparing Order",    labelKh: "កំពុងរៀបចំការបញ្ជា",     Icon: Package },
  { status: "shipped",    label: "Out for Delivery",   labelKh: "កំពុងដឹក",               Icon: Truck },
  { status: "delivered",  label: "Delivered",          labelKh: "បានដឹកដល់",             Icon: CheckCircle2 },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  confirmed:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  shipped:    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  delivered:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled:  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_LABELS: Record<string, [string, string]> = {
  pending:    ["Pending",    "រង់ចាំ"],
  confirmed:  ["Confirmed",  "បានបញ្ជាក់"],
  processing: ["Processing", "កំពុងរៀបចំ"],
  shipped:    ["Shipped",    "កំពុងដឹក"],
  delivered:  ["Delivered",  "បានដឹក"],
  cancelled:  ["Cancelled",  "បានលុប"],
};

const ALL_STATUSES = ["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

// ── Mini horizontal timeline ────────────────────────────────────────────────────
function MiniTimeline({ status }: { status: string }) {
  const currentIdx = STAGES.findIndex(s => s.status === status);
  if (status === "cancelled") return (
    <div className="flex items-center gap-1">
      <XCircle className="h-3.5 w-3.5 text-destructive" />
      <span className="text-xs text-destructive font-medium">Cancelled</span>
    </div>
  );

  return (
    <div className="flex items-center gap-0.5">
      {STAGES.map((s, i) => {
        const done    = i < currentIdx;
        const current = i === currentIdx;
        return (
          <div key={s.status} className="flex items-center gap-0.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-primary" : current ? "bg-primary/20 border border-primary" : "bg-muted"}`}>
              {done
                ? <Check className="h-2.5 w-2.5 text-white" />
                : <s.Icon className={`h-2.5 w-2.5 ${current ? "text-primary" : "text-muted-foreground"}`} />}
            </div>
            {i < STAGES.length - 1 && (
              <div className={`h-0.5 w-3 ${done ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Expanded order panel ────────────────────────────────────────────────────────
function OrderPanel({ order, onUpdateStatus }: { order: any; onUpdateStatus: (id: number, status: string) => void }) {
  const { t } = useLanguage();
  const currentIdx = STAGES.findIndex(s => s.status === order.status);
  const nextStage  = currentIdx >= 0 && currentIdx < STAGES.length - 1 ? STAGES[currentIdx + 1] : null;
  const isCancelled = order.status === "cancelled";

  return (
    <div className="bg-muted/30 dark:bg-muted/10 border-t px-4 py-5">
      <div className="grid md:grid-cols-2 gap-5">

        {/* Left: tracking timeline */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("Order Timeline", "ដំណើរការការបញ្ជា")}
          </p>

          {isCancelled ? (
            <div className="flex items-center gap-3 bg-destructive/5 border border-destructive/20 rounded-xl p-3">
              <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-destructive">{t("Order Cancelled", "ការបញ្ជាត្រូវបានលុប")}</p>
                <p className="text-xs text-muted-foreground">{t("This order was cancelled.", "ការបញ្ជានេះត្រូវបានលុបចោល។")}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {STAGES.map((stage, i) => {
                const isDone    = i < currentIdx;
                const isCurrent = i === currentIdx;
                const isFuture  = i > currentIdx;
                const isLast    = i === STAGES.length - 1;
                const { Icon } = stage;

                return (
                  <div key={stage.status} className="relative flex items-start gap-3">
                    {!isLast && (
                      <div className={`absolute left-[15px] top-8 w-0.5 h-6 ${isDone ? "bg-primary" : "bg-border"}`} />
                    )}
                    <div className="relative flex-shrink-0 z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center
                        ${isDone ? "bg-primary text-white" : isCurrent ? "bg-primary/10 border-2 border-primary text-primary" : "bg-muted border-2 border-border text-muted-foreground"}`}>
                        {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                      </div>
                      {isCurrent && <span className="absolute inset-0 rounded-full animate-ping bg-primary/20 pointer-events-none" />}
                    </div>
                    <div className={`flex-1 pb-6 ${isLast ? "pb-0" : ""}`}>
                      <p className={`text-sm font-semibold leading-tight ${isFuture ? "text-muted-foreground" : "text-foreground"}`}>
                        {t(stage.label, stage.labelKh)}
                      </p>
                      {isCurrent && (
                        <span className="text-[10px] text-primary font-medium">{t("Current status", "ស្ថានភាពបច្ចុប្បន្ន")}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: order info + status controls */}
        <div className="space-y-4">
          {/* Order info */}
          <div className="bg-white dark:bg-card border rounded-xl p-3 space-y-2 text-sm">
            <div className="flex gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">{t("Delivery address", "អាសយដ្ឋានដឹក")}</p>
                <p className="font-medium text-xs">{order.shippingAddress || "—"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">{t("Payment", "ការទូទាត់")}</p>
                <p className="font-medium text-xs uppercase">{order.paymentMethod} — <span className={order.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"}>{order.paymentStatus}</span></p>
              </div>
            </div>
          </div>

          {/* Quick advance */}
          {nextStage && !isCancelled && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {t("Quick Advance", "ឡើងដំណាក់កាលបន្ទាប់")}
              </p>
              <Button
                className="w-full gap-2 text-sm h-9"
                onClick={() => onUpdateStatus(order.id, nextStage.status)}
              >
                <nextStage.Icon className="h-3.5 w-3.5" />
                {t("Advance to", "ឡើង")} "{t(nextStage.label, nextStage.labelKh)}"
                <ArrowRight className="h-3.5 w-3.5 ml-auto" />
              </Button>
            </div>
          )}

          {/* Full status override */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {t("Set Status", "កំណត់ស្ថានភាព")}
            </p>
            <Select
              value={order.status}
              onValueChange={(v) => onUpdateStatus(order.id, v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(OrderStatusUpdateStatus).map(s => {
                  const label = STATUS_LABELS[s] ?? [s, s];
                  return (
                    <SelectItem key={s} value={s} className="text-sm">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${s === order.status ? "bg-primary" : "bg-muted-foreground/40"}`} />
                      {t(label[0], label[1])}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId]   = useState<number | null>(null);

  const { data: orders, isLoading } = useListOrders();

  const updateStatus = useUpdateOrderStatus({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/orders"] });
        toast({ title: t("Order status updated.", "ស្ថានភាពការបញ្ជាត្រូវបានធ្វើបច្ចុប្បន្នភាព។") });
      },
      onError: () => toast({ title: t("Failed to update status.", "មិនអាចធ្វើបច្ចុប្បន្នភាពបានទេ"), variant: "destructive" }),
    },
  });

  const handleUpdateStatus = (id: number, status: string) => {
    updateStatus.mutate({ id, data: { status: status as OrderStatusUpdateStatus } });
  };

  const filtered = (orders ?? []).filter((o: any) => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesSearch = !search || String(o.id).includes(search) || o.userName?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <AdminLayout>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{t("Orders Management", "គ្រប់គ្រងការបញ្ជា")}</h1>
            <span className="text-sm text-muted-foreground">{filtered.length} {t("orders", "ការបញ្ជា")}</span>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("Search by ID or name...", "ស្វែងរក...")} className="pl-9 h-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map(s => {
                  const label = STATUS_LABELS[s];
                  return (
                    <SelectItem key={s} value={s}>
                      {s === "all" ? t("All Statuses", "ស្ថានភាពទាំងអស់") : (label ? t(label[0], label[1]) : s)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Status summary pills */}
          <div className="flex gap-2 flex-wrap">
            {ALL_STATUSES.filter(s => s !== "all").map(s => {
              const count = (orders ?? []).filter((o: any) => o.status === s).length;
              if (count === 0) return null;
              return (
                <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${statusFilter === s ? "border-primary bg-primary text-white" : `${STATUS_COLORS[s]} border-transparent`}`}>
                  {STATUS_LABELS[s]?.[0] ?? s} ({count})
                </button>
              );
            })}
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">{t("No orders found", "រកមិនឃើញការបញ្ជា")}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground w-10"></th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Customer", "អតិថិជន")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Date", "កាលបរិច្ឆេទ")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Total", "សរុប")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Progress", "វឌ្ឍនភាព")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Status", "ស្ថានភាព")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map((order: any) => {
                        const expanded = expandedId === order.id;
                        const label = STATUS_LABELS[order.status] ?? [order.status, order.status];
                        return (
                          <>
                            <tr
                              key={order.id}
                              className={`hover:bg-muted/20 transition-colors cursor-pointer ${expanded ? "bg-muted/10" : ""}`}
                              onClick={() => setExpandedId(expanded ? null : order.id)}
                            >
                              <td className="px-4 py-3 text-muted-foreground">
                                {expanded
                                  ? <ChevronUp className="h-4 w-4" />
                                  : <ChevronDown className="h-4 w-4" />}
                              </td>
                              <td className="px-4 py-3 font-medium text-primary">#{order.id}</td>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium">{order.userName ?? "—"}</p>
                                  <p className="text-xs text-muted-foreground uppercase">{order.paymentMethod}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                              <td className="px-4 py-3 font-semibold text-primary">${Number(order.total).toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <MiniTimeline status={order.status} />
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? ""}`}>
                                  {t(label[0], label[1])}
                                </span>
                              </td>
                            </tr>
                            {expanded && (
                              <tr key={`${order.id}-panel`}>
                                <td colSpan={7} className="p-0">
                                  <OrderPanel order={order} onUpdateStatus={handleUpdateStatus} />
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
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
