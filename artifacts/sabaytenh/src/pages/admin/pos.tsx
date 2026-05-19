import { useState, useRef } from "react";
import { Search, Plus, Minus, Trash2, ShoppingBag, CheckCircle2, Printer, RotateCcw, Loader2, Tag, X, Banknote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  useListProducts,
  useListCategories,
  useAddToCart,
  useClearCart,
  useCreateOrder,
  OrderInputPaymentMethod,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PosItem {
  productId: number;
  name: string;
  nameKh?: string | null;
  price: number;
  image?: string | null;
  quantity: number;
}

// ─── Payment methods ──────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { value: OrderInputPaymentMethod.cash,    label: "Cash",         labelKh: "ប្រាក់",    logo: "",                    bg: "bg-green-500" },
  { value: OrderInputPaymentMethod.khqr,    label: "KHQR Bakong",  labelKh: "KHQR",      logo: "/logo-khqr.jpeg",     bg: "bg-blue-600" },
  { value: OrderInputPaymentMethod.aba,     label: "ABA Bank",     labelKh: "ABA",       logo: "/logo-aba.jpeg",      bg: "bg-blue-500" },
  { value: OrderInputPaymentMethod.acleda,  label: "ACLEDA",       labelKh: "ACLEDA",    logo: "/logo-acleda.jpeg",   bg: "bg-red-500" },
  { value: OrderInputPaymentMethod.canadia, label: "Vatanak",      labelKh: "វត្តនៈ",        logo: "/logo-vatanak.jpeg",  bg: "bg-emerald-500" },
  { value: OrderInputPaymentMethod.wing,    label: "Wing Money",   labelKh: "Wing",      logo: "/logo-wing.jpeg",     bg: "bg-purple-500" },
];

// ─── Real QR image map ────────────────────────────────────────────────────────
const QR_IMAGES: Partial<Record<string, string>> = {
  [OrderInputPaymentMethod.khqr]:    "/qr-khqr.jpeg",
  [OrderInputPaymentMethod.aba]:     "/qr-aba.jpeg",
  [OrderInputPaymentMethod.acleda]:  "/qr-acleda.jpeg",
  [OrderInputPaymentMethod.wing]:    "/qr-wing.jpeg",
  [OrderInputPaymentMethod.canadia]: "/qr-vatanak.png",
};

// ─── Receipt Modal ────────────────────────────────────────────────────────────
function ReceiptModal({
  items, total, paymentMethod, orderNumber, cashier, onClose,
}: {
  items: PosItem[]; total: number; paymentMethod: string; orderNumber: number; cashier: string; onClose: () => void;
}) {
  const { t } = useLanguage();
  const method = PAYMENT_METHODS.find(m => m.value === paymentMethod);
  const isQR = paymentMethod !== OrderInputPaymentMethod.cash;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Success header */}
        <div className="bg-green-500 p-5 text-white text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-2" />
          <h2 className="text-xl font-bold">{t("Sale Complete!", "ការលក់បានជោគជ័យ!")}</h2>
          <p className="text-white/80 text-sm">#{String(orderNumber).padStart(6, "0")}</p>
        </div>

        {/* Receipt body */}
        <div className="p-5 font-mono text-xs">
          <div className="text-center mb-3">
            <p className="font-bold text-base font-sans">SabayTenh</p>
            <p className="text-muted-foreground">សប្បាយទិញ — POS</p>
            <p className="text-muted-foreground">{new Date().toLocaleString()}</p>
            <p className="text-muted-foreground">{t("Cashier:", "អ្នកគិតប្រាក់:")} {cashier}</p>
          </div>
          <div className="border-t border-dashed border-muted-foreground/30 my-2" />
          <div className="space-y-1">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="flex-1 truncate">{item.name} x{item.quantity}</span>
                <span className="ml-2 flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-muted-foreground/30 my-2" />
          <div className="flex justify-between font-bold text-sm font-sans">
            <span>{t("TOTAL", "សរុប")}</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground mt-0.5">
            <span>{t("Payment", "ការទូទាត់")}</span>
            <span className="flex items-center gap-1">
              {method?.logo
                ? <img src={method.logo} alt={method.label} className="w-4 h-4 rounded object-cover" />
                : null}
              <span className="font-medium text-foreground">{method?.label}</span>
            </span>
          </div>

          {isQR && QR_IMAGES[paymentMethod] && (
            <div className="flex flex-col items-center mt-3">
              <img
                src={QR_IMAGES[paymentMethod]}
                alt="Payment QR"
                className="w-36 h-36 object-contain rounded-lg border border-muted"
              />
              <p className="text-muted-foreground mt-1 text-center">
                {t("Scan to confirm payment", "ស្កែនដើម្បីបញ្ជាក់ការទូទាត់")}
              </p>
            </div>
          )}

          <div className="border-t border-dashed border-muted-foreground/30 my-2" />
          <p className="text-center text-muted-foreground">{t("Thank you for shopping!", "អរគុណសម្រាប់ការទិញ!")}</p>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <Button variant="outline" className="flex-1 gap-1 text-sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />{t("Print", "បោះពុម្ព")}
          </Button>
          <Button className="flex-1 gap-1 text-sm" onClick={onClose}>
            <RotateCcw className="h-4 w-4" />{t("New Sale", "លក់ថ្មី")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main POS Page ────────────────────────────────────────────────────────────
export default function POSPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [posItems, setPosItems] = useState<PosItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<OrderInputPaymentMethod>(OrderInputPaymentMethod.cash);
  const [customerName, setCustomerName] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<{ orderId: number; items: PosItem[]; total: number; paymentMethod: string } | null>(null);

  const { data: productData } = useListProducts({ page: 1, limit: 40, search: search || undefined, categoryId: categoryId ?? undefined });
  const { data: categories } = useListCategories();

  const clearCartMut = useClearCart({ mutation: {} });
  const addToCartMut = useAddToCart({ mutation: {} });
  const createOrderMut = useCreateOrder({
    mutation: {
      onSuccess: (order) => {
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
      },
    },
  });

  // ── Cart helpers ────────────────────────────────────────────────────────────
  const addItem = (p: any) => {
    setPosItems(prev => {
      const existing = prev.find(i => i.productId === p.id);
      if (existing) return prev.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: p.id, name: p.name, nameKh: p.nameKh, price: Number(p.price), image: p.image, quantity: 1 }];
    });
  };

  const removeItem = (productId: number) => setPosItems(prev => prev.filter(i => i.productId !== productId));

  const setQty = (productId: number, qty: number) => {
    if (qty <= 0) removeItem(productId);
    else setPosItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const clearAll = () => { setPosItems([]); setCustomerName(""); setDiscountPct(0); };

  // ── Totals ──────────────────────────────────────────────────────────────────
  const subtotal = posItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmt = subtotal * (discountPct / 100);
  const grandTotal = subtotal - discountAmt;

  // ── Process sale ────────────────────────────────────────────────────────────
  const handleSale = async () => {
    if (posItems.length === 0) {
      toast({ title: t("Add at least one product.", "បន្ថែមផលិតផលយ៉ាងហោចណាស់មួយ។"), variant: "destructive" });
      return;
    }
    setProcessing(true);
    try {
      await clearCartMut.mutateAsync();
      for (const item of posItems) {
        await addToCartMut.mutateAsync({ data: { productId: item.productId, quantity: item.quantity } });
      }
      const shippingAddress = customerName ? `POS — ${customerName}` : "POS — Walk-in Customer";
      const order = await createOrderMut.mutateAsync({ data: { shippingAddress, paymentMethod } });
      setReceipt({ orderId: order.id, items: posItems, total: grandTotal, paymentMethod });
    } catch (err) {
      toast({ title: t("Sale failed. Please try again.", "ការលក់បរាជ័យ។ សូមព្យាយាម​ម្ដង​ទៀត។"), variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleReceiptClose = () => { setReceipt(null); clearAll(); };

  return (
    <ProtectedRoute allowedRoles={["admin", "cashier"]}>
      <AdminLayout>
        {receipt && (
          <ReceiptModal
            items={receipt.items}
            total={receipt.total}
            paymentMethod={receipt.paymentMethod}
            orderNumber={receipt.orderId}
            cashier={user?.name ?? "—"}
            onClose={handleReceiptClose}
          />
        )}

        <div className="flex gap-4 h-[calc(100vh-6rem)]">
          {/* ── LEFT: Product browser ──────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex gap-2 mb-3 flex-wrap">
              <div className="relative flex-1 min-w-40">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t("Search products...", "ស្វែងរកផលិតផល...")}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            {/* Category pills */}
            <div className="flex gap-1.5 flex-wrap mb-3">
              <button
                onClick={() => setCategoryId(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${!categoryId ? "bg-primary text-white border-primary" : "border-border hover:bg-muted text-muted-foreground"}`}
              >
                {t("All", "ទាំងអស់")}
              </button>
              {(categories ?? []).map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${categoryId === c.id ? "bg-primary text-white border-primary" : "border-border hover:bg-muted text-muted-foreground"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Product grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {(productData?.products ?? []).map((p: any) => {
                  const inCart = posItems.find(i => i.productId === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => addItem(p)}
                      className={`relative text-left border rounded-xl p-2.5 transition-all hover:shadow-md active:scale-95 ${inCart ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-white dark:bg-card"}`}
                    >
                      <img
                        src={p.image ?? "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=80"}
                        alt={p.name}
                        className="w-full aspect-square object-cover rounded-lg mb-1.5 bg-muted"
                      />
                      <p className="text-xs font-medium line-clamp-2 leading-tight">{p.name}</p>
                      <p className="text-xs font-bold text-primary mt-0.5">${Number(p.price).toFixed(2)}</p>
                      {p.stock <= 0 && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-card/80 rounded-xl flex items-center justify-center">
                          <span className="text-[10px] text-destructive font-bold">{t("Out of Stock", "អស់")}</span>
                        </div>
                      )}
                      {inCart && (
                        <div className="absolute top-1.5 right-1.5 bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {inCart.quantity}
                        </div>
                      )}
                    </button>
                  );
                })}
                {productData?.products.length === 0 && (
                  <div className="col-span-full text-center py-16 text-muted-foreground text-sm">
                    {t("No products found", "រកមិនឃើញ")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Order ticket ─────────────────────────────────────── */}
          <div className="w-72 xl:w-80 flex flex-col bg-white dark:bg-card border rounded-2xl overflow-hidden flex-shrink-0">
            {/* Header */}
            <div className="bg-primary px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" /> {t("Order", "ការបញ្ជា")}
                </h2>
                {posItems.length > 0 && (
                  <button onClick={clearAll} className="text-white/70 hover:text-white transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Input
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder={t("Customer name (optional)", "ឈ្មោះអតិថិជន (ស្រេចចិត្ត)")}
                className="mt-2 h-7 text-xs bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30"
              />
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
              {posItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">{t("Tap a product to add it", "ចុចផលិតផលដើម្បីបន្ថែម")}</p>
                </div>
              ) : (
                posItems.map(item => (
                  <div key={item.productId} className="flex items-center gap-2 py-1.5 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-1">{item.name}</p>
                      <p className="text-xs text-primary font-semibold">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                      <button onClick={() => setQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                      <button onClick={() => removeItem(item.productId)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-3 space-y-3">
              {/* Discount */}
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="text-xs text-muted-foreground">{t("Discount", "បញ្ចុះ")}</span>
                <div className="flex gap-1 ml-auto">
                  {[0, 5, 10, 15, 20].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setDiscountPct(pct)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${discountPct === pct ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                    >
                      {pct === 0 ? "OFF" : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("Subtotal", "តម្លៃរង")} ({posItems.reduce((s, i) => s + i.quantity, 0)} {t("items", "ចំណែក")})</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discountAmt > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>{t("Discount", "បញ្ចុះ")} ({discountPct}%)</span>
                    <span>-${discountAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1 border-t">
                  <span>{t("TOTAL", "សរុប")}</span>
                  <span className="text-primary">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("Payment", "ការទូទាត់")}</Label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setPaymentMethod(m.value)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg border-2 transition-all ${paymentMethod === m.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
                      {m.logo
                        ? <img src={m.logo} alt={m.label} className="w-7 h-7 rounded-md object-cover" />
                        : <Banknote className="h-5 w-5 text-green-600" />}
                      <span className="text-[10px] font-medium leading-tight text-center">{t(m.label, m.labelKh)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Process button */}
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleSale}
                disabled={processing || posItems.length === 0}
              >
                {processing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{t("Processing...", "កំពុង...")}</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" />{t("Charge", "គិតប្រាក់")} ${grandTotal.toFixed(2)}</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
