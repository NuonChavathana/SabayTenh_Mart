import { useState } from "react";
import { useLocation } from "wouter";
import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { RootLayout } from "@/components/layout/RootLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useGetCart, useCreateOrder, OrderInputPaymentMethod } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const PAYMENT_METHODS = [
  { value: OrderInputPaymentMethod.khqr, label: "KHQR", icon: "🇰🇭", desc: "Scan QR code with any KHQR app" },
  { value: OrderInputPaymentMethod.aba, label: "ABA Bank", icon: "🏦", desc: "ABA Mobile" },
  { value: OrderInputPaymentMethod.wing, label: "Wing", icon: "💸", desc: "Wing Money" },
  { value: OrderInputPaymentMethod.acleda, label: "ACLEDA", icon: "💳", desc: "ACLEDA Mobile" },
  { value: OrderInputPaymentMethod.cash, label: "Cash on Delivery", icon: "💵", desc: "Pay when delivered" },
];

function QRPaymentSim({ method, amount }: { method: string; amount: number }) {
  const { t } = useLanguage();
  if (method === "cash") return null;
  return (
    <div className="bg-muted/50 rounded-xl p-4 text-center mt-4">
      <div className="text-sm font-medium mb-2">{t("Simulated Payment QR", "QR ទូទាត់ (ក្លែងធ្វើ)")}</div>
      <div className="inline-block bg-white p-3 rounded-xl border-2 border-primary/20 mb-2">
        <div className="w-24 h-24 grid grid-cols-6 gap-0.5">
          {Array(36).fill(0).map((_, i) => (
            <div key={i} className={`rounded-sm ${(i * 7 + 3) % 5 > 2 ? "bg-gray-900" : "bg-white"}`} />
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t("Scan to pay", "ស្កែន")} ${amount.toFixed(2)} {t("via", "តាម")} {method.toUpperCase()}</p>
      <p className="text-xs text-green-600 mt-1">✓ {t("Payment simulated — click Place Order", "ការទូទាត់ត្រូវបានក្លែងធ្វើ — ចុចដាក់ការបញ្ជា")}</p>
    </div>
  );
}

export default function CheckoutPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<OrderInputPaymentMethod>(OrderInputPaymentMethod.khqr);
  const [showQR, setShowQR] = useState(false);

  const { data: cart } = useGetCart();
  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: (order) => {
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
        toast({ title: t("Order placed successfully!", "ការបញ្ជាទិញបានជោគជ័យ!") });
        navigate(`/orders/${order.id}`);
      },
      onError: () => {
        toast({ title: t("Failed to place order.", "ការបញ្ជាទិញបរាជ័យ។"), variant: "destructive" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      toast({ title: t("Please enter delivery address.", "សូមបញ្ចូលអាសយដ្ឋានដឹក។"), variant: "destructive" });
      return;
    }
    if (paymentMethod !== OrderInputPaymentMethod.cash && !showQR) {
      setShowQR(true);
      return;
    }
    createOrder.mutate({
      data: {
        shippingAddress: address,
        paymentMethod,
      },
    });
  };

  if (!cart || cart.items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <ProtectedRoute>
      <RootLayout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <h1 className="text-2xl font-bold mb-6">{t("Checkout", "ការទូទាត់")}</h1>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              {/* Shipping */}
              <div className="bg-white dark:bg-card border rounded-xl p-5">
                <h2 className="font-bold mb-4">{t("Delivery Address", "អាសយដ្ឋានដឹក")}</h2>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name-display">{t("Name", "ឈ្មោះ")}</Label>
                    <Input id="name-display" value={user?.name ?? ""} disabled className="bg-muted/50" />
                  </div>
                  <div>
                    <Label htmlFor="address">{t("Address", "អាសយដ្ឋាន")} *</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t("Street, City, Province", "ផ្លូវ, ទីក្រុង, ខេត្ត")}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white dark:bg-card border rounded-xl p-5">
                <h2 className="font-bold mb-4">{t("Payment Method", "វិធីសាស្ត្រទូទាត់")}</h2>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => { setPaymentMethod(v as OrderInputPaymentMethod); setShowQR(false); }}
                >
                  <div className="space-y-2">
                    {PAYMENT_METHODS.map(m => (
                      <div key={m.value} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === m.value ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}>
                        <RadioGroupItem value={m.value} id={m.value} />
                        <Label htmlFor={m.value} className="cursor-pointer flex items-center gap-2 flex-1">
                          <span className="text-xl">{m.icon}</span>
                          <div>
                            <div className="font-medium text-sm">{m.label}</div>
                            <div className="text-xs text-muted-foreground">{m.desc}</div>
                          </div>
                        </Label>
                        {paymentMethod === m.value && <Check className="h-4 w-4 text-primary ml-auto" />}
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {showQR && paymentMethod !== OrderInputPaymentMethod.cash && (
                  <QRPaymentSim method={paymentMethod} amount={Number(cart.total)} />
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-white dark:bg-card border rounded-xl p-5">
                <h2 className="font-bold mb-4">{t("Order Summary", "សង្ខេបការបញ្ជា")}</h2>
                <div className="space-y-2 mb-4">
                  {cart.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground line-clamp-1 flex-1 mr-4">{item.productName} × {item.quantity}</span>
                      <span>${(Number(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("Shipping", "ដឹក")}</span>
                    <span className="text-secondary">{t("Free", "ឥតគិតថ្លៃ")}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base">
                    <span>{t("Total", "សរុប")}</span>
                    <span className="text-primary">${Number(cart.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={createOrder.isPending}>
                {createOrder.isPending
                  ? t("Placing Order...", "កំពុងដាក់ការបញ្ជា...")
                  : paymentMethod !== OrderInputPaymentMethod.cash && !showQR
                  ? t("Continue to Payment", "បន្តទៅការទូទាត់")
                  : t("Place Order", "ដាក់ការបញ្ជា")}
              </Button>
            </div>
          </form>
        </div>
      </RootLayout>
    </ProtectedRoute>
  );
}
