import { Progress } from "@/components/ui/progress";
import { budgetStatus, formatNaira, summarize, type Transaction } from "@/lib/budget";
import { cn } from "@/lib/utils";
import { AIInsights } from "./AIInsights";
import { chartDots } from "./shared";

export function StatsView({
  month,
  summary,
  txs,
  budgets,
}: {
  month: string;
  summary: ReturnType<typeof summarize>;
  txs: Transaction[];
  budgets: Record<string, number>;
}) {
  const rows = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((sum, [, amount]) => sum + amount, 0);
  const savingsRate =
    summary.income > 0 ? ((summary.income - summary.expenses) / summary.income) * 100 : 0;

  return (
    <>
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="mt-1 text-lg font-semibold text-success">{formatNaira(summary.income)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Expenses</p>
          <p className="mt-1 text-lg font-semibold">{formatNaira(summary.expenses)}</p>
        </div>
        <div className="col-span-2 rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Savings rate</p>
            <p className="text-sm font-semibold">{Math.round(savingsRate)}%</p>
          </div>
          <Progress value={Math.max(0, Math.min(savingsRate, 100))} className="mt-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            {txs.length} transaction{txs.length === 1 ? "" : "s"} this month
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <p className="mb-3 text-sm font-semibold">Where your money went</p>
        {rows.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nothing recorded for this month yet.
          </p>
        ) : (
          <div className="space-y-4">
            {rows.map(([category, amount], index) => {
              const limit = budgets[category] ?? 0;
              const status = budgetStatus(amount, limit);
              return (
                <div key={category}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className={cn("h-2 w-2 rounded-full", chartDots[index % chartDots.length])}
                      />
                      {category}
                    </span>
                    <span
                      className={
                        status.level === "over"
                          ? "font-semibold text-destructive"
                          : "text-muted-foreground"
                      }
                    >
                      {formatNaira(amount)}
                      {limit > 0 ? ` / ${formatNaira(limit)}` : ""}
                    </span>
                  </div>
                  <Progress
                    value={
                      limit > 0 ? Math.min(status.pct, 100) : total > 0 ? (amount / total) * 100 : 0
                    }
                    className={
                      status.level === "over"
                        ? "[&>div]:bg-destructive"
                        : status.level === "warning"
                          ? "[&>div]:bg-accent"
                          : ""
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <AIInsights month={month} summary={summary} txs={txs} budgets={budgets} />
    </>
  );
}
