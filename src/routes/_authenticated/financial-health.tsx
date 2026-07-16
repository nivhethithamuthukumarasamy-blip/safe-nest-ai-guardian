import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { explainHealth } from "@/lib/ai.functions";
import { calcFinancialHealth, type FinancialInputs } from "@/lib/scoring";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/_authenticated/financial-health")({
  head: () => ({
    meta: [
      { title: "Financial Health · SafeNest AI" },
      { name: "description", content: "Transparent financial health scoring with AI-explained recommendations." },
    ],
  }),
  component: HealthPage,
});

function HealthPage() {
  const { t } = useI18n();
  const [inputs, setInputs] = useState<FinancialInputs>({
    monthlyIncome: 50000, monthlyExpenses: 30000, monthlyEmi: 8000,
    totalDebt: 200000, savings: 60000, dependents: 2,
  });
  const [scores, setScores] = useState<ReturnType<typeof calcFinancialHealth> | null>(null);
  const [explanation, setExplanation] = useState("");
  const [busy, setBusy] = useState(false);
  const explain = useServerFn(explainHealth);

  function calculate() {
    const s = calcFinancialHealth(inputs);
    setScores(s);
    setExplanation("");
  }

  async function saveAndExplain() {
    if (!scores) return;
    setBusy(true);
    try {
      const model = (typeof window !== "undefined" && localStorage.getItem("safenest.model")) || "openai/gpt-5.5";
      const r = await explain({ data: { scores: { healthScore: scores.healthScore, dti: scores.dti, emiBurden: scores.emiBurden, savingsRatio: scores.savingsRatio, expensePressure: scores.expensePressure }, inputs, model } });
      setExplanation(r.explanation);

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (uid) {
        await supabase.from("financial_snapshots").insert({
          user_id: uid,
          monthly_income: inputs.monthlyIncome,
          monthly_expenses: inputs.monthlyExpenses,
          monthly_emi: inputs.monthlyEmi,
          total_debt: inputs.totalDebt,
          savings: inputs.savings,
          dependents: inputs.dependents,
          health_score: scores.healthScore,
          dti: scores.dti,
          emi_burden: scores.emiBurden,
          savings_ratio: scores.savingsRatio,
          ai_notes: r.explanation,
        });
      }
      toast.success("Snapshot saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const fields: [keyof FinancialInputs, string][] = [
    ["monthlyIncome", t("health.income")],
    ["monthlyExpenses", t("health.expenses")],
    ["monthlyEmi", t("health.emi")],
    ["totalDebt", t("health.debt")],
    ["savings", t("health.savings")],
    ["dependents", t("health.dependents")],
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("health.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("health.sub")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          {fields.map(([key, label]) => (
            <div key={key}>
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type="number"
                min={0}
                value={inputs[key]}
                onChange={(e) => setInputs({ ...inputs, [key]: Number(e.target.value) || 0 })}
              />
            </div>
          ))}
          <Button onClick={calculate} className="w-full">{t("cta.calculate")}</Button>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {scores ? (
            <>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "score", value: scores.healthScore, fill: scores.healthScore >= 70 ? "oklch(0.62 0.16 155)" : scores.healthScore >= 40 ? "oklch(0.75 0.15 75)" : "oklch(0.6 0.22 25)" }]} startAngle={90} endAngle={-270}>
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar background dataKey="value" cornerRadius={12} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="-mt-40 text-center">
                      <div className="font-display text-5xl font-bold">{scores.healthScore}</div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("health.score")}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Metric label={t("health.dti")} value={`${(scores.dti * 100).toFixed(1)}%`} hint={scores.dti > 0.5 ? "High" : "Healthy"} />
                    <Metric label={t("health.emiBurden")} value={`${(scores.emiBurden * 100).toFixed(1)}%`} hint={scores.emiBurden > 0.4 ? "Above safe limit" : "Manageable"} />
                    <Metric label={t("health.savingsRatio")} value={`${scores.savingsRatio.toFixed(1)} mo`} hint={scores.savingsRatio < 3 ? "Build buffer" : "Good cushion"} />
                    <Metric label="Expense pressure" value={`${(scores.expensePressure * 100).toFixed(1)}%`} hint={scores.expensePressure > 0.7 ? "Tight" : "Comfortable"} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="font-semibold">Score breakdown</h3>
                  <span className="text-xs text-muted-foreground">Transparent — no AI involved</span>
                </div>
                <div className="space-y-2">
                  {scores.breakdown.map((b) => (
                    <div key={b.label}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted-foreground">{b.label} (weight {(b.weight * 100).toFixed(0)}%)</span>
                        <span className="font-medium">{b.value.toFixed(0)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-accent" style={{ width: `${b.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={saveAndExplain} disabled={busy} size="lg" className="w-full gap-2">
                <Sparkles className="h-4 w-4" />
                {busy ? "Thinking..." : t("cta.explain")}
              </Button>

              {explanation && (
                <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-accent">
                    <Sparkles className="h-3 w-3" /> AI COACH
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{explanation}</p>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Fill in your details and calculate to see your score.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 flex items-baseline justify-between gap-2">
        <div className="font-display text-xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
    </div>
  );
}
