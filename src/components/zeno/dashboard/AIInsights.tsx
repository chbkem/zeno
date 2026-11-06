import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { analyzeSpending } from "@/lib/ai.functions";
import { summarize, type Transaction } from "@/lib/budget";
import { focusCategoryLabels, type UserProfile } from "@/lib/profile";
import { Markdown } from "./Markdown";

export function AIInsights({
  month,
  summary,
  txs,
  budgets,
  profile,
}: {
  month: string;
  summary: ReturnType<typeof summarize>;
  txs: Transaction[];
  budgets: Record<string, number>;
  profile: UserProfile;
}) {
  const analyze = useServerFn(analyzeSpending);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (txs.length === 0) {
      toast.error("Record a few transactions first");
      return;
    }
    setLoading(true);
    try {
      const r = await analyze({
        data: {
          month,
          income: summary.income,
          expenses: summary.expenses,
          balance: summary.balance,
          byCategory: summary.byCategory,
          budgets,
          profile: {
            monthlyBudget: profile.monthlyBudget,
            focusCategories: focusCategoryLabels(profile.categories),
          },
          recent: txs.map(({ type, amount, category, note, date }) => ({
            type,
            amount,
            category,
            note,
            date,
          })),
        },
      });
      if (!r.ok) toast.error(r.text);
      else setText(r.text);
    } catch {
      toast.error("Couldn't reach Zeno AI. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Zeno AI coach</p>
        <Button size="sm" onClick={run} disabled={loading}>
          <Sparkles className="mr-1 h-4 w-4" />
          {loading ? "Thinking…" : text ? "Refresh" : "Analyse"}
        </Button>
      </div>
      {text ? (
        <Markdown text={text} />
      ) : (
        <div className="flex items-start gap-3 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
          <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          Get a summary of your month, your spending patterns and practical tips to stretch your
          allowance.
        </div>
      )}
    </section>
  );
}
