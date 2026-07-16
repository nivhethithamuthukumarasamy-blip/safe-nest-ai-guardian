import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user) navigate({ to: "/dashboard" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader variant="public" />
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl place-items-center px-4">
        <div className="grid w-full gap-10 lg:grid-cols-2">
          <div className="hidden lg:flex flex-col justify-center rounded-3xl bg-hero p-12 text-primary-foreground shadow-glow">
            <ShieldCheck className="h-10 w-10 opacity-80" />
            <h2 className="mt-6 font-display text-3xl font-bold">Protecting Indian borrowers with transparent AI.</h2>
            <p className="mt-4 text-primary-foreground/80">
              Every score is deterministic. Every recommendation is explainable. Nothing is hidden.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
            <h1 className="font-display text-2xl font-bold">{t("auth.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("auth.sub")}</p>

            <Button onClick={google} disabled={busy} variant="outline" className="mt-6 w-full">
              {t("auth.google")}
            </Button>

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> or {mode === "signup" ? "sign up" : "sign in"} with email
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <Label htmlFor="name">{t("auth.name")}</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              )}
              <div>
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div>
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {mode === "signup" ? t("auth.signUp") : t("auth.signIn")}
              </Button>
            </form>

            <button
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {mode === "signup" ? t("auth.switchToSignIn") : t("auth.switchToSignUp")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
