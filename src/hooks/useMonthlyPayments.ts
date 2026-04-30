import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type SourceType = "recurring" | "subscription" | "loan";

export function useMonthlyPayments(month: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["monthly_payments", user?.id, month],
    enabled: !!user && !!month,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_payments")
        .select("*")
        .eq("month", month);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useMonthlyPaymentMutations(month: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const inv = () => qc.invalidateQueries({ queryKey: ["monthly_payments"] });

  return {
    togglePaid: useMutation({
      mutationFn: async (args: { source_type: SourceType; source_id: string; amount: number; existingId?: string; currentlyPaid: boolean }) => {
        if (args.existingId) {
          // toggle = delete row to mark unpaid
          const { error } = await supabase.from("monthly_payments").delete().eq("id", args.existingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("monthly_payments").insert({
            user_id: user!.id,
            source_type: args.source_type,
            source_id: args.source_id,
            month,
            amount: args.amount,
            paid: true,
            paid_date: new Date().toISOString().slice(0, 10),
          });
          if (error) throw error;
        }
      },
      onSuccess: inv,
      onError: (e: any) => toast.error(e.message),
    }),
  };
}

export function useDashboardSections() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dashboard_sections", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("dashboard_sections").select("*").order("position");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useDashboardSectionMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const inv = () => qc.invalidateQueries({ queryKey: ["dashboard_sections"] });
  return {
    create: useMutation({
      mutationFn: async (v: { name: string; formula: any[]; override_key?: string | null }) => {
        // If overriding a built-in card, replace any existing override for the same key
        if (v.override_key) {
          await supabase.from("dashboard_sections").delete().eq("user_id", user!.id).eq("override_key", v.override_key);
        }
        const { error } = await supabase.from("dashboard_sections").insert({ ...v, user_id: user!.id } as any);
        if (error) throw error;
      },
      onSuccess: inv,
      onError: (e: any) => toast.error(e.message),
    }),
    update: useMutation({
      mutationFn: async (v: { id: string; name?: string; formula?: any[]; override_key?: string | null }) => {
        const { id, ...rest } = v;
        const { error } = await supabase.from("dashboard_sections").update(rest as any).eq("id", id);
        if (error) throw error;
      },
      onSuccess: inv,
      onError: (e: any) => toast.error(e.message),
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("dashboard_sections").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: inv,
      onError: (e: any) => toast.error(e.message),
    }),
  };
}
