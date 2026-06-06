import { useState } from "react";
import { Plus, Search, Edit, Trash2, Upload } from "lucide-react";
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
import { getDiscountPercent } from "@/lib/discount";
import { getProductImageUrl } from "@/lib/images";

const EMPTY_FORM = {
  name: "",
  nameKh: "",
  description: "",
  price: "",
  originalPrice: "",
  image: "",
  categoryId: "",
  brandId: "",
  stock: "",
  isFeatured: false,
  tags: "",
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
  const [imageUploading, setImageUploading] = useState(false);

  const { data, isLoading } = useListProducts({
    page,
    limit: 15,
    search: search || undefined,
  });

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

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setDialog("create");
  };

  const openEdit = (p: any) => {
    setForm({
      name: p.name ?? "",
      nameKh: p.nameKh ?? "",
      description: p.description ?? "",
      price: String(p.price ?? ""),
      originalPrice: String(p.originalPrice ?? ""),
      image: p.image ?? "",
      categoryId: String(p.categoryId ?? ""),
      brandId: String(p.brandId ?? ""),
      stock: String(p.stock ?? ""),
      isFeatured: p.isFeatured ?? false,
      tags: p.tags ?? "",
    });

    setEditId(p.id);
    setDialog("edit");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t("Invalid image type", "ប្រភេទរូបភាពមិនត្រឹមត្រូវ"),
        description: t(
          "Please upload JPG, PNG, or WEBP image only.",
          "សូមបញ្ចូលតែរូបភាព JPG, PNG ឬ WEBP ប៉ុណ្ណោះ។"
        ),
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t("Image too large", "រូបភាពធំពេក"),
        description: t("Maximum image size is 10MB.", "ទំហំរូបភាពអតិបរមា 10MB។"),
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    try {
      setImageUploading(true);

      const formData = new FormData();
      formData.append("image", file);

      const token = localStorage.getItem("sabaytenh_token");

      const res = await fetch("/api/products/upload-image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload image");

      const data = await res.json();

      setForm((prev) => ({
        ...prev,
        image: data.imageUrl,
      }));

      toast({
        title: t("Image uploaded", "រូបភាពត្រូវបានបញ្ចូល"),
        description: t(
          "Product image uploaded successfully.",
          "រូបភាពផលិតផលត្រូវបានបញ្ចូលដោយជោគជ័យ។"
        ),
      });
    } catch {
      toast({
        title: t("Upload failed", "បញ្ចូលរូបភាពបរាជ័យ"),
        description: t("Please try again.", "សូមព្យាយាមម្តងទៀត។"),
        variant: "destructive",
      });
    } finally {
      setImageUploading(false);
    }
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

  const f =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const totalPages = data ? Math.ceil(data.total / 15) : 1;

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <AdminLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-xl font-bold">{t("Products", "ផលិតផល")}</h1>
            <Button size="sm" className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("Add Product", "បន្ថែមផលិតផល")}
            </Button>
          </div>

          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search...", "ស្វែងរក...")}
              className="pl-9 h-9"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            {t("Product", "ផលិតផល")}
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            {t("Price", "តម្លៃ")}
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            {t("Stock", "ស្តុក")}
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            {t("Category", "ប្រភេទ")}
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            {t("Featured", "ពិសេស")}
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            {t("Actions", "សកម្មភាព")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {data?.products.map((p) => {
                          const discountPercent =
                            getDiscountPercent(
                              Number(p.price),
                              p.originalPrice ? Number(p.originalPrice) : null
                            ) ?? 0;

                          return (
                            <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {p.image ? (
                                    <img
                                      src={getProductImageUrl(p.image)}
                                      alt={p.name}
                                      className="w-8 h-8 rounded object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded flex-shrink-0 bg-muted flex items-center justify-center text-muted-foreground">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                        <circle cx="9" cy="9" r="2" />
                                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                      </svg>
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium line-clamp-1">{p.name}</p>
                                    {p.nameKh && (
                                      <p className="text-xs text-muted-foreground line-clamp-1">
                                        {p.nameKh}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-primary">
                                    ${Number(p.price).toFixed(2)}
                                  </span>
                                  {discountPercent > 0 && p.originalPrice && (
                                    <>
                                      <span className="text-xs text-muted-foreground line-through">
                                        ${Number(p.originalPrice).toFixed(2)}
                                      </span>
                                      <Badge className="bg-red-500 text-white border-0 text-[10px] font-bold">
                                        -{discountPercent}%
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-3">
                                <span className={`font-medium ${p.stock === 0 ? "text-destructive" : p.stock <= 10 ? "text-yellow-600" : ""}`}>
                                  {p.stock}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-muted-foreground text-xs">
                                {p.categoryName}
                              </td>

                              <td className="px-4 py-3">
                                {p.isFeatured && (
                                  <Badge className="text-xs bg-primary/10 text-primary border-0">★</Badge>
                                )}
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
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 p-4">
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                        {t("Prev", "មុន")}
                      </Button>
                      <span className="flex items-center text-xs text-muted-foreground px-2">
                        {page}/{totalPages}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                        {t("Next", "បន្ទាប់")}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={dialog === "create" || dialog === "edit"} onOpenChange={() => setDialog(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {dialog === "create" ? t("Add Product", "បន្ថែមផលិតផល") : t("Edit Product", "កែផលិតផល")}
              </DialogTitle>
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
                  <Select value={form.categoryId} onValueChange={(v) => setForm((p) => ({ ...p, categoryId: v }))}>
                    <SelectTrigger className="mt-1 h-8 text-sm">
                      <SelectValue placeholder={t("Select", "ជ្រើស")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t("Brand", "ម៉ាក")}</Label>
                  <Select value={form.brandId} onValueChange={(v) => setForm((p) => ({ ...p, brandId: v }))}>
                    <SelectTrigger className="mt-1 h-8 text-sm">
                      <SelectValue placeholder={t("Optional", "ស្រេចចិត្ត")} />
                    </SelectTrigger>
                    <SelectContent>
                      {brands?.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">{t("Product Image", "រូបភាពផលិតផល")}</Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={imageUploading}
                  className="mt-1 h-8 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("Upload JPG, PNG, or WEBP image. Maximum size 10MB.", "បញ្ចូលរូបភាព JPG, PNG ឬ WEBP។ ទំហំអតិបរមា 10MB។")}
                </p>

                {imageUploading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <Upload className="h-3.5 w-3.5 animate-pulse" />
                    {t("Uploading image...", "កំពុងបញ្ចូលរូបភាព...")}
                  </div>
                )}

                {form.image && (
                  <div className="mt-2 rounded-md border p-2 flex items-center gap-3">
                    <img
                      src={getProductImageUrl(form.image)}
                      alt="Product preview"
                      className="w-16 h-16 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">{t("Image preview", "មើលរូបភាពជាមុន")}</p>
                      <p className="text-xs text-muted-foreground truncate">{form.image}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setForm((p) => ({ ...p, image: "" }))}>
                      {t("Remove", "លុប")}
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs">{t("Tags", "ស្លាក")}</Label>
                <Input value={form.tags} onChange={f("tags")} placeholder="tag1,tag2" className="mt-1 h-8 text-sm" />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isFeatured}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, isFeatured: v }))}
                />
                <Label className="text-sm">{t("Featured product", "ផលិតផលពិសេស")}</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                  {t("Cancel", "បោះបង់")}
                </Button>
                <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending || imageUploading}>
                  {dialog === "create" ? t("Create", "បង្កើត") : t("Save", "រក្សាទុក")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Delete Product?", "លុបផលិតផល?")}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {t("This action cannot be undone.", "សកម្មភាពនេះមិនអាចត្រឡប់វិញ។")}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                {t("Cancel", "បោះបង់")}
              </Button>
              <Button variant="destructive" onClick={() => deleteId && deleteProduct.mutate({ id: deleteId })} disabled={deleteProduct.isPending}>
                {t("Delete", "លុប")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedRoute>
  );
}