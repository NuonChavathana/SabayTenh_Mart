import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  User, Mail, Phone, Shield, Edit3, Check, X, Package, Heart,
  MapPin, CreditCard, Settings, LogOut, ChevronRight, Plus, Trash2,
  ShoppingCart, Clock, CheckCircle, Truck, XCircle, RefreshCw,
  Star, Lock,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { RootLayout } from "@/components/layout/RootLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  useUpdateProfile, useChangePassword, useListOrders,
  useGetWishlist, useRemoveFromWishlist, useAddToCart,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getProductImageUrl } from "@/lib/images";
import { getDiscountPercent } from "@/lib/discount";

// ── Types ──────────────────────────────────────────────────────────────────────
type Section = "profile" | "orders" | "wishlist" | "addresses" | "payments" | "settings";

interface Address {
  id: string; label: string; name: string; phone: string;
  street: string; city: string; isDefault: boolean;
}
interface SavedPayment {
  id: string; bank: string; logo: string; accountNumber: string; accountName: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const ADDR_KEY = "sabaytenh_addresses";
const PM_KEY   = "sabaytenh_saved_payments";

const STATUS_CONFIG: Record<string, { label: string; labelKh: string; color: string; Icon: React.ComponentType<{className?: string}> }> = {
  pending:    { label: "Pending",    labelKh: "រង់ចាំ",          color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", Icon: Clock },
  confirmed:  { label: "Confirmed",  labelKh: "បានបញ្ជាក់",      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",   Icon: CheckCircle },
  processing: { label: "Processing", labelKh: "កំពុងដំណើរការ",   color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300", Icon: RefreshCw },
  shipped:    { label: "Shipped",    labelKh: "កំពុងដឹក",        color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300", Icon: Truck },
  delivered:  { label: "Delivered",  labelKh: "បានដឹកជញ្ជូន",    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",  Icon: CheckCircle },
  cancelled:  { label: "Cancelled",  labelKh: "បានលុបចោល",      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",     Icon: XCircle },
};

const BANK_OPTIONS = [
  { key: "aba",     label: "ABA Bank",    logo: "/logo-aba.jpeg" },
  { key: "acleda",  label: "ACLEDA",      logo: "/logo-acleda.jpeg" },
  { key: "wing",    label: "Wing Money",  logo: "/logo-wing.jpeg" },
  { key: "canadia", label: "Vatanak",     logo: "/logo-vatanak.jpeg" },
  { key: "khqr",    label: "KHQR Bakong", logo: "/logo-khqr.jpeg" },
];

const NAV: { key: Section; label: string; labelKh: string; short: string; shortKh: string; Icon: React.ComponentType<{className?: string}> }[] = [
  { key: "profile",   label: "My Profile",       labelKh: "ព័ត៌មានខ្ញុំ",       short: "Profile",   shortKh: "ព័ត៌មាន",    Icon: User },
  { key: "orders",    label: "My Orders",         labelKh: "ការបញ្ជា",           short: "Orders",    shortKh: "ការបញ្ជា",   Icon: Package },
  { key: "wishlist",  label: "My Wishlist",       labelKh: "បញ្ជីចង់ទិញ",       short: "Wishlist",  shortKh: "ចង់ទិញ",    Icon: Heart },
  { key: "addresses", label: "My Addresses",      labelKh: "អាសយដ្ឋាន",         short: "Address",   shortKh: "អាសយដ្ឋាន", Icon: MapPin },
  { key: "payments",  label: "Payment Methods",   labelKh: "វិធីទូទាត់",        short: "Payments",  shortKh: "ទូទាត់",    Icon: CreditCard },
  { key: "settings",  label: "Account Settings",  labelKh: "ការកំណត់",           short: "Settings",  shortKh: "ការកំណត់",  Icon: Settings },
];

// ── localStorage helpers ───────────────────────────────────────────────────────
function getUserStorageKey(baseKey: string, user?: { id?: number | string; email?: string | null } | null) {
  const owner = user?.id ?? user?.email ?? "guest";
  return `${baseKey}_${owner}`;
}

function getAddresses(storageKey: string): Address[] {
  try { return JSON.parse(localStorage.getItem(storageKey) ?? "[]"); } catch { return []; }
}
function saveAddresses(storageKey: string, a: Address[]) { localStorage.setItem(storageKey, JSON.stringify(a)); }
function getSavedPayments(storageKey: string): SavedPayment[] {
  try { return JSON.parse(localStorage.getItem(storageKey) ?? "[]"); } catch { return []; }
}
function saveSavedPayments(storageKey: string, p: SavedPayment[]) { localStorage.setItem(storageKey, JSON.stringify(p)); }

// ── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
      <Icon className="h-3 w-3" />{t(cfg.label, cfg.labelKh)}
    </span>
  );
}

// ── SECTION: Profile ───────────────────────────────────────────────────────────
function ProfileSection() {
  const { t } = useLanguage();
  const { user, login, token } = useAuth();
  const qc = useQueryClient();

  const { data: orders } = useListOrders();
  const { data: wishlist } = useGetWishlist();
  const [reviewsGiven, setReviewsGiven] = useState(0);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  const countItems = (data: any) => {
    if (Array.isArray(data)) return data.length;
    if (Array.isArray(data?.data)) return data.data.length;
    if (Array.isArray(data?.orders)) return data.orders.length;
    if (Array.isArray(data?.wishlist)) return data.wishlist.length;
    if (Array.isArray(data?.items)) return data.items.length;
    if (Array.isArray(data?.reviews)) return data.reviews.length;
    if (typeof data?.count === "number") return data.count;
    if (typeof data?.total === "number") return data.total;
    return 0;
  };

  useEffect(() => {
    const loadReviewsGiven = async () => {
      try {
        const res = await fetch("/api/reviews/my", {
          credentials: "include",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        });

        if (!res.ok) {
          setReviewsGiven(0);
          return;
        }

        const data = await res.json();
        setReviewsGiven(countItems(data));
      } catch (error) {
        console.error("Failed to load reviews given:", error);
        setReviewsGiven(0);
      }
    };

    loadReviewsGiven();
  }, [token]);

  const update = useUpdateProfile({
    mutation: {
      onSuccess: (u) => {
        if (token) login(token, u);
        qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
        setEditing(false);
        toast({
          title: t(
            "Profile updated!",
            "ព័ត៌មានបានធ្វើបច្ចុប្បន្នភាព!"
          ),
        });
      },
      onError: () =>
        toast({
          title: t(
            "Failed to update.",
            "មិនអាចធ្វើបច្ចុប្បន្នភាព"
          ),
          variant: "destructive",
        }),
    },
  });

  const roleLabel: [string, string] =
    (
      {
        admin: ["Administrator", "អ្នកគ្រប់គ្រង"],
        staff: ["Staff", "បុគ្គលិក"],
        cashier: ["Cashier", "គណនេយ្យករ"],
        customer: ["Customer", "អតិថិជន"],
      } as Record<string, [string, string]>
    )[user?.role ?? "customer"] ?? ["Customer", "អតិថិជន"];

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-gradient-to-br from-primary to-orange-400 rounded-2xl p-5 text-white flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {user?.name?.[0]?.toUpperCase()}
        </div>

        <div>
          <p className="font-bold text-xl leading-tight">{user?.name}</p>
          <p className="text-white/80 text-sm">{user?.email}</p>

          <span className="inline-block mt-1.5 text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">
            {t(roleLabel[0], roleLabel[1])}
          </span>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white dark:bg-card border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            {t("Personal Information", "ព័ត៌មានផ្ទាល់ខ្លួន")}
          </h3>

          {!editing && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => {
                setName(user?.name ?? "");
                setPhone(user?.phone ?? "");
                setEditing(true);
              }}
            >
              <Edit3 className="h-3.5 w-3.5" />
              {t("Edit", "កែប្រែ")}
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">
                {t("Full Name", "ឈ្មោះពេញ")}
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 h-9"
                placeholder={t("Your name", "ឈ្មោះ")}
              />
            </div>

            <div>
              <Label className="text-xs">{t("Phone", "ទូរស័ព្ទ")}</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 h-9"
                placeholder="0xx xxx xxx"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={() =>
                  update.mutate({
                    data: {
                      name: name.trim(),
                      phone: phone.trim() || undefined,
                    },
                  })
                }
                disabled={update.isPending}
                className="gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                {update.isPending ? t("Saving...", "...") : t("Save", "រក្សាទុក")}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(false)}
                className="gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                {t("Cancel", "បោះបង់")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{user?.name ?? "—"}</span>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user?.email}</span>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>
                {user?.phone ?? (
                  <span className="text-muted-foreground italic">
                    {t("Not set", "មិនទាន់")}
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {t("Member since", "សមាជិកចាប់ពី")}{" "}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {([
          {
            label: t("Total Orders", "ការបញ្ជា"),
            value: countItems(orders),
            icon: Package,
            color: "text-primary bg-primary/10",
          },
          {
            label: t("Wishlist Items", "ចង់ទិញ"),
            value: countItems(wishlist),
            icon: Heart,
            color: "text-rose-500 bg-rose-50 dark:bg-rose-900/20",
          },
          {
            label: t("Reviews Given", "មតិ"),
            value: reviewsGiven,
            icon: Star,
            color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
          },
        ] as const).map((s, i) => (
          <div
            key={i}
            className="bg-white dark:bg-card border rounded-2xl p-4 text-center"
          >
            <div
              className={`w-9 h-9 rounded-full ${s.color} flex items-center justify-center mx-auto mb-2`}
            >
              <s.icon className="h-4 w-4" />
            </div>

            <p className="font-bold text-lg">{s.value}</p>

            <p className="text-[11px] text-muted-foreground leading-tight">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SECTION: Orders ────────────────────────────────────────────────────────────
function OrdersSection() {
  const { t } = useLanguage();
  const { data: orders, isLoading } = useListOrders();

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  if (!orders?.length) return (
    <div className="text-center py-16">
      <Package className="h-14 w-14 text-muted-foreground mx-auto mb-3" />
      <h3 className="font-bold mb-1">{t("No orders yet", "មិនទាន់មានការបញ្ជា")}</h3>
      <p className="text-sm text-muted-foreground mb-4">{t("Your orders will appear here.", "ការបញ្ជារបស់អ្នកនឹងបង្ហាញនៅទីនេះ។")}</p>
      <Link href="/products"><Button size="sm">{t("Start Shopping", "ចាប់ផ្ដើមទិញ")}</Button></Link>
    </div>
  );

  return (
    <div className="space-y-3">
      {(orders as any[]).map(order => (
        <Link key={order.id} href={`/orders/${order.id}`}>
          <div className="bg-white dark:bg-card border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold text-sm">#{order.id}</span>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 ml-11">
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              <span>·</span>
              <span className="font-semibold text-foreground">${Number(order.total).toFixed(2)}</span>
              <span>·</span>
              <span className="uppercase">{order.paymentMethod}</span>
            </div>
            {order.shippingAddress && (
              <p className="text-xs text-muted-foreground mt-1.5 truncate ml-11">
                <MapPin className="h-3 w-3 inline mr-1" />{order.shippingAddress}
              </p>
            )}
            <div className="flex justify-end mt-1">
              <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                {t("View details", "មើលលម្អិត")} <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── SECTION: Wishlist ──────────────────────────────────────────────────────────
function WishlistSection() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const { data: wishlist, isLoading } = useGetWishlist();
  const remove   = useRemoveFromWishlist({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/wishlist"] }); toast({ title: t("Removed", "បានដក") }); } } });
  const addToCart = useAddToCart({        mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/cart"] });     toast({ title: t("Added to cart!", "បានបន្ថែម!") }); } } });

  if (isLoading) return <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}</div>;

  if (!wishlist?.length) return (
    <div className="text-center py-16">
      <Heart className="h-14 w-14 text-muted-foreground mx-auto mb-3" />
      <h3 className="font-bold mb-1">{t("Wishlist is empty", "បញ្ជីចង់ទិញទទេ")}</h3>
      <p className="text-sm text-muted-foreground mb-4">{t("Save items you love here.", "រក្សាទំនិញដែលអ្នកចូលចិត្ត។")}</p>
      <Link href="/products"><Button size="sm">{t("Browse Products", "រកមើល")}</Button></Link>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      {(wishlist as any[]).map(item => {
        const discountPercent = getDiscountPercent(
          item.price,
          item.originalPrice
        );

        return (
        
        <div key={item.id} className="bg-white dark:bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
          <Link href={`/products/${item.productId}`} className="relative block aspect-square overflow-hidden bg-muted">
            <img src={getProductImageUrl(item.productImage)} alt={item.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            {discountPercent && <Badge className="absolute top-2 left-2 bg-destructive text-white border-0 text-[10px]">-{discountPercent}%</Badge>}
          </Link>
          <div className="p-2.5">
            <p className="text-xs font-medium line-clamp-2 mb-2">{item.productName}</p>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-primary text-sm">${Number(item.price).toFixed(2)}</span>
              <span className={`text-[10px] ${item.stock === 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {item.stock === 0 ? t("Out of stock", "អស់") : t("In stock", "មាន")}
              </span>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" className="flex-1 h-7 text-xs gap-1" disabled={item.stock === 0} onClick={() => addToCart.mutate({ data: { productId: item.productId, quantity: 1 } })}>
                <ShoppingCart className="h-3 w-3" />{t("Add", "បន្ថែម")}
              </Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => remove.mutate({ productId: item.productId })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}

// ── SECTION: Addresses ─────────────────────────────────────────────────────────
const EMPTY: Omit<Address, "id" | "isDefault"> = { label: "", name: "", phone: "", street: "", city: "" };

function AddressesSection() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const addressStorageKey = getUserStorageKey(ADDR_KEY, user);
  const [addresses, setAddresses] = useState<Address[]>(() => getAddresses(addressStorageKey));
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState(EMPTY);

  useEffect(() => {
    setAddresses(getAddresses(addressStorageKey));
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY);
  }, [addressStorageKey]);

  const commit = (list: Address[]) => { setAddresses(list); saveAddresses(addressStorageKey, list); };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.street.trim()) {
      toast({ title: t("Name and address required.", "ឈ្មោះ និងអាសយដ្ឋានត្រូវបំពេញ"), variant: "destructive" });
      return;
    }
    if (editId) {
      commit(addresses.map(a => a.id === editId ? { ...a, ...form } : a));
      toast({ title: t("Address updated!", "អាសយដ្ឋានបានធ្វើបច្ចុប្បន្នភាព!") });
    } else {
      commit([...addresses, { ...form, id: Date.now().toString(), isDefault: addresses.length === 0 }]);
      toast({ title: t("Address saved!", "អាសយដ្ឋានបានរក្សាទុក!") });
    }
    setForm(EMPTY); setShowForm(false); setEditId(null);
  };

  const handleEdit = (a: Address) => { setForm({ label: a.label, name: a.name, phone: a.phone, street: a.street, city: a.city }); setEditId(a.id); setShowForm(true); };

  const handleDelete = (id: string) => {
    const next = addresses.filter(a => a.id !== id);
    if (next.length && !next.some(a => a.isDefault)) next[0].isDefault = true;
    commit(next);
    toast({ title: t("Address removed.", "អាសយដ្ឋានបានដក") });
  };

  const FIELDS: { key: keyof typeof EMPTY; label: string; ph: string; required?: boolean }[] = [
    { key: "label",  label: t("Label", "ស្លាក"),                    ph: t("e.g. Home, Work", "ផ្ទះ, ការិយាល័យ") },
    { key: "name",   label: t("Recipient Name", "ឈ្មោះអ្នកទទួល"),   ph: t("Full name", "ឈ្មោះ"), required: true },
    { key: "phone",  label: t("Phone", "ទូរស័ព្ទ"),                  ph: "0xx xxx xxx" },
    { key: "street", label: t("Street / Village", "ផ្លូវ / ភូមិ"),   ph: "#12, St. 310, BKK", required: true },
    { key: "city",   label: t("City / Province", "ខេត្ត / ក្រុង"),   ph: "Phnom Penh" },
  ];

  return (
    <div className="space-y-3">
      {addresses.length === 0 && !showForm && (
        <div className="text-center py-12 border-2 border-dashed rounded-2xl">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-bold mb-1">{t("No addresses saved", "មិនទាន់មានអាសយដ្ឋាន")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("Save your delivery addresses for faster checkout.", "រក្សាអាសយដ្ឋានសម្រាប់ការទូទាត់លឿន។")}</p>
        </div>
      )}

      {addresses.map(a => (
        <div key={a.id} className={`bg-white dark:bg-card border-2 rounded-2xl p-4 transition-colors ${a.isDefault ? "border-primary" : "border-border"}`}>
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${a.isDefault ? "bg-primary/10" : "bg-muted"}`}>
              <MapPin className={`h-4 w-4 ${a.isDefault ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-sm">{a.label || t("Home", "ផ្ទះ")}</span>
                {a.isDefault && <Badge className="text-[10px] bg-primary/10 text-primary border-0 px-1.5">{t("Default", "លំនាំដើម")}</Badge>}
              </div>
              <p className="text-sm">{a.name}{a.phone ? ` · ${a.phone}` : ""}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.street}{a.city ? `, ${a.city}` : ""}</p>
              {!a.isDefault && (
                <button className="text-xs text-primary mt-1.5 hover:underline" onClick={() => commit(addresses.map(x => ({ ...x, isDefault: x.id === a.id })))}>
                  {t("Set as default", "កំណត់ជាលំនាំដើម")}
                </button>
              )}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(a)}><Edit3 className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        </div>
      ))}

      {showForm ? (
        <div className="bg-white dark:bg-card border-2 border-primary/30 rounded-2xl p-5 space-y-3">
          <h4 className="font-semibold text-sm">{editId ? t("Edit Address", "កែអាសយដ្ឋាន") : t("Add New Address", "បន្ថែមអាសយដ្ឋាន")}</h4>
          {FIELDS.map(f => (
            <div key={f.key}>
              <Label className="text-xs">{f.label}{f.required && " *"}</Label>
              <Input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph} className="mt-1 h-9 text-sm" />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSubmit} className="gap-1.5"><Check className="h-3.5 w-3.5" />{t("Save Address", "រក្សាទុក")}</Button>
            <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY); }} className="gap-1.5"><X className="h-3.5 w-3.5" />{t("Cancel", "បោះបង់")}</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full gap-2 border-dashed h-12 rounded-xl" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />{t("Add New Address", "បន្ថែមអាសយដ្ឋានថ្មី")}
        </Button>
      )}
    </div>
  );
}

// ── SECTION: Payment Methods ───────────────────────────────────────────────────
function PaymentsSection() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const paymentStorageKey = getUserStorageKey(PM_KEY, user);
  const [saved, setSaved]             = useState<SavedPayment[]>(() => getSavedPayments(paymentStorageKey));
  const [showForm, setShowForm]       = useState(false);
  const [bank, setBank]               = useState(BANK_OPTIONS[0].key);
  const [accountNumber, setAccNum]    = useState("");
  const [accountName, setAccName]     = useState("");

  useEffect(() => {
    setSaved(getSavedPayments(paymentStorageKey));
    setShowForm(false);
    setAccNum("");
    setAccName("");
  }, [paymentStorageKey]);

  const commit = (list: SavedPayment[]) => { setSaved(list); saveSavedPayments(paymentStorageKey, list); };

  const handleAdd = () => {
    if (!accountNumber.trim() || !accountName.trim()) {
      toast({ title: t("All fields required.", "ត្រូវបំពេញគ្រប់ប្រអប់"), variant: "destructive" });
      return;
    }
    const b = BANK_OPTIONS.find(x => x.key === bank)!;
    commit([...saved, { id: Date.now().toString(), bank: b.label, logo: b.logo, accountNumber: accountNumber.trim(), accountName: accountName.trim() }]);
    setAccNum(""); setAccName(""); setShowForm(false);
    toast({ title: t("Payment account saved!", "គណនីទូទាត់បានរក្សាទុក!") });
  };

  return (
    <div className="space-y-3">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
        {t("Simulation only — no real charges. For demo purposes.", "ការក្លែងធ្វើប៉ុណ្ណោះ — គ្មានការគិតថ្លៃពិតប្រាកដ។ សម្រាប់ការបង្ហាញ។")}
      </div>

      {saved.length === 0 && !showForm && (
        <div className="text-center py-10 border-2 border-dashed rounded-2xl">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-bold mb-1">{t("No saved accounts", "មិនទាន់មានគណនី")}</h3>
          <p className="text-sm text-muted-foreground">{t("Save a bank account for faster checkout.", "រក្សាគណនីធនាគារសម្រាប់ការទូទាត់លឿន។")}</p>
        </div>
      )}

      {saved.map(p => (
        <div key={p.id} className="bg-white dark:bg-card border rounded-xl p-4 flex items-center gap-3">
          <img src={p.logo} alt={p.bank} className="w-11 h-11 rounded-xl object-cover border flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{p.bank}</p>
            <p className="text-xs text-muted-foreground">{p.accountName}</p>
            <p className="text-xs font-mono text-muted-foreground">···{p.accountNumber.slice(-4)}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => { commit(saved.filter(x => x.id !== p.id)); toast({ title: t("Removed", "បានដក") }); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      {showForm ? (
        <div className="bg-white dark:bg-card border-2 border-primary/30 rounded-2xl p-5 space-y-4">
          <h4 className="font-semibold text-sm">{t("Add Payment Account", "បន្ថែមគណនីទូទាត់")}</h4>
          <div>
            <Label className="text-xs mb-2 block">{t("Select Bank", "ជ្រើសធនាគារ")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {BANK_OPTIONS.map(b => (
                <button key={b.key} onClick={() => setBank(b.key)} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 text-xs transition-all ${bank === b.key ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"}`}>
                  <img src={b.logo} alt={b.label} className="w-8 h-8 rounded-lg object-cover" />
                  <span className="text-[10px] font-medium text-center leading-tight">{b.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">{t("Account / Phone Number", "លេខគណនី / ទូរស័ព្ទ")}</Label>
            <Input value={accountNumber} onChange={e => setAccNum(e.target.value)} placeholder="0xx xxx xxx" className="mt-1 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">{t("Account Name", "ឈ្មោះគណនី")}</Label>
            <Input value={accountName} onChange={e => setAccName(e.target.value)} placeholder="CHANVATHANA NUON" className="mt-1 h-9 text-sm uppercase" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} className="gap-1.5"><Check className="h-3.5 w-3.5" />{t("Save Account", "រក្សាទុក")}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="gap-1.5"><X className="h-3.5 w-3.5" />{t("Cancel", "បោះបង់")}</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full gap-2 border-dashed h-12 rounded-xl" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />{t("Add Payment Account", "បន្ថែមគណនីទូទាត់")}
        </Button>
      )}
    </div>
  );
}

// ── SECTION: Settings ──────────────────────────────────────────────────────────
function SettingsSection() {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const changePassword = useChangePassword({
    mutation: {
      onSuccess: () => { setCurrentPw(""); setNewPw(""); setConfirmPw(""); toast({ title: t("Password changed!", "ពាក្យសម្ងាត់ត្រូវបានប្ដូរ!") }); },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? "";
        toast({ title: msg.includes("incorrect") ? t("Current password incorrect.", "ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវ") : t("Failed to change password.", "មិនអាចប្ដូរ"), variant: "destructive" });
      },
    },
  });

  const handlePwChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast({ title: t("Passwords don't match.", "ពាក្យសម្ងាត់មិនត្រូវ"), variant: "destructive" }); return; }
    if (newPw.length < 6)   { toast({ title: t("Min. 6 characters.", "យ៉ាងហោចណាស់ 6 តួ"),        variant: "destructive" }); return; }
    changePassword.mutate({ data: { currentPassword: currentPw, newPassword: newPw } });
  };

  return (
    <div className="space-y-4">
      {/* Change Password */}
      <div className="bg-white dark:bg-card border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Lock className="h-4 w-4 text-primary" /></div>
          <h3 className="font-semibold">{t("Change Password", "ប្ដូរពាក្យសម្ងាត់")}</h3>
        </div>
        <form onSubmit={handlePwChange} className="space-y-3">
          {([
            { label: t("Current Password", "ពាក្យសម្ងាត់បច្ចុប្បន្ន"), value: currentPw, set: setCurrentPw },
            { label: t("New Password", "ពាក្យសម្ងាត់ថ្មី"),           value: newPw,      set: setNewPw },
            { label: t("Confirm New Password", "បញ្ជាក់ពាក្យសម្ងាត់"), value: confirmPw,  set: setConfirmPw },
          ] as const).map((f, i) => (
            <div key={i}>
              <Label className="text-xs">{f.label}</Label>
              <Input type="password" value={f.value} onChange={e => (f.set as (v: string) => void)(e.target.value)} placeholder="••••••••" required className="mt-1 h-9" />
            </div>
          ))}
          <Button type="submit" size="sm" disabled={changePassword.isPending || !currentPw || !newPw || !confirmPw} className="w-full mt-1">
            {changePassword.isPending ? t("Updating...", "កំពុងធ្វើ...") : t("Update Password", "ធ្វើបច្ចុប្បន្នភាព")}
          </Button>
        </form>
      </div>

      {/* About */}
      <div className="bg-white dark:bg-card border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Settings className="h-4 w-4 text-muted-foreground" /></div>
          <h3 className="font-semibold">{t("About", "អំពី")}</h3>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between"><span>{t("App Version", "កំណែ")}</span><span className="font-medium text-foreground">1.0.0</span></div>
          <div className="flex justify-between"><span>{t("Platform", "វេទិកា")}</span><span className="font-medium text-foreground">SabayTenh Web</span></div>
          <div className="flex justify-between"><span>{t("School Project", "គម្រោងសិក្សា")}</span><span className="font-medium text-foreground">2025–2026</span></div>
        </div>
      </div>

      {/* Sign out */}
      <div className="bg-white dark:bg-card border border-destructive/20 rounded-2xl p-5">
        <h3 className="font-semibold text-destructive mb-3">{t("Danger Zone", "តំបន់គ្រោះថ្នាក់")}</h3>
        <Button variant="destructive" className="w-full gap-2" onClick={logout}>
          <LogOut className="h-4 w-4" />{t("Sign Out", "ចេញពីគណនី")}
        </Button>
      </div>
    </div>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────────
export default function AccountPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [section, setSection] = useState<Section>("profile");

  const current = NAV.find(n => n.key === section)!;

  return (
    <ProtectedRoute>
      <RootLayout>
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <div className="flex flex-col md:flex-row gap-5">

            {/* ── Sidebar ── */}
            <aside className="md:w-60 flex-shrink-0">
              {/* User card */}
              <div className="bg-white dark:bg-card border rounded-2xl p-4 mb-3 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>

              {/* Desktop nav */}
              <nav className="hidden md:block bg-white dark:bg-card border rounded-2xl overflow-hidden">
                {NAV.map((n, i) => {
                  const active = section === n.key;
                  return (
                    <button
                      key={n.key}
                      onClick={() => setSection(n.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${i > 0 ? "border-t" : ""} ${active ? "bg-primary/5 text-primary font-semibold" : "hover:bg-muted/40"}`}
                    >
                      <n.Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="flex-1">{t(n.label, n.labelKh)}</span>
                      {active && <ChevronRight className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  );
                })}
              </nav>

              {/* Mobile horizontal pills */}
              <div className="md:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {NAV.map(n => {
                  const active = section === n.key;
                  return (
                    <button
                      key={n.key}
                      onClick={() => setSection(n.key)}
                      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0 border transition-all ${active ? "bg-primary text-white border-primary" : "bg-white dark:bg-card border-border text-muted-foreground"}`}
                    >
                      <n.Icon className="h-4 w-4" />
                      {t(n.short, n.shortKh)}
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* ── Content ── */}
            <main className="flex-1 min-w-0">
              <h1 className="text-xl font-bold mb-4">{t(current.label, current.labelKh)}</h1>
              {section === "profile"   && <ProfileSection />}
              {section === "orders"    && <OrdersSection />}
              {section === "wishlist"  && <WishlistSection />}
              {section === "addresses" && <AddressesSection />}
              {section === "payments"  && <PaymentsSection />}
              {section === "settings"  && <SettingsSection />}
            </main>
          </div>
        </div>
      </RootLayout>
    </ProtectedRoute>
  );
}
