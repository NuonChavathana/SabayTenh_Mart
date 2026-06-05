import { Link } from "wouter";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetWishlist,
  useRemoveFromWishlist,
  useAddToCart,
  type Product,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { getProductImageUrl } from "@/lib/images";
import { getDiscountPercent } from "@/lib/discount";

export default function WishlistPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();

  const { data: wishlist, isLoading } = useGetWishlist();

  const remove = useRemoveFromWishlist({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/wishlist"] });
        toast({ title: t("Removed from wishlist", "បានដកចេញ") });
      },
      onError: () => {
        toast({
          title: t("Failed to remove item", "ដកទំនិញចេញមិនបាន"),
          variant: "destructive",
        });
      },
    },
  });

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
        toast({ title: t("Added to cart!", "បានបន្ថែមទៅរទេះ!") });
      },
      onError: () => {
        toast({
          title: t("Failed to add to cart", "បន្ថែមទៅរទេះមិនបាន"),
          variant: "destructive",
        });
      },
    },
  });

  const handleRemove = (item: Product) => {
    remove.mutate({ productId: item.id });
  };

  return (
    <ProtectedRoute>
      <RootLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="mb-6 text-2xl font-bold">
            {t("My Wishlist", "បញ្ជីចង់ទិញ")}{" "}
            {wishlist && wishlist.length > 0 && (
              <span className="text-base font-normal text-muted-foreground">
                ({wishlist.length})
              </span>
            )}
          </h1>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : !wishlist || wishlist.length === 0 ? (
            <div className="py-16 text-center">
              <Heart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h2 className="mb-2 text-lg font-bold">
                {t("Your wishlist is empty", "បញ្ជីចង់ទិញទទេ")}
              </h2>
              <p className="mb-6 text-muted-foreground">
                {t("Save items you love here.", "រក្សាទំនិញដែលអ្នកចូលចិត្ត។")}
              </p>
              <Link href="/products">
                <Button>{t("Browse Products", "រកមើល")}</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {wishlist.map((item) => {
                const discountPercent =
                  getDiscountPercent(
                    Number(item.price),
                    item.originalPrice ? Number(item.originalPrice) : null
                  ) ?? 0;
                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-md dark:bg-card"
                  >
                    <Link
                      href={`/products/${item.id}`}
                      className="group relative block aspect-square overflow-hidden bg-muted"
                    >
                      <img
                        src={getProductImageUrl(item.image)}
                        alt={item.name || "Product"}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {discountPercent > 0 && (
                        <Badge className="absolute left-2 top-2 border-0 bg-destructive text-xs font-bold text-white">
                          -{discountPercent}%
                        </Badge>
                      )}
                    </Link>

                    <div className="p-3">
                      <Link href={`/products/${item.id}`}>
                        <h3 className="mb-2 line-clamp-2 text-sm font-medium transition-colors hover:text-primary">
                          {item.name}
                        </h3>
                      </Link>

                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-bold text-primary">
                          ${Number(item.price || 0).toFixed(2)}
                        </span>

                        <span
                          className={`text-xs ${
                            item.stock === 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.stock === 0
                            ? t("Out of stock", "អស់")
                            : t("In stock", "មាន")}
                        </span>
                      </div>

                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          className="h-7 flex-1 gap-1 text-xs"
                          disabled={item.stock === 0 || addToCart.isPending}
                          onClick={() =>
                            addToCart.mutate({
                              data: {
                                productId: item.id,
                                quantity: 1,
                              },
                            })
                          }
                        >
                          <ShoppingCart className="h-3 w-3" />
                          {t("Add", "បន្ថែម")}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          disabled={remove.isPending}
                          onClick={() => handleRemove(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </RootLayout>
    </ProtectedRoute>
  );
}