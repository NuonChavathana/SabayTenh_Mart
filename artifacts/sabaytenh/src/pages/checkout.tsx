import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Check, ChevronRight, Truck, CreditCard, Tag, X, Percent, ShieldCheck, Clock, CheckCircle2, Loader2 } from "lucide-react";
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

// ─── Promo codes (same as cart page) ──────────────────────────────────────────
const PROMO_CODES: Record<string, { type: "percent" | "flat"; value: number; label: string }> = {
  SAVE10:   { type: "percent", value: 10, label: "10% off" },
  WELCOME5: { type: "flat",    value: 5,  label: "$5 off" },
  FREESHIP: { type: "flat",    value: 0,  label: "Free shipping" },
  KHMER20:  { type: "percent", value: 20, label: "20% off" },
  STUDENT:  { type: "percent", value: 15, label: "15% off" },
};
const DELIVERY_FREE_THRESHOLD = 30;
const DELIVERY_FEE = 3.00;

// ─── Payment config ───────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    value: OrderInputPaymentMethod.khqr,
    label: "KHQR",
    labelKh: "ខេ អេច គ្យូអ អ",
    desc: "Any KHQR-compatible app",
    descKh: "ស្កែនដោយ app KHQR ណាមួយ",
    icon: "🇰🇭",
    color: "from-blue-700 to-red-600",
    bg: "bg-gradient-to-br from-blue-700 to-red-600",
    textColor: "text-white",
    badge: "National QR",
  },
  {
    value: OrderInputPaymentMethod.aba,
    label: "ABA Bank",
    labelKh: "ធនាគារ ABA",
    desc: "ABA Mobile Banking",
    descKh: "ABA Mobile Banking",
    icon: "🏦",
    color: "from-blue-500 to-blue-700",
    bg: "bg-gradient-to-br from-blue-500 to-blue-700",
    textColor: "text-white",
    badge: "Most Popular",
  },
  {
    value: OrderInputPaymentMethod.acleda,
    label: "ACLEDA",
    labelKh: "អេ ស ីអិល អ ី ឌី អេ",
    desc: "ACLEDA Mobile",
    descKh: "ACLEDA Mobile",
    icon: "💳",
    color: "from-red-500 to-red-700",
    bg: "bg-gradient-to-br from-red-500 to-red-700",
    textColor: "text-white",
    badge: "",
  },
  {
    value: OrderInputPaymentMethod.canadia,
    label: "Canadia Bank",
    labelKh: "ធនាគារ ខេណាឌីយ៉ា",
    desc: "Canadia Mobile",
    descKh: "Canadia Mobile",
    icon: "🏛️",
    color: "from-emerald-500 to-emerald-700",
    bg: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    textColor: "text-white",
    badge: "",
  },
  {
    value: OrderInputPaymentMethod.wing,
    label: "Wing Money",
    labelKh: "Wing Money",
    desc: "Wing Mobile Wallet",
    descKh: "Wing Mobile Wallet",
    icon: "💸",
    color: "from-purple-500 to-purple-700",
    bg: "bg-gradient-to-br from-purple-500 to-purple-700",
    textColor: "text-white",
    badge: "",
  },
  {
    value: OrderInputPaymentMethod.cash,
    label: "Cash on Delivery",
    labelKh: "បង់ប្រាក់នៅពេលទទួលទំនិញ",
    desc: "Pay when delivered",
    descKh: "បង់ប្រាក់នៅពេលទទួលទំនិញ",
    icon: "💵",
    color: "from-green-500 to-green-700",
    bg: "bg-gradient-to-br from-green-500 to-green-700",
    textColor: "text-white",
    badge: "",
  },
];

// ─── Real bank QR image map ────────────────────────────────────────────────────
const QR_IMAGES: Partial<Record<string, string>> = {
  [OrderInputPaymentMethod.aba]:    "/qr-aba.jpeg",
  [OrderInputPaymentMethod.acleda]: "/qr-acleda.jpeg",
  [OrderInputPaymentMethod.wing]:   "/qr-wing.jpeg",
  [OrderInputPaymentMethod.khqr]:   "/qr-khqr.jpeg",
};

// ─── Payment QR Modal ─────────────────────────────────────────────────────────
function PaymentModal({
  method,
  amount,
  onConfirm,
  onCancel,
  isPending,
}: {
  method: typeof PAYMENT_METHODS[0];
  amount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState(300); // 5 min
  const [simulating, setSimulating] = useState(false);
  const [paid, setPaid] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(intervalRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const mins = String(Math.floor(countdown / 60)).padStart(2, "0");
  const secs = String(countdown % 60).padStart(2, "0");

  const handleSimulatePay = () => {
    setSimulating(true);
    setTimeout(() => { setSimulating(false); setPaid(true); }, 1800);
  };

  const handlePlaceOrder = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    onConfirm();
  };

  if (method.value === OrderInputPaymentMethod.cash) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💵</span>
          </div>
          <h2 className="text-xl font-bold mb-2">{t("Cash on Delivery", "បង់ប្រាក់នៅពេលទទួលទំនិញ")}</h2>
          <p className="text-muted-foreground text-sm mb-2">
            {t("Please prepare", "សូមរៀបចំ")} <span className="font-bold text-foreground text-lg">${amount.toFixed(2)}</span>
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            {t("Our delivery staff will collect payment when your order arrives.", "បុគ្គលិកដឹកជញ្ជូននឹងប្រមូលប្រាក់នៅពេលទំនិញមកដល់។")}
          </p>
          <Button className="w-full mb-2" size="lg" onClick={handlePlaceOrder} disabled={isPending}>
            {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("Placing...", "កំពុង...")}</> : t("Place Order", "ដាក់ការបញ្ជា")}
          </Button>
          <Button variant="ghost" className="w-full text-sm" onClick={onCancel}>{t("Cancel", "បោះបង់")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className={`${method.bg} p-5 text-white`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wider">{t("Payment to", "ទូទាត់ទៅ")}</p>
              <p className="text-xl font-bold">SabayTenh</p>
              <p className="text-xs text-white/70">សប្បាយទិញ</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">${amount.toFixed(2)}</p>
              <p className="text-white/70 text-xs">{t("USD", "ដុល្លារ")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
            <Clock className="h-3.5 w-3.5 text-white/80" />
            <span className="text-white text-sm font-mono">{mins}:{secs}</span>
            <span className="text-white/70 text-xs">{t("remaining", "នៅសល់")}</span>
          </div>
        </div>

        <div className="p-5">
          {paid ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-green-700 dark:text-green-400 mb-1">{t("Payment Received!", "ទទួលបានការទូទាត់!")}</h3>
              <p className="text-sm text-muted-foreground mb-5">
                {t("Your payment has been confirmed. Click below to place your order.", "ការទូទាត់ត្រូវបានបញ្ជាក់។ ចុចខាងក្រោមដើម្បីដាក់ការបញ្ជា។")}
              </p>
              <Button className="w-full gap-2" size="lg" onClick={handlePlaceOrder} disabled={isPending}>
                {isPending ? <><Loader2 className="h-4 w-4 animate-spin" />{t("Placing...", "កំពុង...")}</> : <><CheckCircle2 className="h-4 w-4" />{t("Confirm Order", "បញ្ជាក់ការបញ្ជាទិញ")}</>}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-4">
                <p className="text-xs text-muted-foreground mb-3 text-center">
                  {t(`Scan with your ${method.label} app`, `ស្កែនដោយ app ${method.label} របស់អ្នក`)}
                </p>
                {QR_IMAGES[method.value] ? (
                  <div className="rounded-xl overflow-hidden shadow-md border border-border/30 w-48">
                    <img
                      src={QR_IMAGES[method.value]}
                      alt={`${method.label} QR code`}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                ) : (
                  <div className={`${method.bg} rounded-xl p-5 flex items-center justify-center w-40 h-40`}>
                    <span className="text-white/80 text-sm text-center font-medium">{method.label}</span>
                  </div>
                )}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`text-xs font-bold bg-gradient-to-r ${method.color} bg-clip-text text-transparent`}>{method.label}</span>
                  <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                </div>
              </div>

              <div className="bg-muted/40 rounded-lg p-3 text-center mb-4">
                <p className="text-xs text-muted-foreground">
                  {t("Amount", "ចំនួន")}: <span className="font-bold text-foreground text-sm">${amount.toFixed(2)}</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t("Reference", "ឯកសារ")}: ST-{Date.now().toString().slice(-8)}
                </p>
              </div>

              <Button
                className="w-full mb-2 gap-2"
                size="sm"
                variant="outline"
                onClick={handleSimulatePay}
                disabled={simulating}
              >
                {simulating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{t("Processing...", "កំពុងដំណើរការ...")}</>
                ) : (
                  <><Check className="h-4 w-4" />{t("Simulate Payment", "ក្លែងធ្វើការទូទាត់")}</>
                )}
              </Button>
              <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={onCancel}>
                {t("Cancel & go back", "បោះបង់ & ត្រលប់")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ step }: { step: number }) {
  const { t } = useLanguage();
  const steps = [
    { label: t("Delivery", "ដឹកជញ្ជូន"), icon: <Truck className="h-3.5 w-3.5" /> },
    { label: t("Payment", "ការទូទាត់"), icon: <CreditCard className="h-3.5 w-3.5" /> },
    { label: t("Confirm", "បញ្ជាក់"), icon: <Check className="h-3.5 w-3.5" /> },
  ];
  return (
    <div className="flex items-center justify-center mb-8 gap-0">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? "bg-primary text-white" : i === step ? "bg-primary text-white ring-4 ring-primary/20" : "bg-muted text-muted-foreground"}`}>
              {i < step ? <Check className="h-4 w-4" /> : s.icon}
            </div>
            <span className={`text-[10px] mt-1 font-medium ${i === step ? "text-primary" : "text-muted-foreground"}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 h-[2px] mx-1 mb-4 rounded-full transition-all ${i < step ? "bg-primary" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main checkout component ──────────────────────────────────────────────────
export default function CheckoutPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const [step, setStep] = useState(0); // 0 = delivery, 1 = payment, 2 = confirm/QR
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<OrderInputPaymentMethod>(OrderInputPaymentMethod.khqr);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; type: "percent" | "flat"; value: number; label: string } | null>(null);

  const { data: cart } = useGetCart({ query: { queryKey: ["/api/cart"] } });
  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: (order) => {
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
        toast({ title: t("Order placed successfully! 🎉", "ការបញ្ជាទិញបានជោគជ័យ! 🎉") });
        navigate(`/orders/${order.id}`);
      },
      onError: () => {
        toast({ title: t("Failed to place order.", "ការបញ្ជាទិញបរាជ័យ។"), variant: "destructive" });
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

  if (!cart || cart.items.length === 0) {
    navigate("/cart");
    return null;
  }

  // Price calculations
  const subtotal = Number(cart.subtotal);
  const cartDiscount = Number(cart.discount);
  const afterCartDiscount = subtotal - cartDiscount;
  let promoDiscount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === "percent") promoDiscount = afterCartDiscount * (appliedPromo.value / 100);
    else promoDiscount = Math.min(appliedPromo.value, afterCartDiscount);
  }
  const afterPromo = afterCartDiscount - promoDiscount;
  const deliveryFee = (appliedPromo?.code === "FREESHIP" || afterPromo >= DELIVERY_FREE_THRESHOLD) ? 0 : DELIVERY_FEE;
  const grandTotal = afterPromo + deliveryFee;

  const selectedPayment = PAYMENT_METHODS.find(m => m.value === paymentMethod)!;

  const handleDeliveryNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      toast({ title: t("Please enter delivery address.", "សូមបញ្ចូលអាសយដ្ឋានដឹក។"), variant: "destructive" });
      return;
    }
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePaymentNext = () => {
    setStep(2);
    setShowPaymentModal(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlaceOrder = () => {
    createOrder.mutate({
      data: {
        shippingAddress: `${address}${city ? ", " + city : ""}`,
        paymentMethod,
      },
    });
  };

  return (
    <ProtectedRoute>
      <RootLayout>
        {showPaymentModal && (
          <PaymentModal
            method={selectedPayment}
            amount={grandTotal}
            onConfirm={handlePlaceOrder}
            onCancel={() => { setShowPaymentModal(false); setStep(1); }}
            isPending={createOrder.isPending}
          />
        )}

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-2xl font-bold mb-6 text-center">{t("Checkout", "ការទូទាត់")}</h1>
          <Stepper step={step} />

          <div className="grid md:grid-cols-5 gap-6">
            {/* Left: form */}
            <div className="md:col-span-3 space-y-4">

              {/* ── STEP 0: DELIVERY ── */}
              {step === 0 && (
                <form onSubmit={handleDeliveryNext}>
                  <div className="bg-white dark:bg-card border rounded-xl p-5 space-y-4">
                    <h2 className="font-bold flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      {t("Delivery Information", "ព័ត៌មានដឹកជញ្ជូន")}
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">{t("Full Name", "ឈ្មោះពេញ")} *</Label>
                        <Input
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder={t("Your name", "ឈ្មោះ")}
                          required className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t("Phone", "ទូរស័ព្ទ")} *</Label>
                        <Input
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="0xx xxx xxx"
                          required className="h-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("Street Address", "ផ្លូវ / ភូមិ / សង្កាត់")} *</Label>
                      <Input
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder={t("e.g. #12, St. 310, Boeung Keng Kang", "ឧ. #12, ផ្លូវ 310, បឹងកេងកង")}
                        required className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("City / Province", "ខេត្ត / ក្រុង")}</Label>
                      <Input
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder={t("e.g. Phnom Penh", "ឧ. ភ្នំពេញ")}
                        className="h-9 text-sm"
                      />
                    </div>

                    {/* Promo code */}
                    <div className="border-t pt-4">
                      <Label className="text-xs flex items-center gap-1 mb-2">
                        <Tag className="h-3.5 w-3.5 text-primary" />
                        {t("Promo Code", "លេខកូដបញ្ចុះតម្លៃ")}
                      </Label>
                      {appliedPromo ? (
                        <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Percent className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-sm font-semibold text-green-700 dark:text-green-400">{appliedPromo.code}</span>
                            <span className="text-xs text-green-600">— {appliedPromo.label}</span>
                          </div>
                          <button onClick={() => setAppliedPromo(null)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            value={promoInput}
                            onChange={e => setPromoInput(e.target.value)}
                            placeholder={t("Enter code", "បញ្ចូលកូដ")}
                            className="h-9 text-sm uppercase"
                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), applyPromo())}
                          />
                          <Button type="button" size="sm" variant="outline" onClick={applyPromo} className="h-9 shrink-0">
                            {t("Apply", "អនុវត្ត")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button type="submit" size="lg" className="w-full mt-4 gap-2">
                    {t("Continue to Payment", "បន្តទៅការទូទាត់")} <ChevronRight className="h-4 w-4" />
                  </Button>
                </form>
              )}

              {/* ── STEP 1: PAYMENT METHOD ── */}
              {step === 1 && (
                <div>
                  <div className="bg-white dark:bg-card border rounded-xl p-5">
                    <h2 className="font-bold flex items-center gap-2 mb-4">
                      <CreditCard className="h-4 w-4 text-primary" />
                      {t("Select Payment Method", "ជ្រើសរើសវិធីសាស្ត្រទូទាត់")}
                    </h2>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={v => setPaymentMethod(v as OrderInputPaymentMethod)}
                    >
                      <div className="space-y-2">
                        {PAYMENT_METHODS.map(m => (
                          <div
                            key={m.value}
                            className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === m.value ? "border-primary bg-primary/5 dark:bg-primary/10" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}
                            onClick={() => setPaymentMethod(m.value)}
                          >
                            <RadioGroupItem value={m.value} id={`pm-${m.value}`} />
                            <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center text-xl shadow-sm flex-shrink-0`}>
                              {m.icon}
                            </div>
                            <Label htmlFor={`pm-${m.value}`} className="cursor-pointer flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{t(m.label, m.labelKh)}</span>
                                {m.badge && (
                                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">{m.badge}</span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{t(m.desc, m.descKh)}</div>
                            </Label>
                            {paymentMethod === m.value && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(0)}>
                      {t("Back", "ត្រឡប់")}
                    </Button>
                    <Button size="lg" className="flex-1 gap-2" onClick={handlePaymentNext}>
                      {t("Pay Now", "ទូទាត់ឥឡូវ")} <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 2 is handled by the modal overlay ── */}
              {step === 2 && !showPaymentModal && (
                <div className="bg-white dark:bg-card border rounded-xl p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-muted-foreground">{t("Processing payment...", "កំពុងដំណើរការការទូទាត់...")}</p>
                </div>
              )}
            </div>

            {/* Right: order summary */}
            <div className="md:col-span-2">
              <div className="bg-white dark:bg-card border rounded-xl p-5 sticky top-24">
                <h2 className="font-bold mb-4 text-sm">{t("Your Order", "ការបញ្ជារបស់អ្នក")}</h2>

                {/* Items */}
                <div className="space-y-3 mb-4 max-h-52 overflow-y-auto pr-1">
                  {cart.items.map(item => (
                    <div key={item.id} className="flex gap-2.5 items-center">
                      <img
                        src={item.productImage ?? "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=60"}
                        alt={item.productName}
                        className="w-11 h-11 rounded-lg object-cover bg-muted flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-1">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                      </div>
                      <span className="text-xs font-semibold flex-shrink-0">${(Number(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("Subtotal", "តម្លៃរង")}</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {cartDiscount > 0 && (
                    <div className="flex justify-between text-destructive text-xs">
                      <span>{t("Product discounts", "បញ្ចុះតម្លៃ")}</span>
                      <span>-${cartDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400 text-xs">
                      <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{appliedPromo?.code}</span>
                      <span>-${promoDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>{t("Delivery", "ដឹក")}</span>
                    {deliveryFee === 0
                      ? <span className="text-green-600 font-medium">{t("Free", "ឥតគិតថ្លៃ")}</span>
                      : <span>${deliveryFee.toFixed(2)}</span>
                    }
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>{t("Total", "សរុប")}</span>
                    <span className="text-primary text-base">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment summary (step 1+) */}
                {step >= 1 && (
                  <div className={`mt-3 ${selectedPayment.bg} rounded-xl p-3 flex items-center gap-3`}>
                    <span className="text-xl">{selectedPayment.icon}</span>
                    <div className="text-white min-w-0">
                      <p className="text-xs font-bold">{selectedPayment.label}</p>
                      <p className="text-white/70 text-[11px] truncate">{selectedPayment.desc}</p>
                    </div>
                  </div>
                )}

                {/* Delivery summary (step 1+) */}
                {step >= 1 && address && (
                  <div className="mt-3 bg-muted/50 rounded-xl p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">{t("Delivering to", "ដឹកទៅ")}</p>
                    <p className="text-xs font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">{address}{city ? `, ${city}` : ""}</p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                  <span>{t("Secured by KHQR / SSL", "ការពារដោយ KHQR / SSL")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RootLayout>
    </ProtectedRoute>
  );
}
