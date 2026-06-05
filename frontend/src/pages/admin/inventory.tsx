import { useState } from "react";
import { Search, AlertTriangle, Package, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useListInventory,
  useUpdateInventory,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function InventoryPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<any>(null);
  const [newQty, setNewQty] = useState("");
  const [adjustType, setAdjustType] = useState("set");

  const { data: inventory, isLoading } = useListInventory();

  const updateInv = useUpdateInventory({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/inventory"] });
        setEditing(null);
        setNewQty("");
        setAdjustType("set");

        toast({
          title: t(
            "Stock updated!",
            "ស្តុកត្រូវបានធ្វើបច្ចុប្បន្នភាព!"
          ),
        });
      },
      onError: () => {
        toast({
          title: t(
            "Update failed",
            "ធ្វើបច្ចុប្បន្នភាពបរាជ័យ"
          ),
          description: t(
            "Cannot update stock. Please try again.",
            "មិនអាចធ្វើបច្ចុប្បន្នភាពស្តុកបានទេ។ សូមព្យាយាមម្តងទៀត។"
          ),
          variant: "destructive",
        });
      },
    },
  });

  const filtered = (inventory ?? []).filter((item: any) => {
    const matchSearch =
      !search || item.productName?.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === "all" ||
      (filter === "low" && item.stock > 0 && item.stock <= 10) ||
      (filter === "out" && item.stock === 0);

    return matchSearch && matchFilter;
  });

  const openUpdateDialog = (item: any) => {
    setEditing(item);
    setNewQty(String(item.stock));
    setAdjustType("set");
  };

  const closeUpdateDialog = () => {
    setEditing(null);
    setNewQty("");
    setAdjustType("set");
  };

  const handleQuantityChange = (value: string) => {
    // Allow empty value while typing
    if (value === "") {
      setNewQty("");
      return;
    }

    // Allow only positive whole numbers
    if (/^\d+$/.test(value)) {
      setNewQty(value);
    }
  };

  const handleUpdate = () => {
    if (!editing) return;

    if (newQty.trim() === "") {
      toast({
        title: t(
          "Please enter quantity",
          "សូមបញ្ចូលចំនួនស្តុក"
        ),
        variant: "destructive",
      });
      return;
    }

    const qty = Number(newQty);

    if (Number.isNaN(qty) || qty < 0) {
      toast({
        title: t(
          "Invalid quantity",
          "ចំនួនមិនត្រឹមត្រូវ"
        ),
        variant: "destructive",
      });
      return;
    }

    let stock = qty;

    if (adjustType === "add") {
      stock = editing.stock + qty;
    } else if (adjustType === "subtract") {
      stock = editing.stock - qty;
    }

    if (stock < 0) {
      toast({
        title: t(
          "Invalid stock",
          "ស្តុកមិនត្រឹមត្រូវ"
        ),
        description: t(
          "Stock cannot be less than 0.",
          "ស្តុកមិនអាចតិចជាង 0 បានទេ។"
        ),
        variant: "destructive",
      });
      return;
    }

    updateInv.mutate({
      productId: editing.productId,
      data: { stock },
    });
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <AdminLayout>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">
              {t("Inventory", "សន្និធិ")}
            </h1>

            <div className="flex gap-2 text-xs">
              <Badge variant="destructive">
                {(inventory ?? []).filter((i: any) => i.stock === 0).length}{" "}
                {t("out", "អស់")}
              </Badge>

              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">
                {
                  (inventory ?? []).filter(
                    (i: any) => i.stock > 0 && i.stock <= 10
                  ).length
                }{" "}
                {t("low", "ទាប")}
              </Badge>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search products...", "ស្វែងរកផលិតផល...")}
                className="pl-9 h-9"
              />
            </div>

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  {t("All", "ទាំងអស់")}
                </SelectItem>

                <SelectItem value="low">
                  {t("Low Stock (≤10)", "ស្តុកទាប")}
                </SelectItem>

                <SelectItem value="out">
                  {t("Out of Stock", "អស់ស្តុក")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inventory Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <Package className="h-10 w-10 mx-auto mb-2" />
                  {t("No products found", "រកមិនឃើញផលិតផល")}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          {t("Product", "ផលិតផល")}
                        </th>

                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          {t("Category", "ប្រភេទ")}
                        </th>

                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          {t("Stock", "ស្តុក")}
                        </th>

                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          {t("Status", "ស្ថានភាព")}
                        </th>

                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          {t("Action", "សកម្មភាព")}
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {filtered.map((item: any) => (
                        <tr
                          key={item.productId}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.productNameKh}
                              </p>
                            </div>
                          </td>
                        
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {item.categoryName}
                          </td>

                          <td className="px-4 py-3 font-bold">
                            {item.stock}
                          </td>

                          <td className="px-4 py-3">
                            {item.stock === 0 ? (
                              <Badge variant="destructive" className="text-xs">
                                {t("Out", "អស់")}
                              </Badge>
                            ) : item.stock <= 10 ? (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-0 text-xs gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {t("Low", "ទាប")}
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0 text-xs">
                                {t("OK", "ល្អ")}
                              </Badge>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => openUpdateDialog(item)}
                            >
                              {t("Update", "ធ្វើបច្ចុប្បន្ន")}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Old Style Custom Popup */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-[520px] rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-950">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {t("Update Stock", "ធ្វើបច្ចុប្បន្នភាពស្តុក")}
                </h2>

                <button
                  type="button"
                  onClick={closeUpdateDialog}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5">
                <p className="text-sm font-medium">
                  {editing.productName}
                </p>

                <p className="text-sm text-muted-foreground">
                  {t("Current stock:", "ស្តុកបច្ចុប្បន្ន:")}{" "}
                  <strong className="text-foreground">
                    {editing.stock}
                  </strong>
                </p>

                <div className="space-y-2">
                  <Label>
                    {t("Adjustment Type", "ប្រភេទកែប្រែស្តុក")}
                  </Label>

                  <Select value={adjustType} onValueChange={setAdjustType}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="set">
                        {t("Set to value", "កំណត់ជាចំនួនថ្មី")}
                      </SelectItem>

                      <SelectItem value="add">
                        {t("Add to stock", "បន្ថែមស្តុក")}
                      </SelectItem>

                      <SelectItem value="subtract">
                        {t("Subtract from stock", "ដកស្តុក")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    {t("Quantity", "បរិមាណ")}
                  </Label>

                  <Input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={newQty}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-", "."].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    placeholder={t(
                      "Enter stock quantity",
                      "បញ្ចូលចំនួនស្តុក"
                    )}
                    className="h-11 border-orange-400 focus-visible:ring-orange-500"
                    autoFocus
                  />
                </div>

                {adjustType === "subtract" &&
                  newQty !== "" &&
                  Number(newQty) > editing.stock && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      {t(
                        "Stock cannot be less than 0.",
                        "ស្តុកមិនអាចតិចជាង 0 បានទេ។"
                      )}
                    </div>
                  )}

                <div className="flex justify-end gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeUpdateDialog}
                    disabled={updateInv.isPending}
                  >
                    {t("Cancel", "បោះបង់")}
                  </Button>

                  <Button
                    type="button"
                    onClick={handleUpdate}
                    disabled={updateInv.isPending}
                    className="bg-orange-500 text-white hover:bg-orange-600"
                  >
                    {updateInv.isPending
                      ? t(
                          "Updating...",
                          "កំពុងធ្វើបច្ចុប្បន្ន..."
                        )
                      : t(
                          "Update",
                          "ធ្វើបច្ចុប្បន្ន"
                        )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}