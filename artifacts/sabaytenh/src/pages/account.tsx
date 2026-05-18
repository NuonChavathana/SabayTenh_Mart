import { useState } from "react";
import { User, Mail, Phone, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { RootLayout } from "@/components/layout/RootLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  staff: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  cashier: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  customer: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function AccountPage() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast({ title: t("Passwords don't match.", "ពាក្យសម្ងាត់មិនត្រូវគ្នា។"), variant: "destructive" });
      return;
    }
    if (newPw.length < 6) {
      toast({ title: t("Password must be at least 6 characters.", "ពាក្យសម្ងាត់ត្រូវតែ 6 តួយ៉ាងតិច។"), variant: "destructive" });
      return;
    }
    toast({ title: t("Password changed! (Demo mode)", "ពាក្យសម្ងាត់ត្រូវបានប្ដូរ! (ដេម)") });
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
  };

  return (
    <ProtectedRoute>
      <RootLayout>
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <h1 className="text-2xl font-bold mb-6">{t("My Account", "គណនីរបស់ខ្ញុំ")}</h1>

          {/* Profile */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">{t("Profile", "ប្រវត្តិ")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg">{user?.name}</p>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_COLORS[user?.role ?? "customer"]}`}>
                    {user?.role}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>{t("Member since", "សមាជិកចាប់ពី")} {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">{t("Change Password", "ប្ដូរពាក្យសម្ងាត់")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div>
                  <Label>{t("Current Password", "ពាក្យសម្ងាត់បច្ចុប្បន្ន")}</Label>
                  <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" required />
                </div>
                <div>
                  <Label>{t("New Password", "ពាក្យសម្ងាត់ថ្មី")}</Label>
                  <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" required minLength={6} />
                </div>
                <div>
                  <Label>{t("Confirm Password", "បញ្ជាក់ពាក្យសម្ងាត់")}</Label>
                  <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" required />
                </div>
                <Button type="submit" className="w-full">{t("Update Password", "ធ្វើបច្ចុប្បន្នភាព")}</Button>
              </form>
            </CardContent>
          </Card>

          {/* Danger zone */}
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
