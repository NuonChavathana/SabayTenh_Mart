import { useState } from "react";
import { Search, AlertTriangle, Package } from "lucide-react";
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
import { useListInventory, useUpdateInventory } from "@workspace/api-client-react";
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
        toast({ title: t("Stock updated!", "ស្តុកត្រូវបានធ្វើបច្ចុប្បន្នភាព!") });
      },
    },
  });

  const filtered = (inventory ?? []).filter((item: any) => {
    const matchSearch = !search || item.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "low" && item.stock > 0 && item.stock <= 10) || (filter === "out" && item.stock === 0);
    return matchSearch && matchFilter;
  });

  const handleUpdate = () => {
    if (!editing || !newQty) return;
    let stock = Number(newQty);
    if (adjustType === "add") stock = editing.stock + stock;
    else if (adjustType === "subtract") stock = Math.max(0, editing.stock - stock);
    updateInv.mutate({ productId: editing.productId, data: { stock } });
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <AdminLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{t("Inventory", "សន្និធិ")}</h1>
            <div className="flex gap-2 text-xs">
              <Badge variant="destructive">
                {(inventory ?? []).filter((i: any) => i.stock === 0).length} {t("out", "អស់")}
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">
                {(inventory ?? []).filter((i: any) => i.stock > 0 && i.stock <= 10).length} {t("low", "ទាប")}
              </Badge>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("Search products...", "ស្វែងរក...")} className="pl-9 h-9" />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All", "ទាំងអស់")}</SelectItem>
                <SelectItem value="low">{t("Low Stock (≤10)", "ស្តុកទាប")}</SelectItem>
                <SelectItem value="out">{t("Out of Stock", "អស់ស្តុក")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <Package className="h-10 w-10 mx-auto mb-2" />
                  {t("No products found", "រកមិនឃើញ")}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Product", "ផលិតផល")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Category", "ប្រភេទ")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Stock", "ស្តុក")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Status", "ស្ថានភាព")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Action", "សកម្មភាព")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map((item: any) => (
                        <tr key={item.productId} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                              )}
                              <span className="font-medium line-clamp-1">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{item.categoryName}</td>
                          <td className="px-4 py-3 font-bold">{item.stock}</td>
                          <td className="px-4 py-3">
                            {item.stock === 0 ? (
                              <Badge variant="destructive" className="text-xs">{t("Out", "អស់")}</Badge>
                            ) : item.stock <= 10 ? (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-0 text-xs gap-1">
                                <AlertTriangle className="h-3 w-3" />{t("Low", "ទាប")}
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
                              onClick={() => { setEditing(item); setNewQty(String(item.stock)); setAdjustType("set"); }}
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

        {/* Edit Dialog */}
        <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Update Stock", "ធ្វើបច្ចុប្បន្នភាពស្តុក")}</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-4">
                <p className="text-sm font-medium">{editing.name}</p>
                <p className="text-sm text-muted-foreground">{t("Current stock:", "ស្តុកបច្ចុប្បន្ន:")} <strong>{editing.stock}</strong></p>
                <div>
                  <Label>{t("Adjustment Type", "ប្រភេទ")}</Label>
                  <Select value={adjustType} onValueChange={setAdjustType}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="set">{t("Set to value", "កំណត់ជា")}</SelectItem>
                      <SelectItem value="add">{t("Add to stock", "បន្ថែម")}</SelectItem>
                      <SelectItem value="subtract">{t("Subtract from stock", "ដក")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("Quantity", "បរិមាណ")}</Label>
                  <Input type="number" value={newQty} onChange={e => setNewQty(e.target.value)} min="0" className="mt-1" />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>{t("Cancel", "បោះបង់")}</Button>
              <Button onClick={handleUpdate} disabled={updateInv.isPending}>{t("Update", "ធ្វើបច្ចុប្បន្ន")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedRoute>
  );
}
