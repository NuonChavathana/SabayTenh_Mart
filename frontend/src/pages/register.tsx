import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRegisterUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.user);
        toast({ title: t("Account created! Welcome!", "គណនីត្រូវបានបង្កើត! សូមស្វាគមន៍!") });
        navigate("/");
      },
      onError: () => {
        toast({ title: t("Registration failed. Email may already be in use.", "ចុះឈ្មោះបរាជ័យ។ អ៊ីម៉ែលអាចស្ថិតក្នុងការប្រើប្រាស់ហើយ។"), variant: "destructive" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ data: { name, email, phone: phone || undefined, password } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex flex-col items-center">
            <span className="text-3xl font-bold text-primary">SabayTenh</span>
            <span className="text-sm text-muted-foreground">សប្បាយទិញ</span>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{t("Create Account", "បង្កើតគណនី")}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("Full Name", "ឈ្មោះពេញ")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("Your name", "ឈ្មោះរបស់អ្នក")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("Email", "អ៊ីម៉ែល")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("Phone (optional)", "ទូរស័ព្ទ (ស្រេចចិត្ត)")}</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0xx xxx xxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("Password", "ពាក្យសម្ងាត់")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? t("Creating...", "កំពុងបង្កើត...") : t("Create Account", "បង្កើតគណនី")}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                {t("Already have an account?", "មានគណនីរួចហើយ?")} {" "}
                <Link href="/login" className="text-primary hover:underline font-medium">{t("Sign In", "ចូលគណនី")}</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
