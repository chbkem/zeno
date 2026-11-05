import type { User } from "firebase/auth";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatNaira, summarize, type Transaction } from "@/lib/budget";
import { cn } from "@/lib/utils";
import { DonutChart } from "./DonutChart";
import { Stat } from "./Stat";
import { TransactionList } from "./TransactionList";
import { chartDots } from "./shared";

export function HomeView({
  user,
  summary,
  txs,
}: {
  user: User;
  summary: ReturnType<typeof summarize>;
  txs: Transaction[];
}) {
  const rows = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((sum, [, amount]) => sum + amount, 0);

  return (
    <>
      <section className="rounded-3xl bg-hero p-6 text-primary-foreground shadow-soft">
        <p className="text-sm opacity-80">
          Hi {user.displayName?.split(" ")[0] || "there"}, your available balance
        </p>
        <p className="mt-1 font-display dark:text-foreground  text-4xl font-extrabold">
          {formatNaira(summary.balance)}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 dark:text-foreground ">
          <Stat
            icon={<ArrowDownLeft className="h-4 w-4" />}
            label="Income this month"
            value={summary.income}
          />
          <Stat
            icon={<ArrowUpRight className="h-4 w-4" />}
            label="Spent this month"
            value={summary.expenses}
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Spending this month</p>
          <span className="text-xs text-muted-foreground">{formatNaira(summary.expenses)}</span>
        </div>
        {rows.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No expenses recorded yet this month.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <DonutChart data={rows.map(([name, amount]) => ({ name, amount }))} />
            <div className="w-full space-y-3">
              {rows.map(([category, amount], index) => (
                <div key={category}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className={cn("h-2 w-2 rounded-full", chartDots[index % chartDots.length])}
                      />
                      {category}
                    </span>
                    <span className="text-muted-foreground">
                      {formatNaira(amount)}
                      <span className="ml-1 text-xs">
                        ({total > 0 ? Math.round((amount / total) * 100) : 0}%)
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <TransactionList uid={user.uid} txs={txs} />
    </>
  );
}
