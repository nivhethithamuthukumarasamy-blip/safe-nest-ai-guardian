
-- User roles enum & table (separate from profiles for security)
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'lender');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  mobile_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  id_verified BOOLEAN NOT NULL DEFAULT false,
  bank_verified BOOLEAN NOT NULL DEFAULT false,
  income_verified BOOLEAN NOT NULL DEFAULT false,
  trust_score INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email_verified)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email_confirmed_at IS NOT NULL);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Loan analyses
CREATE TABLE public.loan_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  extracted JSONB NOT NULL DEFAULT '{}',
  risk_score INT NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'unknown',
  summary TEXT,
  red_flags JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loan_analyses TO authenticated;
GRANT ALL ON public.loan_analyses TO service_role;
ALTER TABLE public.loan_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own loan analyses" ON public.loan_analyses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Financial snapshots
CREATE TABLE public.financial_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_income NUMERIC NOT NULL,
  monthly_expenses NUMERIC NOT NULL,
  monthly_emi NUMERIC NOT NULL DEFAULT 0,
  total_debt NUMERIC NOT NULL DEFAULT 0,
  savings NUMERIC NOT NULL DEFAULT 0,
  dependents INT NOT NULL DEFAULT 0,
  health_score INT NOT NULL,
  dti NUMERIC NOT NULL,
  emi_burden NUMERIC NOT NULL,
  savings_ratio NUMERIC NOT NULL,
  ai_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_snapshots TO authenticated;
GRANT ALL ON public.financial_snapshots TO service_role;
ALTER TABLE public.financial_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own snapshots" ON public.financial_snapshots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Marketplace
CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('borrower_request','lender_product')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  interest_rate NUMERIC,
  tenure_months INT,
  purpose TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.marketplace_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_listings TO authenticated;
GRANT ALL ON public.marketplace_listings TO service_role;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active listings public" ON public.marketplace_listings FOR SELECT USING (is_active = true);
CREATE POLICY "Users manage own listings" ON public.marketplace_listings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
