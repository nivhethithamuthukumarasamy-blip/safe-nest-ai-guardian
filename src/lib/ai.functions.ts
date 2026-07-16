import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AnalyzeInput = z.object({
  title: z.string().min(1).max(200),
  text: z.string().min(20).max(30000),
  model: z.string().default("openai/gpt-5.5"),
});

export const analyzeLoan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => AnalyzeInput.parse(v))
  .handler(async ({ data, context }) => {
    const { chat } = await import("./lovable-ai.server");
    const systemPrompt = `You are SafeNest AI, a borrower-protection expert for Indian consumers.
Analyze the loan document. Return STRICT JSON only, matching:
{
  "summary": "2-4 sentence plain-English summary a first-time borrower can understand",
  "extracted": {
    "principal": "string or null",
    "interestRate": "string or null (specify APR/flat)",
    "tenure": "string or null",
    "processingFee": "string or null",
    "prepaymentPenalty": "string or null",
    "latePaymentPenalty": "string or null",
    "totalRepayment": "string or null"
  },
  "redFlags": [{"severity":"high|medium|low","clause":"short quote","concern":"why this matters"}],
  "riskScore": 0-100,
  "riskLevel": "safe|moderate|risky|predatory",
  "recommendation": "1-2 sentence action advice"
}
Be strict about hidden fees, insurance bundling, variable rate traps, and unclear foreclosure terms.`;

    const raw = await chat({
      model: data.model,
      responseJson: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Document: ${data.title}\n\n${data.text}` },
      ],
    });

    let parsed: {
      summary?: string;
      extracted?: Record<string, string | null>;
      redFlags?: { severity: string; clause: string; concern: string }[];
      riskScore?: number;
      riskLevel?: string;
      recommendation?: string;
    };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("AI returned invalid JSON. Please try again.");
    }

    const { supabase, userId } = context;
    const { data: saved, error } = await supabase
      .from("loan_analyses")
      .insert({
        user_id: userId,
        title: data.title,
        raw_text: data.text.slice(0, 20000),
        extracted: parsed.extracted ?? {},
        risk_score: Math.max(0, Math.min(100, parsed.riskScore ?? 0)),
        risk_level: parsed.riskLevel ?? "unknown",
        summary: parsed.summary ?? "",
        red_flags: parsed.redFlags ?? [],
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { analysis: saved, recommendation: parsed.recommendation ?? "" };
  });

const ExplainInput = z.object({
  scores: z.object({
    healthScore: z.number(),
    dti: z.number(),
    emiBurden: z.number(),
    savingsRatio: z.number(),
    expensePressure: z.number(),
  }),
  inputs: z.object({
    monthlyIncome: z.number(),
    monthlyExpenses: z.number(),
    monthlyEmi: z.number(),
    totalDebt: z.number(),
    savings: z.number(),
    dependents: z.number(),
  }),
  model: z.string().default("openai/gpt-5.5"),
});

export const explainHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => ExplainInput.parse(v))
  .handler(async ({ data }) => {
    const { chat } = await import("./lovable-ai.server");
    const prompt = `Financial health snapshot for an Indian household (₹):
Income: ${data.inputs.monthlyIncome}/mo | Expenses: ${data.inputs.monthlyExpenses}/mo | EMI: ${data.inputs.monthlyEmi}/mo
Total debt: ${data.inputs.totalDebt} | Savings: ${data.inputs.savings} | Dependents: ${data.inputs.dependents}

Deterministic scores (already calculated — do NOT recompute):
Health score: ${data.scores.healthScore}/100
DTI: ${(data.scores.dti * 100).toFixed(1)}%
EMI burden: ${(data.scores.emiBurden * 100).toFixed(1)}% of income
Savings ratio: ${data.scores.savingsRatio.toFixed(1)} months of expenses
Expense pressure: ${(data.scores.expensePressure * 100).toFixed(1)}% of income

Write a warm, plain-English explanation (150 words max) for the user:
1. What their score means
2. Which single metric is dragging them down most and why
3. Two specific, actionable steps this month
Do not restate the numbers verbatim — interpret them.`;

    const text = await chat({
      model: data.model,
      messages: [
        { role: "system", content: "You are a caring, honest Indian financial coach. Never invent numbers." },
        { role: "user", content: prompt },
      ],
    });
    return { explanation: text };
  });

const SchemeMatchInput = z.object({
  situation: z.string().min(5).max(1000),
  model: z.string().default("openai/gpt-5.5"),
});

export const matchSchemes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => SchemeMatchInput.parse(v))
  .handler(async ({ data }) => {
    const { chat } = await import("./lovable-ai.server");
    const { SCHEMES } = await import("./schemes");
    const catalog = SCHEMES.map((s) => `- ${s.id}: ${s.name} — ${s.benefit} Audience: ${s.audience.join(", ")}. Eligibility: ${s.eligibility}`).join("\n");

    const raw = await chat({
      model: data.model,
      responseJson: true,
      messages: [
        {
          role: "system",
          content: `You match Indian govt schemes to a person's situation.
Return STRICT JSON: {"matches":[{"id":"scheme_id","reason":"1 sentence why it fits"}]}
Only include schemes from the provided catalog. Max 4 matches. If nothing fits, return {"matches":[]}.`,
        },
        {
          role: "user",
          content: `Catalog:\n${catalog}\n\nUser situation:\n${data.situation}`,
        },
      ],
    });
    let parsed: { matches: { id: string; reason: string }[] };
    try { parsed = JSON.parse(raw); } catch { parsed = { matches: [] }; }
    return parsed;
  });

const TestInput = z.object({ model: z.string() });
export const testAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => TestInput.parse(v))
  .handler(async ({ data }) => {
    const { chat } = await import("./lovable-ai.server");
    const reply = await chat({
      model: data.model,
      messages: [
        { role: "system", content: "Reply with exactly the word: OK" },
        { role: "user", content: "ping" },
      ],
      temperature: 0,
    });
    return { ok: reply.trim().toLowerCase().includes("ok"), reply: reply.slice(0, 100) };
  });
