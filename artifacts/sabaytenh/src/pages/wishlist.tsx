import { Link } from "wouter";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetWishlist, useRemoveFromWishlist, useAddToCart } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

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
    },
  });

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
        toast({ title: t("Added to cart!", "បានបន្ថែមទៅរទ្ធ!") });
      },
    },
  });

  return (
    <ProtectedRoute>
      <RootLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">
            {t("My Wishlist", "បញ្ជីចង់ទិញ")} {wishlist && wishlist.length > 0 && <span className="text-muted-foreground text-base font-normal">({wishlist.length})</span>}
          </h1>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : !wishlist || wishlist.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-bold mb-2">{t("Your wishlist is empty", "បញ្ជីចង់ទិញទទេ")}</h2>
              <p className="text-muted-foreground mb-6">{t("Save items you love here.", "រក្សាទំនិញដែលអ្នកចូលចិត្ត។")}</p>
              <Link href="/products"><Button>{t("Browse Products", "រកមើល")}</Button></Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {wishlist.map((item: any) => (
                <div key={item.id} className="bg-white dark:bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                  <Link href={`/products/${item.productId}`} className="relative block aspect-square overflow-hidden bg-muted">
                    <img
                      src={item.productImage ?? "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"}
                      alt={item.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.discountPercent && (
                      <Badge className="absolute top-2 left-2 bg-destructive text-white text-xs font-bold border-0">
                        -{item.discountPercent}%
                      </Badge>
                    )}
                  </Link>
                  <div className="p-3">
                    <Link href={`/products/${item.productId}`}>
                      <h3 className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors mb-2">
                        {item.productName}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-primary">${Number(item.price).toFixed(2)}</span>
                      <span className={`text-xs ${item.stock === 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {item.stock === 0 ? t("Out of stock", "អស់") : t("In stock", "មាន")}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-xs gap-1"
                        disabled={item.stock === 0}
                        onClick={() => addToCart.mutate({ data: { productId: item.productId, quantity: 1 } })}
                      >
                        <ShoppingCart className="h-3 w-3" />{t("Add", "បន្ថែម")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => remove.mutate({ productId: item.productId })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </RootLayout>
    </ProtectedRoute>
  );
}
