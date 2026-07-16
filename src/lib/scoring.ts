// Transparent, deterministic scoring. AI never generates these numbers — it only explains them.

export interface FinancialInputs {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyEmi: number;
  totalDebt: number;
  savings: number;
  dependents: number;
}

export interface FinancialScores {
  healthScore: number; // 0-100
  dti: number; // debt-to-income ratio (annual)
  emiBurden: number; // EMI as % of income
  savingsRatio: number; // savings as months of expenses
  expensePressure: number; // expenses as % of income
  breakdown: { label: string; value: number; weight: number; contribution: number }[];
}

export function calcFinancialHealth(i: FinancialInputs): FinancialScores {
  const income = Math.max(1, i.monthlyIncome);
  const dti = i.totalDebt / (income * 12);
  const emiBurden = i.monthlyEmi / income;
  const expensePressure = i.monthlyExpenses / income;
  const savingsRatio = i.savings / Math.max(1, i.monthlyExpenses);

  // Component scores (0-100)
  const dtiScore = Math.max(0, 100 - dti * 100); // dti of 0 = 100, dti of 1 = 0
  const emiScore = emiBurden < 0.4 ? 100 - (emiBurden / 0.4) * 40 : Math.max(0, 60 - (emiBurden - 0.4) * 150);
  const expenseScore = expensePressure < 0.7 ? 100 - (expensePressure / 0.7) * 30 : Math.max(0, 70 - (expensePressure - 0.7) * 200);
  const savingsScore = Math.min(100, savingsRatio * 20); // 5 months buffer = 100
  const dependentPenalty = Math.min(20, i.dependents * 4);

  const breakdown = [
    { label: "Debt-to-income", value: dtiScore, weight: 0.3, contribution: dtiScore * 0.3 },
    { label: "EMI burden", value: emiScore, weight: 0.25, contribution: emiScore * 0.25 },
    { label: "Expense pressure", value: expenseScore, weight: 0.2, contribution: expenseScore * 0.2 },
    { label: "Emergency buffer", value: savingsScore, weight: 0.25, contribution: savingsScore * 0.25 },
  ];

  const raw = breakdown.reduce((s, b) => s + b.contribution, 0) - dependentPenalty;
  const healthScore = Math.round(Math.max(0, Math.min(100, raw)));

  return { healthScore, dti, emiBurden, savingsRatio, expensePressure, breakdown };
}

export function trustLevel(score: number): { label: string; key: string; color: string } {
  if (score >= 80) return { label: "Trusted Partner", key: "trust.partner", color: "bg-trust-gradient" };
  if (score >= 60) return { label: "Financially Verified", key: "trust.financial", color: "bg-success" };
  if (score >= 40) return { label: "ID Verified", key: "trust.identity", color: "bg-trust" };
  if (score >= 20) return { label: "Basic", key: "trust.basic", color: "bg-warning" };
  return { label: "Unverified", key: "trust.unverified", color: "bg-muted" };
}
