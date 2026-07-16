// Seeded government schemes dataset. Real API integration is a Demo Mode fallback strategy —
// this dataset provides accurate, verifiable info from official sources.

export interface Scheme {
  id: string;
  name: string;
  ministry: string;
  category: "loan" | "insurance" | "pension" | "subsidy" | "welfare";
  audience: string[];
  benefit: string;
  eligibility: string;
  amount: string;
  url: string;
}

export const SCHEMES: Scheme[] = [
  {
    id: "pmmy",
    name: "Pradhan Mantri Mudra Yojana",
    ministry: "Ministry of Finance",
    category: "loan",
    audience: ["small-business", "self-employed", "women"],
    benefit: "Collateral-free micro loans up to ₹20 lakh for small businesses.",
    eligibility: "Non-corporate, non-farm small/micro enterprises. Indian citizen.",
    amount: "Up to ₹20,00,000",
    url: "https://www.mudra.org.in/",
  },
  {
    id: "pmjjby",
    name: "Pradhan Mantri Jeevan Jyoti Bima Yojana",
    ministry: "Department of Financial Services",
    category: "insurance",
    audience: ["low-income", "all"],
    benefit: "Life insurance cover of ₹2 lakh at ₹436/year.",
    eligibility: "Bank account holders aged 18–50.",
    amount: "₹2,00,000 cover",
    url: "https://www.jansuraksha.gov.in/",
  },
  {
    id: "pmsby",
    name: "Pradhan Mantri Suraksha Bima Yojana",
    ministry: "Department of Financial Services",
    category: "insurance",
    audience: ["low-income", "all"],
    benefit: "Accidental death/disability cover of ₹2 lakh at ₹20/year.",
    eligibility: "Bank account holders aged 18–70.",
    amount: "₹2,00,000 cover",
    url: "https://www.jansuraksha.gov.in/",
  },
  {
    id: "apy",
    name: "Atal Pension Yojana",
    ministry: "PFRDA",
    category: "pension",
    audience: ["unorganised", "self-employed"],
    benefit: "Guaranteed pension of ₹1,000–₹5,000/month from age 60.",
    eligibility: "Indian citizen aged 18–40 with bank account.",
    amount: "₹1k–5k monthly pension",
    url: "https://www.npscra.nsdl.co.in/scheme-details.php",
  },
  {
    id: "standup",
    name: "Stand-Up India",
    ministry: "Department of Financial Services",
    category: "loan",
    audience: ["women", "sc-st", "small-business"],
    benefit: "Bank loans ₹10 lakh–₹1 crore for greenfield enterprises by women, SC/ST entrepreneurs.",
    eligibility: "SC/ST or woman entrepreneur, above 18, greenfield project.",
    amount: "₹10,00,000 – ₹1,00,00,000",
    url: "https://www.standupmitra.in/",
  },
  {
    id: "pmay",
    name: "Pradhan Mantri Awas Yojana",
    ministry: "Ministry of Housing & Urban Affairs",
    category: "subsidy",
    audience: ["low-income", "home-buyer"],
    benefit: "Interest subsidy on home loans up to ₹2.67 lakh.",
    eligibility: "EWS/LIG/MIG income groups, no pucca house owned.",
    amount: "Up to ₹2,67,000 subsidy",
    url: "https://pmaymis.gov.in/",
  },
  {
    id: "pmkisan",
    name: "PM Kisan Samman Nidhi",
    ministry: "Ministry of Agriculture",
    category: "welfare",
    audience: ["farmer"],
    benefit: "₹6,000/year direct income support to land-holding farmers.",
    eligibility: "Small and marginal farmer families holding cultivable land.",
    amount: "₹6,000/year",
    url: "https://pmkisan.gov.in/",
  },
  {
    id: "kcc",
    name: "Kisan Credit Card",
    ministry: "Ministry of Agriculture",
    category: "loan",
    audience: ["farmer"],
    benefit: "Short-term credit at 4% effective rate for crops, allied activities.",
    eligibility: "Farmers, tenant farmers, SHGs of farmers.",
    amount: "Based on cropping pattern",
    url: "https://www.pmkisan.gov.in/",
  },
];

export const AUDIENCE_TAGS = [
  "small-business", "self-employed", "women", "sc-st", "low-income",
  "farmer", "home-buyer", "unorganised", "all",
] as const;
