import { useState } from "react";
import { Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListUsers, useUpdateUserRole, UserRoleUpdateRole } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  staff: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  cashier: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  customer: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: users, isLoading } = useListUsers();

  const updateRole = useUpdateUserRole({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/users"] });
        toast({ title: t("User role updated.", "តួនាទីអ្នកប្រើត្រូវបានធ្វើបច្ចុប្បន្ន។") });
      },
    },
  });

  const filtered = (users ?? []).filter((u: any) => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{t("User Management", "គ្រប់គ្រងអ្នកប្រើ")}</h1>
            <span className="text-sm text-muted-foreground">{filtered.length} {t("users", "អ្នកប្រើ")}</span>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t("Search by name or email...", "ស្វែងរក...")}
                className="pl-9 h-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Roles", "តួនាទីទាំងអស់")}</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">{t("No users found", "រកមិនឃើញ")}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("User", "អ្នកប្រើ")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Phone", "ទូរស័ព្ទ")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Joined", "ចូលរួមពី")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Role", "តួនាទី")}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Change Role", "ប្ដូរ")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map((u: any) => (
                        <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                {u.name?.[0]?.toUpperCase()}
                              </div>
                              <span className="font-medium">{u.name}</span>
                              {u.id === currentUser?.id && (
                                <Badge className="text-[10px] bg-primary/10 text-primary border-0 py-0">{t("You", "អ្នក")}</Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{u.phone ?? "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_COLORS[u.role]}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={u.role}
                              disabled={u.id === currentUser?.id}
                              onValueChange={(v) => updateRole.mutate({ id: u.id, data: { role: v as UserRoleUpdateRole } })}
                            >
                              <SelectTrigger className="h-7 text-xs w-28" disabled={u.id === currentUser?.id}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(UserRoleUpdateRole).map(r => (
                                  <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
      </AdminLayout>
    </ProtectedRoute>
  );
}
