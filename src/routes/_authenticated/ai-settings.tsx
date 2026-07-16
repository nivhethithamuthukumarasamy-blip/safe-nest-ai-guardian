import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { testAi } from "@/lib/ai.functions";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Sparkles, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ai-settings")({
  head: () => ({
    meta: [
      { title: "AI Settings · SafeNest AI" },
      { name: "description", content: "Configure the AI model that powers loan analysis, financial coaching, and scheme matching." },
    ],
  }),
  component: SettingsPage,
});

const MODELS = [
  { id: "openai/gpt-5.5", label: "GPT-5.5 (Frontier · recommended)", desc: "Best reasoning, best analysis quality." },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 mini (Balanced)", desc: "Fast, strong coding & analysis, lower cost." },
  { id: "openai/gpt-5.4-nano", label: "GPT-5.4 nano (Fastest)", desc: "Best for high-volume, simple tasks." },
  { id: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", desc: "Google's strongest reasoning model." },
  { id: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash", desc: "Balanced Google model, fast responses." },
  { id: "google/gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", desc: "Cheapest — great for classification." },
];

function SettingsPage() {
  const { t } = useI18n();
  const [model, setModel] = useState("openai/gpt-5.5");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; reply: string } | null>(null);
  const test = useServerFn(testAi);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("safenest.model") : null;
    if (saved) setModel(saved);
  }, []);

  function save(next: string) {
    setModel(next);
    if (typeof window !== "undefined") localStorage.setItem("safenest.model", next);
    setStatus(null);
    toast.success("Model preference saved");
  }

  async function runTest() {
    setBusy(true); setStatus(null);
    try {
      const r = await test({ data: { model } });
      setStatus(r);
      if (r.ok) toast.success(t("settings.status.ok"));
      else toast.error(t("settings.status.fail"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test failed");
      setStatus({ ok: false, reply: err instanceof Error ? err.message : "Failed" });
    } finally {
      setBusy(false);
    }
  }

  const selected = MODELS.find((m) => m.id === model);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("settings.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("settings.sub")}</p>
      </div>

      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-accent" />
          <div className="text-sm">
            <div className="font-medium">No API key needed</div>
            <p className="mt-1 text-muted-foreground">
              SafeNest is preconfigured with the Lovable AI Gateway. Your requests are encrypted and never expose credentials to the browser. Pick any model below — free tier included.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div>
          <Label>{t("settings.model")}</Label>
          <Select value={model} onValueChange={save}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{m.label}</span>
                    <span className="text-xs text-muted-foreground">{m.desc}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected && <p className="mt-2 text-xs text-muted-foreground">{selected.desc}</p>}
        </div>

        <Button onClick={runTest} disabled={busy} className="gap-2">
          <Sparkles className="h-4 w-4" />
          {busy ? "Testing..." : t("settings.test")}
        </Button>

        {status && (
          <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${status.ok ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
            {status.ok ? <CheckCircle2 className="h-4 w-4 flex-none text-success" /> : <XCircle className="h-4 w-4 flex-none text-destructive" />}
            <div>
              <div className="font-medium">{status.ok ? t("settings.status.ok") : t("settings.status.fail")}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">Reply: {status.reply || "(empty)"}</div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card text-sm">
        <h3 className="mb-2 font-semibold">How SafeNest AI is transparent</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li>• <strong>Scores are deterministic.</strong> Financial health, risk score, and trust score are computed by code — never by AI.</li>
          <li>• <strong>AI only explains.</strong> The model reads the extracted data and describes it in plain language.</li>
          <li>• <strong>No hidden prompts.</strong> System prompts and inputs are auditable in the source code.</li>
          <li>• <strong>No key exposure.</strong> All model calls happen server-side; browser never sees credentials.</li>
        </ul>
      </div>
    </div>
  );
}
