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

    const { period = "monthly", question, lang = "en" } = await req.json().catch(() => ({}));

    const now = new Date();
    let since = new Date();
    if (period === "daily") since.setDate(now.getDate() - 1);
    else if (period === "weekly") since.setDate(now.getDate() - 7);
    else since.setMonth(now.getMonth() - 1);
    const sinceStr = since.toISOString().slice(0, 10);

    const [tx, recs, loans, accs, cats] = await Promise.all([
      supabase.from("transactions").select("*").gte("date", sinceStr),
      supabase.from("recurring_items").select("*").eq("active", true),
      supabase.from("loans").select("*").eq("active", true),
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
      isCard: accMap.get(t.account_id)?.type === "credit_card",
    }));

    const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === "expense" && !t.isCard).reduce((s, t) => s + t.amount, 0);

    const byCategory: Record<string, number> = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

    // Daily series
    const byDay: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((t) => {
      const d = t.date;
      if (!byDay[d]) byDay[d] = { income: 0, expense: 0 };
      if (t.type === "income") byDay[d].income += t.amount;
      else if (t.type === "expense") byDay[d].expense += t.amount;
    });
    const series = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    const summary = {
      period, since: sinceStr,
      totals: { income: totalIncome, expense: totalExpense, net: totalIncome - totalExpense },
      expensesByCategory: byCategory,
      transactionsCount: transactions.length,
      topExpenses: [...transactions].filter(t => t.type === "expense")
        .sort((a, b) => b.amount - a.amount).slice(0, 5)
        .map(t => ({ category: t.category, amount: t.amount })),
      recurring: (recs.data || []).map((r: any) => ({ name: r.name, type: r.type, amount: Number(r.amount) })),
      loans: (loans.data || []).map((l: any) => ({ name: l.name, monthly: Number(l.monthly_amount) })),
    };

    const langInstruction = lang === "ar"
      ? "Reply in Arabic (العربية). Use Arabic for all text including action items."
      : "Reply in English.";

    const systemPrompt = `You are a concise personal finance advisor. ${langInstruction}
Return ONLY valid JSON matching this exact schema (no markdown, no code fences):
{
  "summary": "2-3 short sentences max",
  "actions": [
    { "title": "short title", "detail": "one sentence why", "impact": "high|medium|low" }
  ],
  "stop_spending": ["item name 1", "item name 2"],
  "save_tips": ["tip 1", "tip 2"],
  "earn_tips": ["tip 1", "tip 2"]
}
Rules: max 5 actions, max 4 items per list, each string under 120 chars. Be specific to their data. Currency is EGP.`;

    const userPrompt = question
      ? `${question}\n\nData:\n${JSON.stringify(summary)}`
      : `Analyze this ${period} data:\n${JSON.stringify(summary)}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      throw new Error(`AI error: ${t}`);
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    let insights;
    try { insights = JSON.parse(content); } catch { insights = { summary: content, actions: [], stop_spending: [], save_tips: [], earn_tips: [] }; }

    const charts = {
      categories: Object.entries(byCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6),
      series,
      totals: summary.totals,
    };

    return new Response(JSON.stringify({ insights, charts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
