import { Link, useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { RootLayout } from "@/components/layout/RootLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function CartPage() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const { data: cart, isLoading } = useGetCart({
    query: { enabled: isAuthenticated, queryKey: ["/api/cart"] },
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
        toast({ title: t("Cart cleared", "រទ្ធត្រូវបានសម្អាត") });
      },
    },
  });

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
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </RootLayout>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <RootLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {t("Shopping Cart", "រទ្ធទំនិញ")}{" "}
            {!isEmpty && <span className="text-muted-foreground text-base font-normal">({cart.itemCount})</span>}
          </h1>
          {!isEmpty && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => clearCart.mutate()}
            >
              <Trash2 className="h-4 w-4 mr-1" />{t("Clear All", "សម្អាតទាំងអស់")}
            </Button>
          )}
        </div>

        {isEmpty ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{t("Your cart is empty", "រទ្ធរបស់អ្នកទទេ")}</h2>
            <p className="text-muted-foreground mb-6">{t("Start shopping to add items!", "ចាប់ផ្ដើមទិញដើម្បីបន្ថែមទំនិញ!")}</p>
            <Link href="/products"><Button size="lg">{t("Browse Products", "រកមើលផលិតផល")}</Button></Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="md:col-span-2 space-y-3">
              {cart.items.map(item => (
                <div key={item.id} className="bg-white dark:bg-card border rounded-xl p-4 flex gap-4 items-center">
                  <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                    <img
                      src={item.productImage ?? "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100"}
                      alt={item.productName}
                      className="w-20 h-20 rounded-lg object-cover bg-muted"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.productId}`}>
                      <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">{item.productName}</h3>
                    </Link>
                    <p className="text-sm text-primary font-semibold mt-1">${Number(item.price).toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => removeItem.mutate({ itemId: item.id })}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center border rounded-lg">
                      <button
                        onClick={() => {
                          if (item.quantity <= 1) removeItem.mutate({ itemId: item.id });
                          else updateItem.mutate({ itemId: item.id, data: { quantity: item.quantity - 1 } });
                        }}
                        className="p-1.5 hover:bg-muted transition-colors rounded-l-lg"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-3 py-1.5 text-sm font-medium min-w-[2.5rem] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateItem.mutate({ itemId: item.id, data: { quantity: item.quantity + 1 } })}
                        className="p-1.5 hover:bg-muted transition-colors rounded-r-lg"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">${(Number(item.price) * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white dark:bg-card border rounded-xl p-5 h-fit sticky top-24">
              <h2 className="font-bold mb-4">{t("Order Summary", "សង្ខេបការបញ្ជាទិញ")}</h2>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("Subtotal", "តម្លៃរង")} ({cart.itemCount} {t("items", "ចំណែក")})
                  </span>
                  <span>${Number(cart.subtotal).toFixed(2)}</span>
                </div>
                {Number(cart.discount) > 0 && (
                  <div className="flex justify-between text-secondary">
                    <span>{t("Discount", "បញ្ចុះតម្លៃ")}</span>
                    <span>-${Number(cart.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("Shipping", "ដឹកជញ្ជូន")}</span>
                  <span className="text-secondary">{t("Free", "ឥតគិតថ្លៃ")}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>{t("Total", "សរុប")}</span>
                  <span className="text-primary">${Number(cart.total).toFixed(2)}</span>
                </div>
              </div>
              <Button className="w-full gap-2" size="lg" onClick={() => navigate("/checkout")}>
                {t("Proceed to Checkout", "ទៅទូទាត់")} <ArrowRight className="h-4 w-4" />
              </Button>
              <Link href="/products">
                <Button variant="ghost" className="w-full mt-2 text-sm">{t("Continue Shopping", "ទិញបន្ត")}</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </RootLayout>
  );
}
