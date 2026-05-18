import { useParams, Link } from "wouter";
import { ArrowLeft, Package, MapPin, CreditCard, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetOrder } from "@workspace/api-client-react";
import { StatusBadge } from "./orders";

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

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
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
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

  const stepIndex = STEPS.indexOf(order.status);

  return (
    <ProtectedRoute>
      <RootLayout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Link href="/orders">
            <Button variant="ghost" size="sm" className="gap-2 mb-6">
              <ArrowLeft className="h-4 w-4" />{t("Back to Orders", "ត្រឡប់ទៅការបញ្ជា")}
            </Button>
          </Link>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{t("Order", "ការបញ្ជា")} #{order.id}</h1>
            <StatusBadge status={order.status} />
          </div>

          {/* Progress tracker */}
          {order.status !== "cancelled" && (
            <div className="bg-white dark:bg-card border rounded-xl p-5 mb-4">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 right-0 top-4 h-0.5 bg-muted mx-8" />
                <div
                  className="absolute left-0 top-4 h-0.5 bg-primary mx-8 transition-all"
                  style={{ right: `${(1 - Math.max(0, stepIndex) / (STEPS.length - 1)) * 100}%` }}
                />
                {STEPS.map((step, i) => (
                  <div key={step} className="flex flex-col items-center gap-1 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${i <= stepIndex ? "bg-primary border-primary text-white" : "bg-white dark:bg-card border-muted text-muted-foreground"}`}>
                      {i < stepIndex ? "✓" : i + 1}
                    </div>
                    <span className="text-[10px] text-muted-foreground capitalize hidden sm:block">
                      {t(step, step)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Info */}
          <div className="bg-white dark:bg-card border rounded-xl p-5 mb-4 grid sm:grid-cols-3 gap-4 text-sm">
            <div className="flex gap-2">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">{t("Order Date", "កាលបរិច្ឆេទ")}</p>
                <p className="font-medium">{new Date(order.createdAt ?? "").toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">{t("Delivery To", "ដឹកទៅ")}</p>
                <p className="font-medium">{order.shippingAddress}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">{t("Payment", "ការទូទាត់")}</p>
                <p className="font-medium uppercase">{order.paymentMethod}</p>
                <p className={`text-xs ${order.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"}`}>{order.paymentStatus}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white dark:bg-card border rounded-xl p-5 mb-4">
            <h2 className="font-bold mb-4">{t("Items", "ទំនិញ")}</h2>
            <div className="space-y-3">
              {(order.items ?? []).map((item: any) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {item.productImage && (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">${Number(item.price).toFixed(2)} × {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-sm">${(Number(item.price) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white dark:bg-card border rounded-xl p-5">
            <h2 className="font-bold mb-3">{t("Payment Summary", "សង្ខេបការទូទាត់")}</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("Subtotal", "តម្លៃរង")}</span>
                <span>${Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-secondary">
                  <span>{t("Discount", "បញ្ចុះ")}</span>
                  <span>-${Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>{t("Shipping", "ដឹក")}</span>
                <span>{t("Free", "ឥតគិតថ្លៃ")}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
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
