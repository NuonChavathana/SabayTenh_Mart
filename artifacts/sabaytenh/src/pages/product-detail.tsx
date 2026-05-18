import { useState } from "react";
import { useParams, Link } from "wouter";
import { ShoppingCart, Heart, Star, Package, Truck, Shield, Plus, Minus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { RootLayout } from "@/components/layout/RootLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetProduct,
  useAddToCart,
  useAddToWishlist,
  useCreateReview,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);

  const { data: product, isLoading } = useGetProduct(Number(id));

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
        toast({ title: t("Added to cart!", "បានបន្ថែមទៅរទ្ធ!") });
      },
    },
  });

  const addToWishlist = useAddToWishlist({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/wishlist"] });
        toast({ title: t("Added to wishlist!", "បានបន្ថែម!") });
      },
    },
  });

  const createReview = useCreateReview({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`/api/products/${id}`] });
        setReviewComment("");
        toast({ title: t("Review submitted!", "បានដាក់ការវាយតម្លៃ!") });
      },
      onError: () => {
        toast({ title: t("Could not submit review.", "មិនអាចដាក់ការវាយតម្លៃ។"), variant: "destructive" });
      },
    },
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast({ title: t("Please login first", "សូមចូលជាមុន"), variant: "destructive" });
      return;
    }
    addToCart.mutate({ data: { productId: Number(id), quantity: qty } });
  };

  if (isLoading) {
    return (
      <RootLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </RootLayout>
    );
  }

  if (!product) {
    return (
      <RootLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">{t("Product not found.", "រកមិនឃើញផលិតផល។")}</p>
          <Link href="/products"><Button className="mt-4">{t("Back to Products", "ត្រឡប់ទៅផលិតផល")}</Button></Link>
        </div>
      </RootLayout>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600"];

  return (
    <RootLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
          <Link href="/" className="hover:text-primary">{t("Home", "ទំព័រដើម")}</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary">{t("Products", "ផលិតផល")}</Link>
          {product.categoryName && (
            <>
              <span>/</span>
              <span>{product.categoryName}</span>
            </>
          )}
          <span>/</span>
          <span className="text-foreground line-clamp-1">{t(product.name, product.nameKh ?? product.name)}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square rounded-xl overflow-hidden bg-muted border">
              <img
                src={images[selectedImg]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImg ? "border-primary" : "border-transparent"}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {product.brandName && <p className="text-sm text-muted-foreground mb-1">{product.brandName}</p>}
            <h1 className="text-2xl font-bold mb-1">{t(product.name, product.nameKh ?? product.name)}</h1>
            {product.nameKh && <p className="text-muted-foreground mb-3">{product.nameKh}</p>}

            {product.rating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(Number(product.rating)) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  ))}
                </div>
                <span className="text-sm font-medium">{Number(product.rating).toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({product.reviewCount} {t("reviews", "ការវាយតម្លៃ")})</span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-primary">${Number(product.price).toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">${Number(product.originalPrice).toFixed(2)}</span>
              )}
              {product.discountPercent && (
                <Badge className="bg-destructive text-white border-0">-{product.discountPercent}%</Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Package className="h-4 w-4 text-muted-foreground" />
              {product.stock > 0 ? (
                <span className={`text-sm ${product.stock < 10 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {product.stock < 10 ? `${t("Only", "សល់")} ${product.stock} ${t("left!", "ចំណែក!")}` : `${product.stock} ${t("in stock", "ក្នុងស្តុក")}`}
                </span>
              ) : (
                <span className="text-sm text-destructive font-medium">{t("Out of Stock", "អស់ស្តុក")}</span>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{product.description}</p>
            )}

            {product.tags && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {product.tags.split(",").map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag.trim()}</Badge>
                ))}
              </div>
            )}

            {product.stock > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center border rounded-lg">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-2 hover:bg-muted transition-colors rounded-l-lg">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 font-medium text-sm min-w-[3rem] text-center">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="p-2 hover:bg-muted transition-colors rounded-r-lg">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm text-muted-foreground">{t("Total:", "សរុប:")} <strong>${(Number(product.price) * qty).toFixed(2)}</strong></span>
              </div>
            )}

            <div className="flex gap-3">
              <Button className="flex-1 gap-2" disabled={product.stock === 0 || addToCart.isPending} onClick={handleAddToCart}>
                <ShoppingCart className="h-4 w-4" />
                {product.stock === 0 ? t("Out of Stock", "អស់ស្តុក") : t("Add to Cart", "បន្ថែមទៅរទ្ធ")}
              </Button>
              {isAuthenticated && (
                <Button variant="outline" size="icon" onClick={() => addToWishlist.mutate({ productId: product.id })}>
                  <Heart className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex gap-4 mt-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" />{t("Fast Delivery", "ដឹកជញ្ជូនលឿន")}</div>
              <div className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" />{t("Secure Payment", "ទូទាត់សុវត្ថិភាព")}</div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white dark:bg-card border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-6">{t("Customer Reviews", "ការវាយតម្លៃ")} ({product.reviewCount ?? 0})</h2>

          {isAuthenticated && (
            <div className="mb-6 p-4 bg-muted/50 rounded-xl">
              <h3 className="font-medium mb-3">{t("Write a Review", "សរសេរការវាយតម្លៃ")}</h3>
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onMouseEnter={() => setHoveredStar(s)} onMouseLeave={() => setHoveredStar(0)} onClick={() => setReviewRating(s)}>
                    <Star className={`h-6 w-6 cursor-pointer ${s <= (hoveredStar || reviewRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder={t("Share your experience...", "ចែករំលែកបទពិសោធន៍...")}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="mb-3 text-sm"
                rows={3}
              />
              <Button
                size="sm"
                onClick={() => createReview.mutate({ id: Number(id), data: { rating: reviewRating, comment: reviewComment } })}
                disabled={createReview.isPending}
              >
                {t("Submit Review", "ដាក់ការវាយតម្លៃ")}
              </Button>
            </div>
          )}

          {product.reviews && product.reviews.length > 0 ? (
            <div className="space-y-4">
              {product.reviews.map((review: any) => (
                <div key={review.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {review.userName?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div>
                      <span className="font-medium text-sm">{review.userName ?? t("Anonymous", "អ익名")}</span>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground ml-11">{review.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("No reviews yet. Be the first!", "មិនទាន់មានការវាយតម្លៃ!")}</p>
          )}
        </div>
      </div>
    </RootLayout>
  );
}
