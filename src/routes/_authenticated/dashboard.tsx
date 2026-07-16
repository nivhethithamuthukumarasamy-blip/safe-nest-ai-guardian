import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { TrustBadge } from "@/components/TrustBadge";
import { Button } from "@/components/ui/button";
import { FileSearch, Activity, Landmark, Building2, Settings, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · SafeNest AI" },
      { name: "description", content: "Your financial safety cockpit — loan analyses, health score, matched schemes." },
    ],
  }),
  component: Dashboard,
});

interface Profile {
  display_name: string | null;
  trust_score: number;
  mobile_verified: boolean;
  email_verified: boolean;
  id_verified: boolean;
}

function Dashboard() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ analyses: 0, snapshots: 0 });

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) return;
      const [{ data: p }, { count: a }, { count: s }] = await Promise.all([
        supabase.from("profiles").select("display_name, trust_score, mobile_verified, email_verified, id_verified").eq("id", uid).maybeSingle(),
        supabase.from("loan_analyses").select("*", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("financial_snapshots").select("*", { count: "exact", head: true }).eq("user_id", uid),
      ]);
      if (p) setProfile(p as Profile);
      setStats({ analyses: a ?? 0, snapshots: s ?? 0 });
    })();
  }, []);

  const tiles = [
    { to: "/loan-analyzer", label: t("nav.analyzer"), icon: FileSearch, desc: "Paste a loan doc, get an honest read.", accent: "bg-hero" },
    { to: "/financial-health", label: t("nav.health"), icon: Activity, desc: "Score your household finances.", accent: "bg-trust-gradient" },
    { to: "/schemes", label: t("nav.schemes"), icon: Landmark, desc: "Find schemes matched to you.", accent: "bg-warn-gradient" },
    { to: "/marketplace", label: t("nav.marketplace"), icon: Building2, desc: "Verified borrowers and lenders.", accent: "bg-hero" },
    { to: "/ai-settings", label: t("nav.settings"), icon: Settings, desc: "Configure your AI model.", accent: "bg-trust-gradient" },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {t("dashboard.welcome")}{profile?.display_name ? `, ${profile.display_name}` : ""}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("dashboard.sub")}</p>
        </div>
        {profile && <TrustBadge score={profile.trust_score} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Loan analyses" value={stats.analyses} icon={FileSearch} />
        <StatCard label="Health snapshots" value={stats.snapshots} icon={Activity} />
        <StatCard label="Trust score" value={profile?.trust_score ?? 0} icon={Sparkles} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.to}
            to={tile.to}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-glow hover:-translate-y-0.5"
          >
            <div className={`mb-4 inline-grid h-12 w-12 place-items-center rounded-xl text-primary-foreground ${tile.accent}`}>
              <tile.icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">{tile.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{tile.desc}</p>
            <Button variant="ghost" size="sm" className="mt-4 -ml-2 group-hover:translate-x-1 transition-transform">
              Open →
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-6 shadow-card">
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 font-display text-3xl font-bold">{value}</div>
      </div>
      <Icon className="h-8 w-8 text-muted-foreground/50" />
    </div>
  );
}
