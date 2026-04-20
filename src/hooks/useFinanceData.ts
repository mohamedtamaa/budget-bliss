import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const onErr = (e: any) => toast.error(e.message || "Something went wrong");

// ---------- PROFILE ----------
export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

// ---------- ACCOUNTS ----------
export function useAccounts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["accounts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*").order("created_at");
      if (error) throw error;
      return data || [];
    },
  });
}
export function useAccountMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return {
    create: useMutation({
      mutationFn: async (v: any) => {
        const { error } = await supabase.from("accounts").insert({ ...v, user_id: user!.id });
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
      onError: onErr,
    }),
    update: useMutation({
      mutationFn: async ({ id, ...v }: any) => {
        const { error } = await supabase.from("accounts").update(v).eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
      onError: onErr,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("accounts").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
      onError: onErr,
    }),
  };
}

// ---------- CATEGORIES ----------
export function useCategories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["categories", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });
}
export function useCategoryMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return {
    create: useMutation({
      mutationFn: async (v: any) => {
        const { error } = await supabase.from("categories").insert({ ...v, user_id: user!.id });
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
      onError: onErr,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
      onError: onErr,
    }),
  };
}

// ---------- TRANSACTIONS ----------
export function useTransactions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["transactions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
export function useTransactionMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const inv = () => {
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  };
  return {
    create: useMutation({
      mutationFn: async (v: any) => {
        const { error } = await supabase.from("transactions").insert({ ...v, user_id: user!.id });
        if (error) throw error;
      },
      onSuccess: inv,
      onError: onErr,
    }),
    update: useMutation({
      mutationFn: async ({ id, ...v }: any) => {
        const { error } = await supabase.from("transactions").update(v).eq("id", id);
        if (error) throw error;
      },
      onSuccess: inv,
      onError: onErr,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("transactions").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: inv,
      onError: onErr,
    }),
  };
}

// ---------- RECURRING ----------
export function useRecurring() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recurring", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("recurring_items").select("*").order("created_at");
      if (error) throw error;
      return data || [];
    },
  });
}
export function useRecurringMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return {
    create: useMutation({
      mutationFn: async (v: any) => {
        const { error } = await supabase.from("recurring_items").insert({ ...v, user_id: user!.id });
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
      onError: onErr,
    }),
    update: useMutation({
      mutationFn: async ({ id, ...v }: any) => {
        const { error } = await supabase.from("recurring_items").update(v).eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
      onError: onErr,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("recurring_items").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
      onError: onErr,
    }),
  };
}

// ---------- LOANS ----------
export function useLoans() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["loans", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("loans").select("*").order("created_at");
      if (error) throw error;
      return data || [];
    },
  });
}
export function useLoanMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return {
    create: useMutation({
      mutationFn: async (v: any) => {
        const { error } = await supabase.from("loans").insert({ ...v, user_id: user!.id });
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["loans"] }),
      onError: onErr,
    }),
    update: useMutation({
      mutationFn: async ({ id, ...v }: any) => {
        const { error } = await supabase.from("loans").update(v).eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["loans"] }),
      onError: onErr,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("loans").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["loans"] }),
      onError: onErr,
    }),
  };
}

// ---------- BUDGETS ----------
export function useBudgets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["budgets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: budgets, error } = await supabase.from("monthly_budgets").select("*").order("month", { ascending: false });
      if (error) throw error;
      const { data: items } = await supabase.from("budget_items").select("*");
      return (budgets || []).map((b) => ({ ...b, items: (items || []).filter((i) => i.budget_id === b.id) }));
    },
  });
}

export function useBudgetActions() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const inv = () => {
    qc.invalidateQueries({ queryKey: ["budgets"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  };
  return {
    createMonthBudget: useMutation({
      mutationFn: async (month: string) => {
        // Check exists
        const { data: existing } = await supabase
          .from("monthly_budgets").select("id").eq("user_id", user!.id).eq("month", month).maybeSingle();
        if (existing) throw new Error(`Budget for ${month} already exists`);

        // Get current/previous month finished items to skip
        const [y, m] = month.split("-").map(Number);
        const prev = new Date(y, m - 2, 1);
        const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
        const { data: prevBudget } = await supabase
          .from("monthly_budgets").select("id").eq("user_id", user!.id).eq("month", prevMonth).maybeSingle();
        let finishedSourceIds: string[] = [];
        if (prevBudget) {
          const { data: prevItems } = await supabase
            .from("budget_items").select("source_id, finished").eq("budget_id", prevBudget.id);
          finishedSourceIds = (prevItems || []).filter((i) => i.finished && i.source_id).map((i) => i.source_id as string);
        }

        const { data: budget, error } = await supabase
          .from("monthly_budgets").insert({ user_id: user!.id, month }).select().single();
        if (error) throw error;

        const monthStart = new Date(y, m - 1, 1);
        const monthEnd = new Date(y, m, 0);

        const { data: recs } = await supabase.from("recurring_items").select("*").eq("active", true);
        const { data: loans } = await supabase.from("loans").select("*").eq("active", true);

        const items: any[] = [];
        (recs || []).forEach((r) => {
          if (finishedSourceIds.includes(r.id)) return;
          if (new Date(r.start_date) > monthEnd) return;
          if (r.end_date && new Date(r.end_date) < monthStart) return;
          items.push({
            budget_id: budget.id,
            user_id: user!.id,
            source_type: "recurring",
            source_id: r.id,
            name: r.name,
            type: r.type,
            amount: r.amount,
          });
        });
        (loans || []).forEach((l) => {
          if (finishedSourceIds.includes(l.id)) return;
          if (new Date(l.start_date) > monthEnd) return;
          if (l.end_date && new Date(l.end_date) < monthStart) return;
          items.push({
            budget_id: budget.id,
            user_id: user!.id,
            source_type: "loan",
            source_id: l.id,
            name: l.name,
            type: "loan",
            amount: l.monthly_amount,
          });
        });
        if (items.length) {
          const { error: e2 } = await supabase.from("budget_items").insert(items);
          if (e2) throw e2;
        }
        return budget;
      },
      onSuccess: () => {
        toast.success("Budget created");
        inv();
      },
      onError: onErr,
    }),
    togglePaid: useMutation({
      mutationFn: async ({ item }: { item: any }) => {
        const newPaid = !item.paid;
        const { error } = await supabase
          .from("budget_items")
          .update({ paid: newPaid, paid_date: newPaid ? new Date().toISOString().slice(0, 10) : null })
          .eq("id", item.id);
        if (error) throw error;
      },
      onSuccess: inv,
      onError: onErr,
    }),
    toggleFinished: useMutation({
      mutationFn: async (item: any) => {
        const { error } = await supabase.from("budget_items").update({ finished: !item.finished }).eq("id", item.id);
        if (error) throw error;
      },
      onSuccess: inv,
      onError: onErr,
    }),
    removeItem: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("budget_items").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: inv,
      onError: onErr,
    }),
    deleteBudget: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("monthly_budgets").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: inv,
      onError: onErr,
    }),
  };
}
