import { useState } from "react";
import { Plus, Edit, Trash2, Ticket, ToggleLeft, ToggleRight, Copy, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useListCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from "@workspace/api-client-react";
import type { Coupon } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const EMPTY_FORM = {
  code: "",
  type: "percent" as "percent" | "flat" | "free_shipping",
  value: "",
  minOrder: "",
  maxUses: "",
  isActive: true,
  expiresAt: "",
};

type FormState = typeof EMPTY_FORM;

function typeLabel(type: string) {
  if (type === "percent") return "% Discount";
  if (type === "flat") return "$ Off";
  return "Free Shipping";
}

function typeColor(type: string) {
  if (type === "percent") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  if (type === "flat") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
}

function valueDisplay(coupon: Coupon) {
  if (coupon.type === "percent") return `${coupon.value}%`;
  if (coupon.type === "flat") return `$${Number(coupon.value).toFixed(2)}`;
  return "—";
}

function CouponDialog({
  open,
  onClose,
  initial,
  onSave,
  isPending,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  initial: FormState;
  onSave: (f: FormState) => void;
  isPending: boolean;
  mode: "create" | "edit";
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("Create Coupon", "បង្កើតគូប៉ុង") : t("Edit Coupon", "កែប្រែគូប៉ុង")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("Code", "លេខកូដ")} *</Label>
            <Input
              value={form.code}
              onChange={e => set("code", e.target.value.toUpperCase())}
              placeholder="e.g. SAVE20"
              className="uppercase font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("Type", "ប្រភេទ")} *</Label>
              <Select value={form.type} onValueChange={v => set("type", v)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">{t("Percent %", "ភាគរយ %")}</SelectItem>
                  <SelectItem value="flat">{t("Flat $ Off", "បញ្ចុះ $")}</SelectItem>
                  <SelectItem value="free_shipping">{t("Free Shipping", "ដឹកឥតគិតថ្លៃ")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                {form.type === "percent" ? t("Discount %", "ភាគរយបញ្ចុះ") : form.type === "flat" ? t("Amount $", "ចំនួន $") : t("Value", "តម្លៃ")}
              </Label>
              <Input
                type="number"
                value={form.value}
                onChange={e => set("value", e.target.value)}
                placeholder={form.type === "percent" ? "10" : "5.00"}
                disabled={form.type === "free_shipping"}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("Min. Order $", "ការបញ្ជាទិញអប្បបរមា $")}</Label>
              <Input
                type="number"
                value={form.minOrder}
                onChange={e => set("minOrder", e.target.value)}
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("Max Uses", "ប្រើប្រាស់អតិបរមា")} <span className="text-muted-foreground">(∞ = unlimited)</span></Label>
              <Input
                type="number"
                value={form.maxUses}
                onChange={e => set("maxUses", e.target.value)}
                placeholder={t("Unlimited", "គ្មានដែន")}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("Expires At", "ផុតកំណត់")}</Label>
            <Input
              type="date"
              value={form.expiresAt}
              onChange={e => set("expiresAt", e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.isActive} onCheckedChange={v => set("isActive", v)} />
            <Label className="text-sm">{t("Active", "សកម្ម")}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("Cancel", "បោះបង់")}</Button>
          <Button disabled={isPending} onClick={() => onSave(form)}>
            {isPending ? t("Saving...", "កំពុងរក្សា...") : t("Save", "រក្សាទុក")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CouponsPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Coupon | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: coupons, isLoading } = useListCoupons();
  const createCoupon = useCreateCoupon({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/coupons"] });
        setDialog(null);
        toast({ title: t("Coupon created!", "គូប៉ុងត្រូវបានបង្កើត!") });
      },
      onError: () => toast({ title: t("Failed to create coupon.", "បរាជ័យ!"), variant: "destructive" }),
    },
  });
  const updateCoupon = useUpdateCoupon({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/coupons"] });
        setDialog(null);
        setEditTarget(null);
        toast({ title: t("Coupon updated!", "គូប៉ុងត្រូវបានធ្វើបច្ចុប្បន្នភាព!") });
      },
      onError: () => toast({ title: t("Failed to update coupon.", "បរាជ័យ!"), variant: "destructive" }),
    },
  });
  const deleteCoupon = useDeleteCoupon({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/coupons"] });
        setDeleteId(null);
        toast({ title: t("Coupon deleted.", "គូប៉ុងត្រូវបានលុប!") });
      },
    },
  });

  function openCreate() {
    setEditTarget(null);
    setDialog("create");
  }

  function openEdit(c: Coupon) {
    setEditTarget(c);
    setDialog("edit");
  }

  function handleSave(form: FormState) {
    const payload = {
      code: form.code,
      type: form.type,
      value: form.type === "free_shipping" ? 0 : parseFloat(form.value) || 0,
      minOrder: parseFloat(form.minOrder) || 0,
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      isActive: form.isActive,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };
    if (dialog === "create") {
      createCoupon.mutate({ data: payload });
    } else if (editTarget) {
      updateCoupon.mutate({ id: editTarget.id, data: payload });
    }
  }

  function toggleActive(c: Coupon) {
    updateCoupon.mutate({ id: c.id, data: { isActive: !c.isActive } });
  }

  function copyCode(c: Coupon) {
    navigator.clipboard.writeText(c.code);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  const editInitial: FormState = editTarget
    ? {
        code: editTarget.code,
        type: editTarget.type as FormState["type"],
        value: editTarget.type !== "free_shipping" ? String(editTarget.value) : "",
        minOrder: String(editTarget.minOrder ?? 0),
        maxUses: editTarget.maxUses != null ? String(editTarget.maxUses) : "",
        isActive: editTarget.isActive,
        expiresAt: editTarget.expiresAt ? editTarget.expiresAt.split("T")[0] : "",
      }
    : EMPTY_FORM;

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Ticket className="h-6 w-6 text-primary" />
                {t("Coupons", "គូប៉ុង")}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("Create and manage promo codes for customers.", "បង្កើត និងគ្រប់គ្រងលេខកូដប្រូម៉ូ។")}
              </p>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("New Coupon", "គូប៉ុងថ្មី")}
            </Button>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-card border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b text-xs text-muted-foreground uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3">{t("Code", "លេខកូដ")}</th>
                    <th className="text-left px-4 py-3">{t("Type", "ប្រភេទ")}</th>
                    <th className="text-left px-4 py-3">{t("Value", "តម្លៃ")}</th>
                    <th className="text-left px-4 py-3">{t("Min Order", "អប្បបរមា")}</th>
                    <th className="text-left px-4 py-3">{t("Uses", "ប្រើ")}</th>
                    <th className="text-left px-4 py-3">{t("Expires", "ផុតកំណត់")}</th>
                    <th className="text-left px-4 py-3">{t("Status", "ស្ថានភាព")}</th>
                    <th className="text-right px-4 py-3">{t("Actions", "សកម្មភាព")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : !coupons?.length ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                        <Ticket className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>{t("No coupons yet.", "មិនទាន់មានគូប៉ុង។")}</p>
                      </td>
                    </tr>
                  ) : (
                    coupons.map(c => (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm tracking-wider">{c.code}</span>
                            <button
                              onClick={() => copyCode(c)}
                              className="text-muted-foreground hover:text-primary transition-colors"
                              title="Copy"
                            >
                              {copiedId === c.id
                                ? <Check className="h-3.5 w-3.5 text-green-500" />
                                : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor(c.type)}`}>
                            {typeLabel(c.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-primary">{valueDisplay(c)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {Number(c.minOrder) > 0 ? `$${Number(c.minOrder).toFixed(2)}` : t("None", "គ្មាន")}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-muted-foreground">
                            {c.usedCount}{c.maxUses != null ? `/${c.maxUses}` : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {c.expiresAt
                            ? new Date(c.expiresAt).toLocaleDateString()
                            : <span className="text-green-600 font-medium">{t("Never", "មិនដែល")}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleActive(c)}
                            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${c.isActive ? "text-green-600" : "text-muted-foreground"}`}
                          >
                            {c.isActive
                              ? <ToggleRight className="h-5 w-5" />
                              : <ToggleLeft className="h-5 w-5" />}
                            {c.isActive ? t("Active", "សកម្ម") : t("Inactive", "អសកម្ម")}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => openEdit(c)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(c.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Create / Edit dialog */}
        {dialog && (
          <CouponDialog
            open={!!dialog}
            onClose={() => { setDialog(null); setEditTarget(null); }}
            initial={dialog === "edit" ? editInitial : EMPTY_FORM}
            onSave={handleSave}
            isPending={createCoupon.isPending || updateCoupon.isPending}
            mode={dialog}
          />
        )}

        {/* Delete confirm */}
        <Dialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("Delete Coupon?", "លុបគូប៉ុង?")}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {t("This action cannot be undone.", "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។")}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>{t("Cancel", "បោះបង់")}</Button>
              <Button
                variant="destructive"
                disabled={deleteCoupon.isPending}
                onClick={() => deleteId !== null && deleteCoupon.mutate({ id: deleteId })}
              >
                {deleteCoupon.isPending ? t("Deleting...", "កំពុងលុប...") : t("Delete", "លុប")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedRoute>
  );
}
