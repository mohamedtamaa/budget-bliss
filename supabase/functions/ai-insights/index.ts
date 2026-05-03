import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { period = "monthly", question } = await req.json().catch(() => ({}));

    // Fetch data
    const now = new Date();
    let since = new Date();
    if (period === "daily") since.setDate(now.getDate() - 1);
    else if (period === "weekly") since.setDate(now.getDate() - 7);
    else since.setMonth(now.getMonth() - 1);
    const sinceStr = since.toISOString().slice(0, 10);

    const [tx, recs, loans, subs, accs, cats] = await Promise.all([
      supabase.from("transactions").select("*").gte("date", sinceStr),
      supabase.from("recurring_items").select("*").eq("active", true),
      supabase.from("loans").select("*").eq("active", true),
      supabase.from("recurring_items").select("*").eq("type", "subscription"),
      supabase.from("accounts").select("*"),
      supabase.from("categories").select("*"),
    ]);

    const catMap = new Map((cats.data || []).map((c: any) => [c.id, c.name]));
    const accMap = new Map((accs.data || []).map((a: any) => [a.id, { name: a.name, type: a.type }]));

    const transactions = (tx.data || []).map((t: any) => ({
      date: t.date,
      type: t.type,
      amount: Number(t.amount),
      category: catMap.get(t.category_id) || "Uncategorized",
      account: accMap.get(t.account_id)?.name || "—",
      description: t.description,
    }));

    const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    const byCategory: Record<string, number> = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

    const summary = {
      period,
      since: sinceStr,
      totals: { income: totalIncome, expense: totalExpense, net: totalIncome - totalExpense },
      expensesByCategory: byCategory,
      transactionsCount: transactions.length,
      topExpenses: [...transactions].filter(t => t.type === "expense").sort((a, b) => b.amount - a.amount).slice(0, 10),
      recurring: (recs.data || []).map((r: any) => ({ name: r.name, type: r.type, amount: Number(r.amount) })),
      loans: (loans.data || []).map((l: any) => ({ name: l.name, monthly: Number(l.monthly_amount), remaining_balance: l.remaining_balance })),
    };

    const systemPrompt = `You are a personal finance advisor. Analyze the user's data and give clear, actionable, friendly advice.
Focus on:
1. Spending patterns and where money is leaking
2. Specific items the user should consider stopping or reducing (name them)
3. Concrete ways to save money
4. Ideas to earn more income based on their profile
5. Warnings about loans, subscriptions, or recurring costs
Use markdown with short sections, bullet points, and emojis. Be specific, not generic. Use the user's currency (assume EGP).`;

    const userPrompt = question
      ? `${question}\n\nMy financial data (${period} period since ${sinceStr}):\n${JSON.stringify(summary, null, 2)}`
      : `Analyze my ${period} financial data and give me recommendations:\n${JSON.stringify(summary, null, 2)}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      throw new Error(`AI error: ${t}`);
    }

    const data = await aiRes.json();
    const insights = data.choices?.[0]?.message?.content || "No insights generated.";

    return new Response(JSON.stringify({ insights, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
