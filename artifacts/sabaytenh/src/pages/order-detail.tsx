import { useParams, Link } from "wouter";
import {
  ArrowLeft, ShoppingBag, CreditCard, Package, Truck, CheckCircle2,
  MapPin, Clock, XCircle, Check,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetOrder } from "@workspace/api-client-react";

// ── Tracking stages ────────────────────────────────────────────────────────────
const STAGES = [
  {
    status: "pending",
    label: "Order Placed",
    labelKh: "ការបញ្ជាបានដាក់",
    desc: "We received your order and are reviewing it.",
    descKh: "យើងបានទទួលការបញ្ជារបស់អ្នក ហើយកំពុងពិនិត្យ។",
    Icon: ShoppingBag,
    offsetMs: 0,
  },
  {
    status: "confirmed",
    label: "Payment Confirmed",
    labelKh: "ការទូទាត់បានបញ្ជាក់",
    desc: "Payment verified. Your order is accepted.",
    descKh: "ការទូទាត់បានផ្ទៀងផ្ទាត់។ ការបញ្ជារបស់អ្នកត្រូវបានទទួល។",
    Icon: CreditCard,
    offsetMs: 5 * 60 * 1000,
  },
  {
    status: "processing",
    label: "Preparing Order",
    labelKh: "កំពុងរៀបចំការបញ្ជា",
    desc: "Your items are being picked and packed.",
    descKh: "ទំនិញរបស់អ្នកកំពុងត្រូវបានរៀបចំ និងខ្ចប់។",
    Icon: Package,
    offsetMs: 35 * 60 * 1000,
  },
  {
    status: "shipped",
    label: "Out for Delivery",
    labelKh: "កំពុងដឹក",
    desc: "Your order is on its way to you.",
    descKh: "ការបញ្ជារបស់អ្នកកំពុងដឹកយក។",
    Icon: Truck,
    offsetMs: 2 * 60 * 60 * 1000,
  },
  {
    status: "delivered",
    label: "Delivered",
    labelKh: "បានដឹកដល់",
    desc: "Your order was delivered successfully. Enjoy!",
    descKh: "ការបញ្ជារបស់អ្នកបានដឹកដល់ដោយជោគជ័យ! សូមរីករាយ!",
    Icon: CheckCircle2,
    offsetMs: 25 * 60 * 60 * 1000,
  },
] as const;

function stepTime(createdAt: string, offsetMs: number) {
  return new Date(new Date(createdAt).getTime() + offsetMs).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

// ── Payment method display name ────────────────────────────────────────────────
const PM_LABELS: Record<string, string> = {
  khqr: "KHQR Bakong", aba: "ABA Bank", acleda: "ACLEDA",
  canadia: "Vatanak Bank", wing: "Wing Money", cash: "Cash on Delivery",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { data: order, isLoading } = useGetOrder(Number(id));

  if (isLoading) {
    return (
      <ProtectedRoute>
        <RootLayout>
          <div className="container mx-auto px-4 py-8 max-w-2xl space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </RootLayout>
      </ProtectedRoute>
    );
  }

  if (!order) {
    return (
      <ProtectedRoute>
        <RootLayout>
          <div className="container mx-auto px-4 py-16 text-center">
            <p className="text-muted-foreground">{t("Order not found.", "រកមិនឃើញការបញ្ជា។")}</p>
            <Link href="/orders"><Button className="mt-4">{t("Back to Orders", "ត្រឡប់ទៅការបញ្ជា")}</Button></Link>
          </div>
        </RootLayout>
      </ProtectedRoute>
    );
  }

  const isCancelled = order.status === "cancelled";
  const currentIdx  = STAGES.findIndex(s => s.status === order.status);

  return (
    <ProtectedRoute>
      <RootLayout>
        <div className="container mx-auto px-4 py-6 max-w-2xl">

          {/* Back */}
          <Link href="/orders">
            <Button variant="ghost" size="sm" className="gap-2 mb-5 -ml-2">
              <ArrowLeft className="h-4 w-4" />{t("Back to Orders", "ត្រឡប់ទៅការបញ្ជា")}
            </Button>
          </Link>

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{t("Order", "ការបញ្ជា")}</p>
              <h1 className="text-2xl font-bold">#{order.id}</h1>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">{new Date(order.createdAt ?? "").toLocaleDateString()}</p>
              <span className="font-bold text-primary text-lg">${Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          {/* ── Tracking Timeline ── */}
          <div className="bg-white dark:bg-card border rounded-2xl p-5 mb-4">
            <h2 className="font-bold mb-5 flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              {t("Order Tracking", "តាមដានការបញ្ជា")}
            </h2>

            {isCancelled ? (
              <div className="flex items-center gap-4 bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="font-bold text-destructive">{t("Order Cancelled", "ការបញ្ជាត្រូវបានលុប")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("This order has been cancelled.", "ការបញ្ជានេះត្រូវបានលុបចោល។")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                {STAGES.map((stage, i) => {
                  const isDone    = i < currentIdx;
                  const isCurrent = i === currentIdx;
                  const isFuture  = i > currentIdx;
                  const isLast    = i === STAGES.length - 1;
                  const { Icon } = stage;

                  return (
                    <div key={stage.status} className="relative flex items-start gap-4">
                      {/* Connector line */}
                      {!isLast && (
                        <div className={`absolute left-[19px] top-10 w-0.5 h-8 transition-colors ${isDone ? "bg-primary" : "bg-border"}`} />
                      )}

                      {/* Step circle */}
                      <div className="relative flex-shrink-0 z-10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                          ${isDone    ? "bg-primary text-white shadow-md shadow-primary/30"
                          : isCurrent ? "bg-primary/10 border-2 border-primary text-primary"
                          :             "bg-muted border-2 border-border text-muted-foreground"}`}>
                          {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                        </div>
                        {isCurrent && (
                          <span className="absolute inset-0 rounded-full animate-ping bg-primary/20 pointer-events-none" />
                        )}
                      </div>

                      {/* Step content */}
                      <div className={`flex-1 pb-8 ${isLast ? "pb-0" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`font-semibold text-sm ${isFuture ? "text-muted-foreground" : "text-foreground"}`}>
                              {t(stage.label, stage.labelKh)}
                            </p>
                            <p className={`text-xs mt-0.5 leading-relaxed ${isCurrent ? "text-muted-foreground" : isFuture ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                              {isFuture ? t("Pending", "រង់ចាំ") : t(stage.desc, stage.descKh)}
                            </p>
                          </div>
                          {!isFuture && order.createdAt && (
                            <span className={`text-[11px] font-medium whitespace-nowrap flex-shrink-0 mt-0.5 ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                              {isCurrent
                                ? t("In progress...", "កំពុងដំណើរការ...")
                                : stepTime(order.createdAt, stage.offsetMs)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Order Info ── */}
          <div className="bg-white dark:bg-card border rounded-2xl p-5 mb-4 grid sm:grid-cols-3 gap-4 text-sm">
            <div className="flex gap-3">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t("Order Date", "កាលបរិច្ឆេទ")}</p>
                <p className="font-medium">{new Date(order.createdAt ?? "").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t("Deliver To", "ដឹកទៅ")}</p>
                <p className="font-medium">{order.shippingAddress}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t("Payment", "ការទូទាត់")}</p>
                <p className="font-medium">{PM_LABELS[order.paymentMethod ?? ""] ?? (order.paymentMethod ?? "—").toUpperCase()}</p>
                <span className={`text-xs font-medium ${order.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                  {order.paymentStatus === "paid" ? t("Paid", "បានបង់") : t("Pending payment", "រង់ចាំការទូទាត់")}
                </span>
              </div>
            </div>
          </div>

          {/* ── Items ── */}
          <div className="bg-white dark:bg-card border rounded-2xl p-5 mb-4">
            <h2 className="font-bold mb-4">{t("Items Ordered", "ទំនិញដែលបានបញ្ជា")} ({(order.items ?? []).length})</h2>
            <div className="space-y-3">
              {(order.items ?? []).map((item: any) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0 border">
                    {item.productImage
                      ? <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                      : <Package className="h-6 w-6 text-muted-foreground m-auto mt-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">${Number(item.price).toFixed(2)} × {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-sm text-primary">${(Number(item.price) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Payment Summary ── */}
          <div className="bg-white dark:bg-card border rounded-2xl p-5">
            <h2 className="font-bold mb-3">{t("Payment Summary", "សង្ខេបការទូទាត់")}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("Subtotal", "តម្លៃរង")}</span>
                <span>${Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t("Discount", "បញ្ចុះ")}</span>
                  <span>-${Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>{t("Shipping", "ដឹក")}</span>
                <span>{t("Free", "ឥតគិតថ្លៃ")}</span>
              </div>
              <div className="border-t pt-2.5 flex justify-between font-bold text-base">
                <span>{t("Total", "សរុប")}</span>
                <span className="text-primary">${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      </RootLayout>
    </ProtectedRoute>
  );
}
