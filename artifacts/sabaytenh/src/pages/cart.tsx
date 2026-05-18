import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X, Truck, Percent } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { RootLayout } from "@/components/layout/RootLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const PROMO_CODES: Record<string, { type: "percent" | "flat"; value: number; label: string }> = {
  SAVE10:   { type: "percent", value: 10, label: "10% off your order" },
  WELCOME5: { type: "flat",    value: 5,  label: "$5 off your order" },
  FREESHIP: { type: "flat",    value: 0,  label: "Free shipping" },
  KHMER20:  { type: "percent", value: 20, label: "20% off for Khmer Rouge day" },
  STUDENT:  { type: "percent", value: 15, label: "15% student discount" },
};

const DELIVERY_FREE_THRESHOLD = 30;
const DELIVERY_FEE = 3.00;

export default function CartPage() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; type: "percent" | "flat"; value: number; label: string } | null>(null);

  const { data: cart, isLoading } = useGetCart({
    query: { enabled: isAuthenticated, queryKey: ["/api/cart"] },
  });

  const updateItem = useUpdateCartItem({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/cart"] }) },
  });

  const removeItem = useRemoveCartItem({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
        toast({ title: t("Item removed", "បានដកចេញ") });
      },
    },
  });

  const clearCart = useClearCart({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
        toast({ title: t("Cart cleared", "រទ្ធត្រូវបានសម្អាត") });
      },
    },
  });

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    const promo = PROMO_CODES[code];
    if (!promo) {
      toast({ title: t("Invalid promo code.", "លេខកូដប្រូម៉ូមិនត្រឹមត្រូវ។"), variant: "destructive" });
      return;
    }
    setAppliedPromo({ code, ...promo });
    setPromoInput("");
    toast({ title: t(`Promo applied: ${promo.label}`, `ប្រូម៉ូបានអនុវត្ត: ${promo.label}`) });
  };

  const removePromo = () => {
    setAppliedPromo(null);
    toast({ title: t("Promo code removed", "លេខកូដប្រូម៉ូបានដកចេញ") });
  };

  if (!isAuthenticated) {
    return (
      <RootLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t("Please sign in", "សូមចូលគណនី")}</h2>
          <p className="text-muted-foreground mb-6">{t("Sign in to view your cart.", "ចូលដើម្បីមើលរទ្ធ.")}</p>
          <Link href="/login"><Button>{t("Sign In", "ចូលគណនី")}</Button></Link>
        </div>
      </RootLayout>
    );
  }

  if (isLoading) {
    return (
      <RootLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </RootLayout>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;
  const subtotal = Number(cart?.subtotal ?? 0);
  const cartDiscount = Number(cart?.discount ?? 0);
  const afterCartDiscount = subtotal - cartDiscount;

  // Promo code discount
  let promoDiscount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === "percent") {
      promoDiscount = afterCartDiscount * (appliedPromo.value / 100);
    } else {
      promoDiscount = Math.min(appliedPromo.value, afterCartDiscount);
    }
  }

  const afterPromo = afterCartDiscount - promoDiscount;
  const deliveryFee = (appliedPromo?.code === "FREESHIP" || afterPromo >= DELIVERY_FREE_THRESHOLD) ? 0 : DELIVERY_FEE;
  const grandTotal = afterPromo + deliveryFee;
  const totalSavings = cartDiscount + promoDiscount;

  return (
    <RootLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {t("Shopping Cart", "រទ្ធទំនិញ")}{" "}
            {!isEmpty && <span className="text-muted-foreground text-base font-normal">({cart!.itemCount} {t("items", "ចំណែក")})</span>}
          </h1>
          {!isEmpty && (
            <Button
              variant="ghost" size="sm"
              className="text-destructive hover:text-destructive gap-1"
              onClick={() => clearCart.mutate()}
            >
              <Trash2 className="h-4 w-4" />{t("Clear All", "សម្អាតទាំងអស់")}
            </Button>
          )}
        </div>

        {isEmpty ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{t("Your cart is empty", "រទ្ធរបស់អ្នកទទេ")}</h2>
            <p className="text-muted-foreground mb-6">{t("Start shopping to add items!", "ចាប់ផ្ដើមទិញដើម្បីបន្ថែមទំនិញ!")}</p>
            <Link href="/products"><Button size="lg">{t("Browse Products", "រកមើលផលិតផល")}</Button></Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Items list */}
            <div className="md:col-span-2 space-y-3">
              {cart!.items.map(item => {
                const lineTotal = Number(item.price) * item.quantity;
                return (
                  <div key={item.id} className="bg-white dark:bg-card border rounded-xl p-4">
                    <div className="flex gap-4 items-start">
                      <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                        <img
                          src={item.productImage ?? "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120"}
                          alt={item.productName}
                          className="w-20 h-20 rounded-lg object-cover bg-muted"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.productId}`}>
                          <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors leading-snug">{item.productName}</h3>
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-semibold text-primary">${Number(item.price).toFixed(2)}</span>
                        </div>
                        {/* Quantity + remove row */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border rounded-lg bg-muted/30">
                            <button
                              onClick={() => {
                                if (item.quantity <= 1) removeItem.mutate({ itemId: item.id });
                                else updateItem.mutate({ itemId: item.id, data: { quantity: item.quantity - 1 } });
                              }}
                              className="p-2 hover:bg-muted transition-colors rounded-l-lg"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-4 py-1.5 text-sm font-semibold min-w-[2.5rem] text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateItem.mutate({ itemId: item.id, data: { quantity: item.quantity + 1 } })}
                              className="p-2 hover:bg-muted transition-colors rounded-r-lg"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold">${lineTotal.toFixed(2)}</span>
                            <button
                              onClick={() => removeItem.mutate({ itemId: item.id })}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Promo Code */}
              <div className="bg-white dark:bg-card border rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  {t("Promo Code", "លេខកូដបញ្ចុះតម្លៃ")}
                </h3>
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700 dark:text-green-400">{appliedPromo.code}</span>
                      <span className="text-xs text-green-600 dark:text-green-500">— {appliedPromo.label}</span>
                    </div>
                    <button onClick={removePromo} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value)}
                      placeholder={t("Enter code (try SAVE10)", "បញ្ចូលកូដ (ព្យាយាម SAVE10)")}
                      className="h-9 text-sm uppercase"
                      onKeyDown={e => e.key === "Enter" && applyPromo()}
                    />
                    <Button size="sm" variant="outline" onClick={applyPromo} className="shrink-0 h-9">
                      {t("Apply", "អនុវត្ត")}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {t("Try: SAVE10, WELCOME5, FREESHIP, KHMER20, STUDENT", "ព្យាយាម: SAVE10, WELCOME5, FREESHIP, KHMER20, STUDENT")}
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-3">
              <div className="bg-white dark:bg-card border rounded-xl p-5 sticky top-24">
                <h2 className="font-bold mb-4">{t("Order Summary", "សង្ខេបការបញ្ជាទិញ")}</h2>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("Subtotal", "តម្លៃរង")} ({cart!.itemCount})</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {cartDiscount > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>{t("Product Discounts", "បញ្ចុះតម្លៃ")}</span>
                      <span>-${cartDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {appliedPromo?.code}
                      </span>
                      <span>-${promoDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" /> {t("Delivery", "ដឹកជញ្ជូន")}
                    </span>
                    {deliveryFee === 0 ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">{t("Free", "ឥតគិតថ្លៃ")}</span>
                    ) : (
                      <span>${deliveryFee.toFixed(2)}</span>
                    )}
                  </div>
                  {deliveryFee > 0 && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5">
                      {t(`Add $${(DELIVERY_FREE_THRESHOLD - afterPromo).toFixed(2)} more for free delivery`,
                         `បន្ថែម $${(DELIVERY_FREE_THRESHOLD - afterPromo).toFixed(2)} ទៀតដើម្បីដឹកឥតគិតថ្លៃ`)}
                    </p>
                  )}
                  <div className="border-t pt-2.5 flex justify-between font-bold text-base">
                    <span>{t("Total", "សរុប")}</span>
                    <span className="text-primary">${grandTotal.toFixed(2)}</span>
                  </div>
                  {totalSavings > 0 && (
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 text-center">
                      <p className="text-xs text-green-700 dark:text-green-400 font-semibold">
                        🎉 {t("You save", "អ្នកសន្សំ")} ${totalSavings.toFixed(2)}!
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full mt-5 gap-2" size="lg"
                  onClick={() => navigate("/checkout")}
                >
                  {t("Checkout", "ទទូទាត់")} <ArrowRight className="h-4 w-4" />
                </Button>
                <Link href="/products">
                  <Button variant="ghost" className="w-full mt-2 text-sm">{t("Continue Shopping", "ទិញបន្ត")}</Button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="bg-white dark:bg-card border rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>🔒</span> <span>{t("Secure checkout", "ការទូទាត់មានសុវត្ថិភាព")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>🚚</span> <span>{t("Free delivery over $30", "ដឹកឥតគិតថ្លៃលើសពី $30")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>↩️</span> <span>{t("Easy returns within 7 days", "ការបង្វិលដែលងាយស្រួលក្នុង 7 ថ្ងៃ")}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RootLayout>
  );
}
