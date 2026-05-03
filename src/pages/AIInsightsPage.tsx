import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Loader2, TrendingUp, Calendar, CalendarDays, AlertCircle, PiggyBank, Lightbulb } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, Legend, CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Period = "daily" | "weekly" | "monthly";
type Insights = {
  summary: string;
  actions: { title: string; detail: string; impact: "high" | "medium" | "low" }[];
  stop_spending: string[];
  save_tips: string[];
  earn_tips: string[];
};
type Charts = {
  categories: { name: string; value: number }[];
  series: { date: string; income: number; expense: number }[];
  totals: { income: number; expense: number; net: number };
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#8b5cf6"];

export default function AIInsightsPage() {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<Period>("monthly");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [charts, setCharts] = useState<Charts | null>(null);

  const run = async () => {
    setLoading(true); setInsights(null); setCharts(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: { period, question: question.trim() || undefined, lang: i18n.language },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setInsights(data.insights);
      setCharts(data.charts);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally { setLoading(false); }
  };

  const periods: { id: Period; label: string; icon: any }[] = [
    { id: "daily", label: t("ai.daily"), icon: Calendar },
    { id: "weekly", label: t("ai.weekly"), icon: CalendarDays },
    { id: "monthly", label: t("ai.monthly"), icon: TrendingUp },
  ];

  const fmt = (n: number) => new Intl.NumberFormat(i18n.language === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 0 }).format(n);
  const impactColor = (i: string) => i === "high" ? "destructive" : i === "medium" ? "default" : "secondary";

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" size={20} />
            {t("ai.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">{t("ai.period")}</div>
            <div className="grid grid-cols-3 gap-2">
              {periods.map((p) => (
                <Button key={p.id} variant={period === p.id ? "default" : "outline"} onClick={() => setPeriod(p.id)} className="gap-2">
                  <p.icon size={16} /> {p.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">{t("ai.questionLabel")}</div>
            <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t("ai.questionPlaceholder")} rows={2} />
          </div>
          <Button onClick={run} disabled={loading} className="w-full gap-2" size="lg">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {loading ? t("ai.analyzing") : t("ai.getInsights")}
          </Button>
        </CardContent>
      </Card>

      {charts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("ai.incomeVsExpense")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs">
                <div><div className="text-muted-foreground">{t("ai.income")}</div><div className="font-bold text-emerald-500">{fmt(charts.totals.income)}</div></div>
                <div><div className="text-muted-foreground">{t("ai.expense")}</div><div className="font-bold text-destructive">{fmt(charts.totals.expense)}</div></div>
                <div><div className="text-muted-foreground">{t("ai.net")}</div><div className={`font-bold ${charts.totals.net >= 0 ? "text-emerald-500" : "text-destructive"}`}>{fmt(charts.totals.net)}</div></div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={charts.series}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="income" fill="#10b981" name={t("ai.income")} />
                  <Bar dataKey="expense" fill="hsl(var(--destructive))" name={t("ai.expense")} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("ai.spendingByCategory")}</CardTitle>
            </CardHeader>
            <CardContent>
              {charts.categories.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">{t("ai.noData")}</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={charts.categories} dataKey="value" nameKey="name" outerRadius={80} label={(e: any) => `${e.name}`}>
                      {charts.categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmt(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {insights && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-lg">{t("ai.recommendations")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{insights.summary}</p>

            {insights.actions?.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2"><Lightbulb size={16} /> {t("ai.topActions")}</div>
                {insights.actions.map((a, i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-sm">{a.title}</div>
                      <Badge variant={impactColor(a.impact) as any} className="text-[10px]">{a.impact}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{a.detail}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {insights.stop_spending?.length > 0 && (
                <div className="rounded-lg bg-destructive/10 p-3">
                  <div className="text-xs font-semibold flex items-center gap-1 mb-2 text-destructive"><AlertCircle size={14} /> Stop</div>
                  <ul className="text-xs space-y-1 list-disc ms-4">{insights.stop_spending.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
              {insights.save_tips?.length > 0 && (
                <div className="rounded-lg bg-emerald-500/10 p-3">
                  <div className="text-xs font-semibold flex items-center gap-1 mb-2 text-emerald-600"><PiggyBank size={14} /> Save</div>
                  <ul className="text-xs space-y-1 list-disc ms-4">{insights.save_tips.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
              {insights.earn_tips?.length > 0 && (
                <div className="rounded-lg bg-primary/10 p-3">
                  <div className="text-xs font-semibold flex items-center gap-1 mb-2 text-primary"><TrendingUp size={14} /> Earn</div>
                  <ul className="text-xs space-y-1 list-disc ms-4">{insights.earn_tips.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
