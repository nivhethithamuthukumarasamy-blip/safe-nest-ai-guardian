import { createFileRoute, useServerFn } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { matchSchemes } from "@/lib/ai.functions";
import { SCHEMES, type Scheme } from "@/lib/schemes";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Landmark, ExternalLink, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/schemes")({
  head: () => ({
    meta: [
      { title: "Government Schemes · SafeNest AI" },
      { name: "description", content: "Browse and match with Indian government financial schemes — Mudra, PMJJBY, PMAY, PM Kisan, and more." },
    ],
  }),
  component: SchemesPage,
});

function SchemesPage() {
  const { t } = useI18n();
  const [situation, setSituation] = useState("I run a small tailoring shop and want a loan to buy new machines.");
  const [matches, setMatches] = useState<{ id: string; reason: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const match = useServerFn(matchSchemes);

  async function find() {
    setBusy(true);
    try {
      const model = (typeof window !== "undefined" && localStorage.getItem("safenest.model")) || "openai/gpt-5.5";
      const r = await match({ data: { situation, model } });
      setMatches(r.matches);
      if (r.matches.length === 0) toast.info("No strong matches. Try describing your situation differently.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Match failed");
    } finally {
      setBusy(false);
    }
  }

  const matchedIds = new Set(matches.map((m) => m.id));
  const ordered = [...SCHEMES].sort((a, b) => (matchedIds.has(b.id) ? 1 : 0) - (matchedIds.has(a.id) ? 1 : 0));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("schemes.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("schemes.sub")}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <label className="mb-2 block text-sm font-medium">Tell us about your situation</label>
        <Textarea value={situation} onChange={(e) => setSituation(e.target.value)} className="min-h-[100px]" maxLength={1000} />
        <Button onClick={find} disabled={busy} className="mt-4 gap-2">
          <Sparkles className="h-4 w-4" />
          {busy ? "Matching..." : t("schemes.match")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ordered.map((s) => (
          <SchemeCard key={s.id} s={s} reason={matches.find((m) => m.id === s.id)?.reason} />
        ))}
      </div>
    </div>
  );
}

function SchemeCard({ s, reason }: { s: Scheme; reason?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-card transition-all ${reason ? "border-accent shadow-glow bg-accent/5" : "border-border bg-card"}`}>
      {reason && (
        <div className="absolute -top-1 right-4 rounded-b-md bg-accent px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
          MATCH
        </div>
      )}
      <div className="mb-2 flex items-start gap-2">
        <Landmark className="h-4 w-4 flex-none mt-1 text-accent" />
        <h3 className="font-semibold leading-tight">{s.name}</h3>
      </div>
      <div className="text-xs text-muted-foreground">{s.ministry}</div>
      <p className="mt-3 text-sm">{s.benefit}</p>
      <dl className="mt-3 space-y-1 text-xs">
        <div><dt className="inline text-muted-foreground">Amount: </dt><dd className="inline font-medium">{s.amount}</dd></div>
        <div><dt className="inline text-muted-foreground">Eligible: </dt><dd className="inline">{s.eligibility}</dd></div>
      </dl>
      {reason && (
        <div className="mt-3 rounded-md bg-accent/10 p-2 text-xs text-accent-foreground">
          <span className="font-semibold">Why it fits: </span>{reason}
        </div>
      )}
      <a href={s.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
        Official site <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
