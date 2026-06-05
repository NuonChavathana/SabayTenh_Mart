import { Link, useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { RootLayout } from "@/components/layout/RootLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { getProductImageUrl } from "@/lib/images";
import { getDiscountPercent } from "@/lib/discount";
import { useListProducts } from "@workspace/api-client-react";

const DELIVERY_FREE_THRESHOLD = 30;
const DELIVERY_FEE = 3.0;

export default function CartPage() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const { data: cart, isLoading } = useGetCart({
    query: { enabled: isAuthenticated, queryKey: ["/api/cart"] },
  });
  const { data: productData } = useListProducts({
  page: 1,
  limit: 100,
});

  const updateItem = useUpdateCartItem({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/cart"] }),
    },
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
        toast({ title: t("Cart cleared", "រទេះត្រូវបានសម្អាត") });
      },
    },
  });

  if (!isAuthenticated) {
    return (
      <RootLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {t("Please sign in", "សូមចូលគណនី")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("Sign in to view your cart.", "ចូលដើម្បីមើលរទេះរបស់អ្នក។")}
          </p>
          <Link href="/login">
            <Button>{t("Sign In", "ចូលគណនី")}</Button>
          </Link>
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
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
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
  const afterCartDiscount = Math.max(subtotal - cartDiscount, 0);

  const deliveryFee =
    afterCartDiscount >= DELIVERY_FREE_THRESHOLD ? 0 : DELIVERY_FEE;

  const grandTotal = afterCartDiscount + deliveryFee;
  const totalSavings = cartDiscount;

  return (
    <RootLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {t("Shopping Cart", "រទេះទំនិញ")}{" "}
            {!isEmpty && (
              <span className="text-muted-foreground text-base font-normal">
                ({cart!.itemCount} {t("items", "ចំណែក")})
              </span>
            )}
          </h1>

          {!isEmpty && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive gap-1"
              onClick={() => clearCart.mutate()}
            >
              <Trash2 className="h-4 w-4" />
              {t("Clear All", "សម្អាតទាំងអស់")}
            </Button>
          )}
        </div>

        {isEmpty ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">
              {t("Your cart is empty", "រទេះរបស់អ្នកទទេ")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t(
                "Start shopping to add items!",
                "ចាប់ផ្ដើមទិញដើម្បីបន្ថែមទំនិញ!"
              )}
            </p>
            <Link href="/products">
              <Button size="lg">{t("Browse Products", "រកមើលផលិតផល")}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              {cart!.items.map((item) => {
                const lineTotal = Number(item.price) * item.quantity;
                const productInfo = productData?.products.find(
                  (p) => p.id === item.productId
                );

                const discountPercent = getDiscountPercent(
                  Number(item.price),
                  productInfo?.originalPrice ? Number(productInfo.originalPrice) : null
                ) ?? 0;
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-card border rounded-xl p-4"
                  >
                    <div className="flex gap-4 items-start">
                      <Link
                        href={`/products/${item.productId}`}
                        className="relative flex-shrink-0"
                      >
                        {discountPercent > 0 && (
                          <Badge className="absolute left-1.5 top-1.5 z-10 border-0 bg-red-500 text-white text-xs">
                            -{discountPercent}%
                          </Badge>
                        )}
                        <img
                          src={
                            getProductImageUrl(item.productImage)
                          }
                          alt={item.productName}
                          className="w-24 h-24 rounded-xl object-cover bg-muted"
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.productId}`}>
                          <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors leading-snug">
                            {item.productName}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-semibold text-primary">
                            ${Number(item.price).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border rounded-lg bg-muted/30">
                            <button
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  removeItem.mutate({ itemId: item.id });
                                } else {
                                  updateItem.mutate({
                                    itemId: item.id,
                                    data: { quantity: item.quantity - 1 },
                                  });
                                }
                              }}
                              className="p-2 hover:bg-muted transition-colors rounded-l-lg"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>

                            <span className="px-4 py-1.5 text-sm font-semibold min-w-[2.5rem] text-center">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                updateItem.mutate({
                                  itemId: item.id,
                                  data: { quantity: item.quantity + 1 },
                                })
                              }
                              className="p-2 hover:bg-muted transition-colors rounded-r-lg"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold">
                              ${lineTotal.toFixed(2)}
                            </span>

                            <button
                              onClick={() =>
                                removeItem.mutate({ itemId: item.id })
                              }
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
            </div>

            <div className="space-y-3">
              <div className="bg-white dark:bg-card border rounded-xl p-5 sticky top-24">
                <h2 className="font-bold mb-4">
                  {t("Order Summary", "សង្ខេបការបញ្ជាទិញ")}
                </h2>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("Subtotal", "តម្លៃរង")} ({cart!.itemCount})
                    </span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>

                  {cartDiscount > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>{t("Product Discounts", "បញ្ចុះតម្លៃ")}</span>
                      <span>-${cartDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" />
                      {t("Delivery", "ដឹកជញ្ជូន")}
                    </span>

                    {deliveryFee === 0 ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {t("Free", "ឥតគិតថ្លៃ")}
                      </span>
                    ) : (
                      <span>${deliveryFee.toFixed(2)}</span>
                    )}
                  </div>

                  {deliveryFee > 0 && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5">
                      {t(
                        `Add $${(
                          DELIVERY_FREE_THRESHOLD - afterCartDiscount
                        ).toFixed(2)} more for free delivery`,
                        `បន្ថែម $${(
                          DELIVERY_FREE_THRESHOLD - afterCartDiscount
                        ).toFixed(2)} ទៀតដើម្បីដឹកឥតគិតថ្លៃ`
                      )}
                    </p>
                  )}

                  <div className="border-t pt-2.5 flex justify-between font-bold text-base">
                    <span>{t("Total", "សរុប")}</span>
                    <span className="text-primary">
                      ${grandTotal.toFixed(2)}
                    </span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 text-center">
                      <p className="text-xs text-green-700 dark:text-green-400 font-semibold">
                        🎉 {t("You save", "អ្នកសន្សំ")} $
                        {totalSavings.toFixed(2)}!
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full mt-5 gap-2"
                  size="lg"
                  onClick={() => navigate("/checkout")}
                >
                  {t("Checkout", "ទូទាត់")}
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Link href="/products">
                  <Button variant="ghost" className="w-full mt-2 text-sm">
                    {t("Continue Shopping", "ទិញបន្ត")}
                  </Button>
                </Link>
              </div>

              <div className="bg-white dark:bg-card border rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>🔒</span>
                  <span>
                    {t("Secure checkout", "ការទូទាត់មានសុវត្ថិភាព")}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>🚚</span>
                  <span>
                    {t(
                      "Free delivery over $30",
                      "ដឹកឥតគិតថ្លៃលើសពី $30"
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>↩️</span>
                  <span>
                    {t(
                      "Easy returns within 7 days",
                      "ការប្តូរទំនិញងាយស្រួលក្នុង 7 ថ្ងៃ"
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RootLayout>
  );
}