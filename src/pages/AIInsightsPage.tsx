import { useState } from "react";
import { Sparkles, Loader2, TrendingUp, Calendar, CalendarDays } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Period = "daily" | "weekly" | "monthly";

export default function AIInsightsPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string>("");

  const run = async () => {
    setLoading(true);
    setInsights("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: { period, question: question.trim() || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setInsights(data.insights);
    } catch (e: any) {
      toast.error(e.message || "Failed to get insights");
    } finally {
      setLoading(false);
    }
  };

  const periods: { id: Period; label: string; icon: any }[] = [
    { id: "daily", label: "Daily", icon: Calendar },
    { id: "weekly", label: "Weekly", icon: CalendarDays },
    { id: "monthly", label: "Monthly", icon: TrendingUp },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" size={20} />
            AI Financial Advisor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Period</div>
            <div className="grid grid-cols-3 gap-2">
              {periods.map((p) => (
                <Button
                  key={p.id}
                  variant={period === p.id ? "default" : "outline"}
                  onClick={() => setPeriod(p.id)}
                  className="gap-2"
                >
                  <p.icon size={16} /> {p.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Ask a specific question (optional)</div>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What subscriptions should I cancel? How can I save more this month?"
              rows={3}
            />
          </div>

          <Button onClick={run} disabled={loading} className="w-full gap-2" size="lg">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {loading ? "Analyzing your data..." : "Get AI Insights"}
          </Button>
        </CardContent>
      </Card>

      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-ul:text-foreground">
              <ReactMarkdown>{insights}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
