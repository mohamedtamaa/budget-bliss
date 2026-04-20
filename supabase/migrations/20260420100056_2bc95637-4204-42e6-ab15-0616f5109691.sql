
-- ============ ENUMS ============
CREATE TYPE public.account_type AS ENUM ('cash','wallet','bank','tracking','credit_card');
CREATE TYPE public.txn_type AS ENUM ('income','expense','loan_payment','card_payment','transfer');
CREATE TYPE public.recurring_type AS ENUM ('income','expense','subscription');
CREATE TYPE public.budget_item_type AS ENUM ('income','expense','loan','subscription');
CREATE TYPE public.budget_source AS ENUM ('recurring','loan','card','manual');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  currency TEXT NOT NULL DEFAULT 'EGP',
  timezone TEXT NOT NULL DEFAULT 'Africa/Cairo',
  seeded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile_select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_profile_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_profile_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- ============ ACCOUNT GROUPS ============
CREATE TABLE public.account_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.account_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_ag_all" ON public.account_groups FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ ACCOUNTS ============
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.account_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type public.account_type NOT NULL DEFAULT 'bank',
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  exclude_from_total BOOLEAN NOT NULL DEFAULT false,
  credit_limit NUMERIC(14,2),
  used_amount NUMERIC(14,2),
  due_amount NUMERIC(14,2),
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_acc_all" ON public.accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_cat_all" ON public.categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ TRANSACTIONS ============
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type public.txn_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  description TEXT,
  notes TEXT,
  included_in_total BOOLEAN NOT NULL DEFAULT true,
  is_essential BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_tx_all" ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_tx_user_date ON public.transactions(user_id, date DESC);

-- ============ RECURRING ITEMS ============
CREATE TABLE public.recurring_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type public.recurring_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  included_in_total BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recurring_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_rec_all" ON public.recurring_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ LOANS ============
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  lender TEXT,
  monthly_amount NUMERIC(14,2) NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  due_day INT NOT NULL DEFAULT 1 CHECK (due_day BETWEEN 1 AND 31),
  total_payments INT,
  remaining_payments INT,
  remaining_balance NUMERIC(14,2),
  reminder_days INT[] NOT NULL DEFAULT ARRAY[3,1,0],
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_loan_all" ON public.loans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ MONTHLY BUDGETS ============
CREATE TABLE public.monthly_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- YYYY-MM
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);
ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_mb_all" ON public.monthly_budgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.monthly_budgets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type public.budget_source NOT NULL,
  source_id UUID,
  name TEXT NOT NULL,
  type public.budget_item_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_date DATE,
  finished BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_bi_all" ON public.budget_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ TIMESTAMP TRIGGER ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER t_profiles_u BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER t_accounts_u BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER t_tx_u BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER t_rec_u BEFORE UPDATE ON public.recurring_items FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER t_loan_u BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ SEED FUNCTION ============
CREATE OR REPLACE FUNCTION public.seed_user_data(_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_bank UUID; v_wallet UUID;
  v_inc_salary UUID; v_inc_other UUID;
  v_exp_house UUID; v_exp_util UUID; v_exp_sub UUID; v_exp_personal UUID;
BEGIN
  -- Accounts
  INSERT INTO public.accounts(user_id,name,type,balance) VALUES (_user_id,'Bank Account','bank',0) RETURNING id INTO v_bank;
  INSERT INTO public.accounts(user_id,name,type,balance) VALUES (_user_id,'Wallet','wallet',0) RETURNING id INTO v_wallet;

  -- Categories (income)
  INSERT INTO public.categories(user_id,name,type) VALUES (_user_id,'Salary','income') RETURNING id INTO v_inc_salary;
  INSERT INTO public.categories(user_id,name,type) VALUES (_user_id,'Other Income','income') RETURNING id INTO v_inc_other;

  -- Categories (expense)
  INSERT INTO public.categories(user_id,name,type) VALUES (_user_id,'Housing','expense') RETURNING id INTO v_exp_house;
  INSERT INTO public.categories(user_id,name,type) VALUES (_user_id,'Utilities','expense') RETURNING id INTO v_exp_util;
  INSERT INTO public.categories(user_id,name,type) VALUES (_user_id,'Subscriptions','expense') RETURNING id INTO v_exp_sub;
  INSERT INTO public.categories(user_id,name,type) VALUES (_user_id,'Personal','expense') RETURNING id INTO v_exp_personal;

  -- Recurring income
  INSERT INTO public.recurring_items(user_id,account_id,category_id,name,type,amount) VALUES
    (_user_id,v_bank,v_inc_salary,'Salary','income',21500),
    (_user_id,v_bank,v_inc_other,'Safwa Salary','income',1000),
    (_user_id,v_bank,v_inc_other,'Red Sea Life Salary','income',15000);

  -- Recurring expenses
  INSERT INTO public.recurring_items(user_id,account_id,category_id,name,type,amount) VALUES
    (_user_id,v_bank,v_exp_house,'House','expense',5000),
    (_user_id,v_bank,v_exp_personal,'Zein','expense',2000),
    (_user_id,v_bank,v_exp_personal,'Mohamed','expense',5000),
    (_user_id,v_bank,v_exp_sub,'ChatGPT','subscription',700),
    (_user_id,v_bank,v_exp_util,'Wifi','expense',438.8),
    (_user_id,v_bank,v_exp_util,'Etisalat','expense',474.84),
    (_user_id,v_bank,v_exp_house,'Compound Maintenance','expense',500);

  -- Loans
  INSERT INTO public.loans(user_id,account_id,name,lender,monthly_amount,due_day) VALUES
    (_user_id,v_bank,'QNB Loan','QNB',627.81,1),
    (_user_id,v_bank,'Ahly Loan','Banque Ahly',659.08,1),
    (_user_id,v_bank,'Sohola 1','Sohola',678,5),
    (_user_id,v_bank,'Sohola 2','Sohola',1153,5),
    (_user_id,v_bank,'Sohola 3','Sohola',3211.5,5),
    (_user_id,v_bank,'Value Loan','Value',722,10);

  UPDATE public.profiles SET seeded = true WHERE user_id = _user_id;
END; $$;

-- ============ NEW USER TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  PERFORM public.seed_user_data(NEW.id);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
