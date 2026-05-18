import { useState } from "react";
import { User, Mail, Phone, Shield, Edit3, Check, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { RootLayout } from "@/components/layout/RootLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useUpdateProfile, useChangePassword } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  staff: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  cashier: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  customer: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const ROLE_LABELS: Record<string, [string, string]> = {
  admin: ["Administrator", "អ្នកគ្រប់គ្រង"],
  staff: ["Staff", "បុគ្គលិក"],
  cashier: ["Cashier", "គណនេយ្យករ"],
  customer: ["Customer", "អតិថិជន"],
};

export default function AccountPage() {
  const { t } = useLanguage();
  const { user, login, token } = useAuth();
  const qc = useQueryClient();

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editPhone, setEditPhone] = useState(user?.phone ?? "");

  // Password change state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const updateProfile = useUpdateProfile({
    mutation: {
      onSuccess: (updatedUser) => {
        // Refresh auth context with updated user data
        if (token) login(token, updatedUser);
        qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
        setEditingProfile(false);
        toast({ title: t("Profile updated!", "ព័ត៌មានត្រូវបានធ្វើបច្ចុប្បន្នភាព!") });
      },
      onError: () => {
        toast({ title: t("Failed to update profile.", "មិនអាចធ្វើបច្ចុប្បន្នភាពបានទេ។"), variant: "destructive" });
      },
    },
  });

  const changePassword = useChangePassword({
    mutation: {
      onSuccess: () => {
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
        toast({ title: t("Password changed successfully!", "ពាក្យសម្ងាត់ត្រូវបានប្ដូរ!") });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? "Failed to change password.";
        toast({
          title: msg === "Current password is incorrect"
            ? t("Current password is incorrect.", "ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវ។")
            : t("Failed to change password.", "មិនអាចប្ដូរពាក្យសម្ងាត់បានទេ។"),
          variant: "destructive",
        });
      },
    },
  });

  const handleProfileSave = () => {
    if (!editName.trim()) {
      toast({ title: t("Name is required.", "ឈ្មោះត្រូវតែបំពេញ។"), variant: "destructive" });
      return;
    }
    updateProfile.mutate({ data: { name: editName.trim(), phone: editPhone.trim() || undefined } });
  };

  const handleProfileCancel = () => {
    setEditName(user?.name ?? "");
    setEditPhone(user?.phone ?? "");
    setEditingProfile(false);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast({ title: t("Passwords don't match.", "ពាក្យសម្ងាត់មិនត្រូវគ្នា។"), variant: "destructive" });
      return;
    }
    if (newPw.length < 6) {
      toast({ title: t("Password must be at least 6 characters.", "ពាក្យសម្ងាត់ត្រូវតែ 6 តួ។"), variant: "destructive" });
      return;
    }
    changePassword.mutate({ data: { currentPassword: currentPw, newPassword: newPw } });
  };

  const { logout } = useAuth();
  const roleLabel = ROLE_LABELS[user?.role ?? "customer"] ?? ["Customer", "អតិថិជន"];

  return (
    <ProtectedRoute>
      <RootLayout>
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <h1 className="text-2xl font-bold mb-6">{t("My Account", "គណនីរបស់ខ្ញុំ")}</h1>

          {/* Profile Card */}
          <Card className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">{t("Profile", "ព័ត៌មានផ្ទាល់ខ្លួន")}</CardTitle>
              {!editingProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setEditName(user?.name ?? ""); setEditPhone(user?.phone ?? ""); setEditingProfile(true); }}
                  className="h-8 gap-1.5 text-xs text-muted-foreground"
                >
                  <Edit3 className="h-3.5 w-3.5" /> {t("Edit", "កែប្រែ")}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar + role */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg leading-tight">{user?.name}</p>
                  <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium mt-1 ${ROLE_COLORS[user?.role ?? "customer"]}`}>
                    {t(roleLabel[0], roleLabel[1])}
                  </span>
                </div>
              </div>

              {editingProfile ? (
                <div className="space-y-3 pt-1">
                  <div>
                    <Label className="text-xs">{t("Full Name", "ឈ្មោះពេញ")}</Label>
                    <Input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="mt-1 h-9"
                      placeholder={t("Your name", "ឈ្មោះរបស់អ្នក")}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("Phone", "ទូរស័ព្ទ")}</Label>
                    <Input
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      className="mt-1 h-9"
                      placeholder="0xx xxx xxx"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={handleProfileSave}
                      disabled={updateProfile.isPending}
                      className="gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {updateProfile.isPending ? t("Saving...", "កំពុងរក្សាទុក...") : t("Save", "រក្សាទុក")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleProfileCancel} className="gap-1.5">
                      <X className="h-3.5 w-3.5" /> {t("Cancel", "បោះបង់")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 text-sm pt-1">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{user?.email}</span>
                  </div>
                  {user?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {t("Member since", "សមាជិកចាប់ពី")} {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("Change Password", "ប្ដូរពាក្យសម្ងាត់")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div>
                  <Label className="text-xs">{t("Current Password", "ពាក្យសម្ងាត់បច្ចុប្បន្ន")}</Label>
                  <Input
                    type="password"
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("New Password", "ពាក្យសម្ងាត់ថ្មី")}</Label>
                  <Input
                    type="password"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("Confirm New Password", "បញ្ជាក់ពាក្យសម្ងាត់ថ្មី")}</Label>
                  <Input
                    type="password"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="mt-1 h-9"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={changePassword.isPending || !currentPw || !newPw || !confirmPw}
                >
                  {changePassword.isPending ? t("Updating...", "កំពុងធ្វើបច្ចុប្បន្នភាព...") : t("Update Password", "ធ្វើបច្ចុប្បន្នភាព")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sign out */}
          <Card className="border-destructive/30">
            <CardContent className="pt-5">
              <Button variant="destructive" className="w-full" onClick={logout}>
                {t("Sign Out", "ចេញពីគណនី")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </RootLayout>
    </ProtectedRoute>
  );
}
