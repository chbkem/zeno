import { Progress } from "@/components/ui/progress";
import { budgetStatus, formatNaira } from "@/lib/budget";
import { cn } from "@/lib/utils";

export function MonthlyBudgetCard({ budget, spent }: { budget: number; spent: number }) {
  if (budget <= 0) return null;

  const status = budgetStatus(spent, budget);
  const remaining = budget - spent;
  const over = status.level === "over";

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Monthly budget</p>
        <span className="text-xs text-muted-foreground">
          {formatNaira(spent)} of {formatNaira(budget)}
        </span>
      </div>
      <Progress
        value={Math.min(status.pct, 100)}
        className={cn(
          "mt-3",
          status.level === "over"
            ? "[&>div]:bg-destructive"
            : status.level === "warning"
              ? "[&>div]:bg-accent"
              : "",
        )}
      />
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className={over ? "font-medium text-destructive" : "text-muted-foreground"}>
          {remaining > 0
            ? `${formatNaira(remaining)} left this month`
            : remaining === 0
              ? "Budget fully used"
              : `${formatNaira(Math.abs(remaining))} over your budget`}
        </span>
        <span className="text-muted-foreground">{Math.round(status.pct)}% used</span>
      </div>
    </section>
  );
}
