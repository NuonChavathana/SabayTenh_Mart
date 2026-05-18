import { useState } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useListCategories,
  useListBrands,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const EMPTY_FORM = {
  name: "", nameKh: "", description: "", price: "", originalPrice: "", image: "",
  categoryId: "", brandId: "", stock: "", isFeatured: false, tags: "",
};

export default function AdminProductsPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useListProducts({ page, limit: 15, search: search || undefined });
  const { data: categories } = useListCategories();
  const { data: brands } = useListBrands();

  const createProduct = useCreateProduct({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/products"] });
        setDialog(null);
        toast({ title: t("Product created!", "ផលិតផលត្រូវបានបង្កើត!") });
      },
    },
  });

  const updateProduct = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/products"] });
        setDialog(null);
        toast({ title: t("Product updated!", "ត្រូវបានធ្វើបច្ចុប្បន្ន!") });
      },
    },
  });

  const deleteProduct = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/products"] });
        setDeleteId(null);
        toast({ title: t("Product deleted.", "ផលិតផលត្រូវបានលុប។") });
      },
    },
  });

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setDialog("create"); };
  const openEdit = (p: any) => {
    setForm({
      name: p.name ?? "", nameKh: p.nameKh ?? "", description: p.description ?? "",
      price: String(p.price ?? ""), originalPrice: String(p.originalPrice ?? ""), image: p.image ?? "",
      categoryId: String(p.categoryId ?? ""), brandId: String(p.brandId ?? ""),
      stock: String(p.stock ?? ""), isFeatured: p.isFeatured ?? false, tags: p.tags ?? "",
    });
    setEditId(p.id);
    setDialog("edit");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: form.name,
      nameKh: form.nameKh || undefined,
      description: form.description || undefined,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      image: form.image || undefined,
      categoryId: Number(form.categoryId),
      brandId: form.brandId ? Number(form.brandId) : undefined,
      stock: Number(form.stock),
      isFeatured: form.isFeatured,
      tags: form.tags || undefined,
    };
    if (dialog === "create") {
      createProduct.mutate({ data: payload });
    } else if (editId) {
      updateProduct.mutate({ id: editId, data: payload });
    }
  };

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const totalPages = data ? Math.ceil(data.total / 15) : 1;

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <AdminLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-xl font-bold">{t("Products", "ផលិតផល")}</h1>
            <Button size="sm" className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />{t("Add Product", "បន្ថែមផលិតផល")}
            </Button>
          </div>

          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("Search...", "ស្វែងរក...")} className="pl-9 h-9" />
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Product", "ផលិតផល")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Price", "តម្លៃ")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Stock", "ស្តុក")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Category", "ប្រភេទ")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Featured", "ពិសេស")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Actions", "សកម្មភាព")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data?.products.map(p => (
                        <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {p.image && <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />}
                              <div>
                                <p className="font-medium line-clamp-1">{p.name}</p>
                                {p.nameKh && <p className="text-xs text-muted-foreground line-clamp-1">{p.nameKh}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-primary">${Number(p.price).toFixed(2)}</span>
                            {p.originalPrice && (
                              <span className="text-xs text-muted-foreground line-through ml-1">${Number(p.originalPrice).toFixed(2)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-medium ${p.stock === 0 ? "text-destructive" : p.stock <= 10 ? "text-yellow-600" : ""}`}>{p.stock}</span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{p.categoryName}</td>
                          <td className="px-4 py-3">
                            {p.isFeatured && <Badge className="text-xs bg-primary/10 text-primary border-0">★</Badge>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(p)}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 p-4">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t("Prev", "មុន")}</Button>
                  <span className="flex items-center text-xs text-muted-foreground px-2">{page}/{totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>{t("Next", "បន្ទាប់")}</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialog === "create" || dialog === "edit"} onOpenChange={() => setDialog(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{dialog === "create" ? t("Add Product", "បន្ថែមផលិតផល") : t("Edit Product", "កែផលិតផល")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t("Name (EN)", "ឈ្មោះ (EN)")} *</Label>
                  <Input value={form.name} onChange={f("name")} required className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">{t("Name (KH)", "ឈ្មោះ (KH)")}</Label>
                  <Input value={form.nameKh} onChange={f("nameKh")} className="mt-1 h-8 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs">{t("Description", "ការពិពណ៌នា")}</Label>
                <Textarea value={form.description} onChange={f("description")} rows={2} className="mt-1 text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">{t("Price", "តម្លៃ")} *</Label>
                  <Input value={form.price} onChange={f("price")} type="number" step="0.01" required className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">{t("Original Price", "តម្លៃដើម")}</Label>
                  <Input value={form.originalPrice} onChange={f("originalPrice")} type="number" step="0.01" className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">{t("Stock", "ស្តុក")} *</Label>
                  <Input value={form.stock} onChange={f("stock")} type="number" required className="mt-1 h-8 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t("Category", "ប្រភេទ")} *</Label>
                  <Select value={form.categoryId} onValueChange={v => setForm(p => ({ ...p, categoryId: v }))}>
                    <SelectTrigger className="mt-1 h-8 text-sm">
                      <SelectValue placeholder={t("Select", "ជ្រើស")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t("Brand", "ម៉ាក")}</Label>
                  <Select value={form.brandId} onValueChange={v => setForm(p => ({ ...p, brandId: v }))}>
                    <SelectTrigger className="mt-1 h-8 text-sm">
                      <SelectValue placeholder={t("Optional", "ស្រេចចិត្ត")} />
                    </SelectTrigger>
                    <SelectContent>
                      {brands?.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">{t("Image URL", "URL រូបភាព")}</Label>
                <Input value={form.image} onChange={f("image")} placeholder="https://..." className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">{t("Tags", "ស្លាក")}</Label>
                <Input value={form.tags} onChange={f("tags")} placeholder="tag1,tag2" className="mt-1 h-8 text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isFeatured} onCheckedChange={v => setForm(p => ({ ...p, isFeatured: v }))} />
                <Label className="text-sm">{t("Featured product", "ផលិតផលពិសេស")}</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialog(null)}>{t("Cancel", "បោះបង់")}</Button>
                <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                  {dialog === "create" ? t("Create", "បង្កើត") : t("Save", "រក្សាទុក")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("Delete Product?", "លុបផលិតផល?")}</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">{t("This action cannot be undone.", "សកម្មភាពនេះមិនអាចត្រឡប់វិញ។")}</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>{t("Cancel", "បោះបង់")}</Button>
              <Button
                variant="destructive"
                onClick={() => deleteId && deleteProduct.mutate({ id: deleteId })}
                disabled={deleteProduct.isPending}
              >
                {t("Delete", "លុប")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedRoute>
  );
}
