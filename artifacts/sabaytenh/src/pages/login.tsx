import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLoginUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.user);
        toast({ title: t("Welcome back!", "ស្វាគមន៍មករក!") });
        navigate("/");
      },
      onError: () => {
        toast({ title: t("Invalid email or password.", "អ៊ីម៉ែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ។"), variant: "destructive" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex flex-col items-center">
            <span className="text-3xl font-bold text-primary">SabayTenh</span>
            <span className="text-sm text-muted-foreground">សប្បាយទិញ</span>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{t("Sign In", "ចូលគណនី")}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("Email", "អ៊ីម៉ែល")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
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
                  autoComplete="current-password"
                />
              </div>
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                {t("Demo:", "គណនីសាកល្បង:")} customer@gmail.com / password123
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? t("Signing in...", "កំពុងចូល...") : t("Sign In", "ចូលគណនី")}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                {t("Don't have an account?", "មិនទាន់មានគណនី?")} {" "}
                <Link href="/register" className="text-primary hover:underline font-medium">{t("Register", "ចុះឈ្មោះ")}</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
