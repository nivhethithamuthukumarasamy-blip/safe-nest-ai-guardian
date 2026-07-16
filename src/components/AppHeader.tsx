import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LANGS, useI18n, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, ShieldCheck, LogOut, Menu } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export function AppHeader({ variant = "public" }: { variant?: "public" | "app" }) {
  const { t, lang, setLang } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const navItems = variant === "app"
    ? [
        { to: "/dashboard", label: t("nav.dashboard") },
        { to: "/loan-analyzer", label: t("nav.analyzer") },
        { to: "/financial-health", label: t("nav.health") },
        { to: "/schemes", label: t("nav.schemes") },
        { to: "/marketplace", label: t("nav.marketplace") },
        { to: "/ai-settings", label: t("nav.settings") },
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-hero text-primary-foreground shadow-glow">
            <ShieldCheck className="h-4 w-4" />
          </span>
          SafeNest AI
        </Link>

        {variant === "app" && (
          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:bg-secondary [&.active]:text-foreground"
                activeProps={{ className: "active" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{LANGS.find((l) => l.code === lang)?.native}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LANGS.map((l) => (
                <DropdownMenuItem key={l.code} onSelect={() => setLang(l.code as Lang)}>
                  {l.native} <span className="ml-auto text-xs text-muted-foreground">{l.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              className="gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t("cta.signOut")}</span>
            </Button>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link to="/auth">{t("cta.signIn")}</Link>
            </Button>
          )}

          {variant === "app" && (
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((o) => !o)}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {variant === "app" && open && (
        <nav className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
