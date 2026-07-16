import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { ShieldCheck, FileSearch, Activity, Building2, Landmark, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { t } = useI18n();

  const features = [
    {
      icon: FileSearch,
      title: t("nav.analyzer"),
      desc: "Upload or paste any loan document. Our AI extracts terms, flags hidden fees, and rewrites it in your language.",
    },
    {
      icon: Activity,
      title: t("nav.health"),
      desc: "Transparent scoring for your DTI, EMI burden, and savings ratio — with AI that explains the numbers.",
    },
    {
      icon: Landmark,
      title: t("nav.schemes"),
      desc: "Discover eligible government schemes — Mudra, PMJJBY, PMAY, Stand-Up India — matched to your situation.",
    },
    {
      icon: Building2,
      title: t("nav.marketplace"),
      desc: "Verified borrowers meet trusted lenders. Trust badges on every profile.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader variant="public" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero opacity-95" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, oklch(0.7 0.16 165 / 0.4), transparent 40%), radial-gradient(circle at 80% 70%, oklch(0.55 0.15 235 / 0.3), transparent 40%)",
        }} />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              Built for Indian borrowers · Powered by transparent AI
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              {t("app.hero.title")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-primary-foreground/85">
              {t("app.hero.sub")}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Link to="/auth">{t("cta.getStarted")}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <a href="#features">{t("cta.tryDemo")}</a>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-primary-foreground/80">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4" /> No hidden fees, ever
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4" /> Data encrypted end-to-end
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4" /> 6 Indian languages
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Four tools. One safety net.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every feature runs on transparent scoring plus explainable AI. Numbers you can verify, advice you can trust.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-glow hover:-translate-y-1">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-hero text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-trust-gradient p-10 text-primary-foreground shadow-glow sm:p-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Your first loan analysis is free.
            </h2>
            <p className="mt-4 text-primary-foreground/85">
              Sign up in seconds. Paste any loan agreement. Get an honest read in under a minute.
            </p>
            <Button asChild size="lg" className="mt-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Link to="/auth">{t("cta.getStarted")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SafeNest AI · Built for financial safety in India
      </footer>
    </div>
  );
}
