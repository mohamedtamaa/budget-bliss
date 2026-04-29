-- Track per-month paid status for recurring items, loans, and subscriptions
CREATE TABLE IF NOT EXISTS public.monthly_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('recurring','subscription','loan')),
  source_id UUID NOT NULL,
  month TEXT NOT NULL, -- YYYY-MM
  amount NUMERIC NOT NULL DEFAULT 0,
  paid BOOLEAN NOT NULL DEFAULT true,
  paid_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_type, source_id, month)
);

ALTER TABLE public.monthly_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_mp_all ON public.monthly_payments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mp_user_month ON public.monthly_payments(user_id, month);

-- Custom user-defined dashboard sections
CREATE TABLE IF NOT EXISTS public.dashboard_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  -- formula: array of { source: 'income'|'expenses'|'recurring_paid'|'loans_paid'|'subs_paid'|'recurring_total'|'loans_total'|'subs_total'|'cards_due'|'accounts_balance'|'net_cash', op: '+'|'-' }
  formula JSONB NOT NULL DEFAULT '[]'::jsonb,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboard_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_ds_all ON public.dashboard_sections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
