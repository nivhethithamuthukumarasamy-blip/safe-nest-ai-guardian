import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "en-simple" | "hi" | "ta" | "te" | "ml";

export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "en-simple", label: "Simple English", native: "Simple English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
];

type Dict = Record<string, string>;

const en: Dict = {
  "app.name": "SafeNest AI",
  "app.tagline": "Borrow smart. Stay safe.",
  "app.hero.title": "AI protection against predatory lending",
  "app.hero.sub":
    "Understand any loan document, check your financial health, and find safer options — powered by transparent AI.",
  "cta.getStarted": "Get started free",
  "cta.signIn": "Sign in",
  "cta.signOut": "Sign out",
  "cta.tryDemo": "See how it works",
  "cta.analyze": "Analyze document",
  "cta.calculate": "Calculate",
  "cta.explain": "Explain with AI",
  "cta.save": "Save",
  "cta.post": "Post listing",
  "nav.dashboard": "Dashboard",
  "nav.analyzer": "Loan Analyzer",
  "nav.health": "Financial Health",
  "nav.schemes": "Govt Schemes",
  "nav.marketplace": "Marketplace",
  "nav.settings": "AI Settings",
  "auth.title": "Welcome to SafeNest",
  "auth.sub": "Secure your financial decisions",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.name": "Full name",
  "auth.signIn": "Sign in",
  "auth.signUp": "Create account",
  "auth.google": "Continue with Google",
  "auth.switchToSignUp": "New here? Create an account",
  "auth.switchToSignIn": "Have an account? Sign in",
  "dashboard.welcome": "Welcome back",
  "dashboard.sub": "Your financial safety cockpit",
  "trust.unverified": "Unverified",
  "trust.basic": "Basic",
  "trust.identity": "ID Verified",
  "trust.financial": "Financially Verified",
  "trust.partner": "Trusted Partner",
  "analyzer.title": "Loan Document Analyzer",
  "analyzer.sub": "Paste any loan agreement. Our AI extracts terms, flags risks, and rewrites clauses in plain language.",
  "analyzer.placeholder": "Paste the loan document text here...",
  "analyzer.titleField": "Document name",
  "analyzer.risk": "Risk score",
  "analyzer.summary": "Plain-language summary",
  "analyzer.redFlags": "Red flags detected",
  "analyzer.terms": "Extracted terms",
  "analyzer.history": "Your past analyses",
  "health.title": "Financial Health",
  "health.sub": "Deterministic scoring. AI explains what it means.",
  "health.income": "Monthly income (₹)",
  "health.expenses": "Monthly expenses (₹)",
  "health.emi": "Existing EMI (₹)",
  "health.debt": "Total debt (₹)",
  "health.savings": "Savings (₹)",
  "health.dependents": "Dependents",
  "health.score": "Health score",
  "health.dti": "Debt-to-income",
  "health.emiBurden": "EMI burden",
  "health.savingsRatio": "Savings ratio",
  "schemes.title": "Government Schemes",
  "schemes.sub": "Find schemes that fit your situation. AI explains why you qualify.",
  "schemes.match": "Find matching schemes",
  "marketplace.title": "Borrower & Lender Marketplace",
  "marketplace.sub": "Verified borrowers meet trusted lenders.",
  "marketplace.borrowers": "Borrower Requests",
  "marketplace.lenders": "Lender Products",
  "marketplace.new": "Post a listing",
  "settings.title": "AI Configuration",
  "settings.sub": "SafeNest uses the Lovable AI Gateway — GPT, Gemini, Claude — with no key setup for you. Pick the model that fits your needs.",
  "settings.model": "Chat model",
  "settings.enabled": "AI enabled",
  "settings.test": "Test connection",
  "settings.status.ok": "Connection healthy",
  "settings.status.fail": "Connection failed",
  "common.loading": "Loading...",
  "common.saved": "Saved",
  "common.error": "Something went wrong",
  "common.language": "Language",
};

// Minimal translations — key UI strings only. English acts as fallback for anything missing.
const hi: Dict = {
  "app.tagline": "समझदारी से उधार लें। सुरक्षित रहें।",
  "app.hero.title": "शोषणकारी उधारी के खिलाफ एआई सुरक्षा",
  "app.hero.sub": "किसी भी लोन दस्तावेज़ को समझें, अपनी वित्तीय सेहत जांचें, और सुरक्षित विकल्प खोजें।",
  "cta.getStarted": "मुफ़्त शुरू करें",
  "cta.signIn": "साइन इन करें",
  "cta.tryDemo": "यह कैसे काम करता है",
  "nav.dashboard": "डैशबोर्ड",
  "nav.analyzer": "लोन विश्लेषक",
  "nav.health": "वित्तीय सेहत",
  "nav.schemes": "सरकारी योजनाएं",
  "nav.marketplace": "मार्केटप्लेस",
  "nav.settings": "एआई सेटिंग्स",
  "auth.google": "Google से जारी रखें",
  "auth.signIn": "साइन इन",
  "auth.signUp": "खाता बनाएं",
};
const ta: Dict = {
  "app.tagline": "புத்திசாலித்தனமாக கடன் வாங்குங்கள். பாதுகாப்பாக இருங்கள்.",
  "app.hero.title": "சுரண்டல் கடன்களுக்கு எதிரான AI பாதுகாப்பு",
  "nav.dashboard": "டாஷ்போர்டு",
  "nav.analyzer": "கடன் ஆய்வாளர்",
  "nav.health": "நிதி ஆரோக்கியம்",
  "nav.schemes": "அரசு திட்டங்கள்",
  "nav.marketplace": "சந்தை",
  "nav.settings": "AI அமைப்புகள்",
};
const te: Dict = {
  "app.tagline": "తెలివిగా అప్పు తీసుకోండి. సురక్షితంగా ఉండండి.",
  "nav.dashboard": "డాష్‌బోర్డ్",
  "nav.analyzer": "రుణ విశ్లేషకుడు",
  "nav.health": "ఆర్థిక ఆరోగ్యం",
  "nav.schemes": "ప్రభుత్వ పథకాలు",
  "nav.marketplace": "మార్కెట్‌ప్లేస్",
  "nav.settings": "AI సెట్టింగ్‌లు",
};
const ml: Dict = {
  "app.tagline": "സൂക്ഷ്മതയോടെ കടം വാങ്ങൂ. സുരക്ഷിതരായിരിക്കൂ.",
  "nav.dashboard": "ഡാഷ്ബോർഡ്",
  "nav.analyzer": "വായ്പ വിശകലനം",
  "nav.health": "സാമ്പത്തിക ആരോഗ്യം",
  "nav.schemes": "സർക്കാർ പദ്ധതികൾ",
  "nav.marketplace": "മാർക്കറ്റ്‌പ്ലേസ്",
  "nav.settings": "AI ക്രമീകരണങ്ങൾ",
};
const enSimple: Dict = {
  "app.hero.title": "AI that helps you avoid bad loans",
  "app.hero.sub": "We read your loan papers. We find hidden fees. We tell you if the deal is safe.",
};

const DICTS: Record<Lang, Dict> = {
  en, "en-simple": enSimple, hi, ta, te, ml,
};

type I18nCtx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string };
const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("safenest.lang") as Lang | null) : null;
    if (saved && DICTS[saved]) setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("safenest.lang", l);
  };
  const t = (key: string) => DICTS[lang][key] ?? en[key] ?? key;
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
