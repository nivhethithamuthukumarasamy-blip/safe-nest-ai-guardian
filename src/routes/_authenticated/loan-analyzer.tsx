import { createFileRoute, useServerFn } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { analyzeLoan } from "@/lib/ai.functions";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Sparkles, ShieldAlert, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/loan-analyzer")({
  head: () => ({
    meta: [
      { title: "Loan Analyzer · SafeNest AI" },
      { name: "description", content: "AI-powered loan document analysis: extracts terms, flags predatory clauses, rewrites in plain language." },
    ],
  }),
  component: Analyzer,
});

const SAMPLE = `LOAN AGREEMENT
Principal: Rs. 50,000
Tenure: 90 days
Interest rate: 3% per week (approximately 156% APR)
Processing fee: Rs. 5,000 (deducted upfront)
Late payment penalty: Rs. 500 per day
Prepayment penalty: 10% of outstanding principal
Insurance premium: Rs. 3,000 (mandatory, non-refundable)
Total repayment: Rs. 89,000
By signing, borrower authorises daily automatic debit and consents to lender contacting all mobile contacts in case of default.`;

interface Analysis {
  id: string;
  title: string;
  risk_score: number;
  risk_level: string;
  summary: string;
  extracted: Record<string, string | null>;
  red_flags: { severity: string; clause: string; concern: string }[];
  created_at: string;
}

function Analyzer() {
  const { t } = useI18n();
  const [title, setTitle] = useState("Personal loan offer");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ analysis: Analysis; recommendation: string } | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const run = useServerFn(analyzeLoan);

  async function loadHistory() {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) return;
    const { data } = await supabase
      .from("loan_analyses")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(10);
    setHistory((data ?? []) as Analysis[]);
  }

  useEffect(() => { loadHistory(); }, []);

  async function submit() {
    if (text.trim().length < 20) {
      toast.error("Please paste at least 20 characters of loan text.");
      return;
    }
    setBusy(true);
    try {
      const model = (typeof window !== "undefined" && localStorage.getItem("safenest.model")) || "openai/gpt-5.5";
      const r = await run({ data: { title, text, model } });
      setResult(r as { analysis: Analysis; recommendation: string });
      toast.success("Analysis complete");
      loadHistory();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("analyzer.title")}</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">{t("analyzer.sub")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div>
            <Label htmlFor="title">{t("analyzer.titleField")}</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="doc">Document text</Label>
              <button
                type="button"
                onClick={() => { setText(SAMPLE); setTitle("Demo predatory loan"); }}
                className="text-xs text-accent hover:underline"
              >
                Load sample predatory loan
              </button>
            </div>
            <Textarea
              id="doc"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("analyzer.placeholder")}
              className="min-h-[280px] font-mono text-xs"
              maxLength={30000}
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">{text.length} / 30000</div>
          </div>
          <Button onClick={submit} disabled={busy} size="lg" className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            {busy ? "Analyzing..." : t("cta.analyze")}
          </Button>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {result ? <ResultCard r={result} /> : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Paste a document and hit analyze. Results appear here.
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-display text-xl font-semibold">{t("analyzer.history")}</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No analyses yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {history.map((h) => <HistoryCard key={h.id} h={h} onOpen={() => setResult({ analysis: h, recommendation: "" })} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function RiskBar({ score, level }: { score: number; level: string }) {
  const color = score >= 70 ? "bg-destructive" : score >= 40 ? "bg-warning" : "bg-success";
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">Risk score</span>
        <span className="font-display text-2xl font-bold">{score}<span className="text-sm text-muted-foreground">/100</span></span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <div className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{level}</div>
    </div>
  );
}

function ResultCard({ r }: { r: { analysis: Analysis; recommendation: string } }) {
  const a = r.analysis;
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
      <RiskBar score={a.risk_score} level={a.risk_level} />
      <div>
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Summary</div>
        <p className="text-sm">{a.summary}</p>
      </div>
      {r.recommendation && (
        <div className="rounded-lg bg-secondary p-3 text-sm">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-accent">
            <ShieldCheck className="h-3 w-3" /> Recommendation
          </div>
          {r.recommendation}
        </div>
      )}
      {a.red_flags?.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Red flags</div>
          <ul className="space-y-2">
            {a.red_flags.map((rf, i) => (
              <li key={i} className="flex gap-2 rounded-lg border border-border bg-secondary/50 p-2 text-xs">
                {rf.severity === "high" ? <ShieldAlert className="h-4 w-4 flex-none text-destructive" /> : <AlertTriangle className="h-4 w-4 flex-none text-warning" />}
                <div>
                  <div className="font-medium">{rf.concern}</div>
                  <div className="mt-0.5 italic text-muted-foreground">"{rf.clause}"</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {a.extracted && Object.keys(a.extracted).length > 0 && (
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Extracted terms</div>
          <dl className="space-y-1 text-xs">
            {Object.entries(a.extracted).filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 border-b border-border/60 py-1">
                <dt className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function HistoryCard({ h, onOpen }: { h: Analysis; onOpen: () => void }) {
  const color = h.risk_score >= 70 ? "text-destructive" : h.risk_score >= 40 ? "text-warning" : "text-success";
  return (
    <button onClick={onOpen} className="text-left rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:shadow-glow">
      <div className="flex items-baseline justify-between">
        <div className="truncate font-medium">{h.title}</div>
        <div className={`font-display text-lg font-bold ${color}`}>{h.risk_score}</div>
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{h.risk_level}</div>
      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{h.summary}</p>
    </button>
  );
}
