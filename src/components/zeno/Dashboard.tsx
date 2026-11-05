import { useEffect, useMemo, useState } from "react";
import { signOut, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Home,
  LogOut,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Wallet,
  Moon,
  Sun,
} from "lucide-react";
import { fb } from "@/lib/firebase";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  budgetStatus,
  formatNaira,
  summarize,
  type Transaction,
  type TxType,
} from "@/lib/budget";
import { analyzeSpending } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type DashboardPage = "home" | "stats" | "settings";

const today = () => new Date().toISOString().slice(0, 10);

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const chartDots = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];

export function Dashboard({ user, page = "home" }: { user: User; page?: DashboardPage }) {
  const { db, auth } = fb();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [month, setMonth] = useState(today().slice(0, 7));
  const [addOpen, setAddOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Restore the saved theme once on mount, then keep the root class in sync.
  useEffect(() => {
    if (window.localStorage.getItem("zeno-theme") === "dark") setDarkMode(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem("zeno-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const q = query(collection(db, "users", user.uid, "transactions"), orderBy("date", "desc"));
    const onError = (err: Error) =>
      toast.error("Couldn't load your data: " + err.message.replace("Firebase: ", ""));
    const unsub1 = onSnapshot(
      q,
      (snap) =>
        setTxs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Transaction, "id">) }))),
      onError,
    );
    const unsub2 = onSnapshot(
      doc(db, "users", user.uid, "settings", "budgets"),
      (snap) => setBudgets((snap.data() as Record<string, number>) ?? {}),
      onError,
    );
    return () => {
      unsub1();
      unsub2();
    };
  }, [db, user.uid]);

  const summary = useMemo(() => summarize(txs, month), [txs, month]);
  const monthTxs = useMemo(() => txs.filter((t) => t.date.startsWith(month)), [txs, month]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="font-display text-xl font-extrabold text-primary">
          zeno.
        </Link>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-36"
            aria-label="Month"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAddOpen(true)}
            aria-label="Add transaction"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => signOut(auth)} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-24">
        {page === "home" && <HomeView user={user} summary={summary} txs={monthTxs} />}
        {page === "stats" && (
          <StatsView month={month} summary={summary} txs={monthTxs} budgets={budgets} />
        )}
        {page === "settings" && <SettingsView user={user} uid={user.uid} budgets={budgets} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/50 bg-card px-4 py-2">
        <div className="mx-auto flex w-full max-w-3xl justify-around">
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: true }}
              className="flex flex-col items-center rounded-lg px-6 py-1 text-xs font-medium transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
            >
              <Icon className="mb-1 h-5 w-5" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <AddTransactionSheet uid={user.uid} open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function HomeView({
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
        <p className="mt-1 font-display text-4xl font-extrabold">{formatNaira(summary.balance)}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
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
                  <Progress value={total > 0 ? (amount / total) * 100 : 0} />
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

function DonutChart({ data }: { data: { name: string; amount: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  let running = 0;
  const slices = data.map((item, index) => {
    const dash = total > 0 ? (item.amount / total) * circumference : 0;
    const slice = {
      ...item,
      dash,
      offset: running,
      color: `var(--chart-${(index % 5) + 1})`,
    };
    running += dash;
    return slice;
  });

  return (
    <svg
      viewBox="0 0 200 200"
      className="h-48 w-48 shrink-0"
      role="img"
      aria-label={`Spending breakdown: ${data
        .map((item) => `${item.name} ${formatNaira(item.amount)}`)
        .join(", ")}`}
    >
      <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--muted)" strokeWidth="24" />
      {slices.map((slice) => (
        <circle
          key={slice.name}
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={slice.color}
          strokeWidth="24"
          strokeDasharray={`${slice.dash} ${circumference - slice.dash}`}
          strokeDashoffset={-slice.offset}
          transform="rotate(-90 100 100)"
        />
      ))}
      <text x="100" y="98" textAnchor="middle" fill="currentColor" fontSize="18" fontWeight="700">
        {formatNaira(total)}
      </text>
      <text x="100" y="118" textAnchor="middle" fill="var(--muted-foreground)" fontSize="11">
        spent
      </text>
    </svg>
  );
}

function StatsView({
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

function SettingsView({
  user,
  uid,
  budgets,
}: {
  user: User;
  uid: string;
  budgets: Record<string, number>;
}) {
  return (
    <>
      <section className="rounded-2xl border bg-card p-4">
        <p className="text-sm font-semibold">Account</p>
        <p className="mt-2 text-sm">{user.displayName || "Student"}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </section>

      <Budgets uid={uid} budgets={budgets} />
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-primary-foreground/10 p-3">
      <div className="flex items-center gap-1.5 text-xs opacity-80">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold">{formatNaira(value)}</p>
    </div>
  );
}

function TransactionList({ uid, txs }: { uid: string; txs: Transaction[] }) {
  return (
    <section className="rounded-2xl border bg-card p-4">
      <p className="mb-2 text-sm font-semibold">This month&apos;s transactions</p>
      {txs.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nothing recorded for this month yet.
        </p>
      ) : (
        <ul className="divide-y">
          {txs.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  t.type === "income" ? "bg-secondary text-success" : "bg-muted text-destructive"
                }`}
              >
                {t.type === "income" ? (
                  <ArrowDownLeft className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.note || t.category}</p>
                <p className="text-xs text-muted-foreground">
                  {t.category} · {t.date}
                </p>
              </div>
              <p
                className={`text-sm font-semibold ${t.type === "income" ? "text-success" : "text-foreground"}`}
              >
                {t.type === "income" ? "+" : "−"}
                {formatNaira(t.amount)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete"
                onClick={() =>
                  deleteDoc(doc(fb().db, "users", uid, "transactions", t.id)).catch((err) =>
                    toast.error(
                      "Couldn't delete: " + (err as Error).message.replace("Firebase: ", ""),
                    ),
                  )
                }
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AddTransactionSheet({
  uid,
  open,
  onOpenChange,
}: {
  uid: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]!);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);

  const cats = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const changeType = (next: TxType) => {
    setType(next);
    const list = next === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    // Keep the current category only if it exists in the new list.
    if (!list.includes(category)) setCategory(list[0]!);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter an amount above ₦0");
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(fb().db, "users", uid, "transactions"), {
        type,
        amount: value,
        category,
        note,
        date,
      });
      setAmount("");
      setNote("");
      setDate(today());
      onOpenChange(false);
      toast.success(type === "expense" ? "Expense recorded" : "Income recorded");
    } catch (err) {
      toast.error("Couldn't save: " + (err as Error).message.replace("Firebase: ", ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Record a transaction</SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div className="flex gap-2">
            {(["expense", "income"] as TxType[]).map((t) => (
              <Button
                key={t}
                type="button"
                variant={type === t ? "default" : "outline"}
                className="flex-1 capitalize"
                onClick={() => changeType(t)}
              >
                {t}
              </Button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              inputMode="numeric"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="2500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cats.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Note</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Jollof at cafeteria"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Budgets({ uid, budgets }: { uid: string; budgets: Record<string, number> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const startEdit = () => {
    setDraft(
      Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c, budgets[c] ? String(budgets[c]) : ""])),
    );
    setEditing(true);
  };

  const save = async () => {
    const clean: Record<string, number> = {};
    for (const [k, v] of Object.entries(draft)) if (Number(v) > 0) clean[k] = Number(v);
    try {
      await setDoc(doc(fb().db, "users", uid, "settings", "budgets"), clean);
      setEditing(false);
      toast.success("Budgets saved");
    } catch (err) {
      toast.error("Couldn't save budgets: " + (err as Error).message.replace("Firebase: ", ""));
    }
  };

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Monthly budgets</p>
        {!editing && (
          <Button size="sm" variant="outline" onClick={startEdit}>
            Set limits
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          {EXPENSE_CATEGORIES.map((c) => (
            <div key={c} className="flex items-center gap-3">
              <Label className="flex-1 text-sm">{c}</Label>
              <Input
                className="w-32"
                type="number"
                min="0"
                placeholder="₦0"
                value={draft[c] ?? ""}
                onChange={(e) => setDraft({ ...draft, [c]: e.target.value })}
              />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={save}>
              Save
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Set a spending limit per category to get alerts before you overspend. Track progress on
          the Stats tab.
        </p>
      )}
    </section>
  );
}

function AIInsights({
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
      toast.error("Couldn't reach Gemini. Try again.");
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

function Markdown({ text }: { text: string }) {
  const bold = (l: string) =>
    l
      .split(/(\*\*[^*]+\*\*)/)
      .map((p, i) => (p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p));

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {text
        .split("\n")
        .filter((l) => l.trim())
        .map((l, i) => {
          if (l.startsWith("#"))
            return (
              <h4 key={i} className="pt-2 font-display font-bold text-primary">
                {l.replace(/^#+\s*/, "")}
              </h4>
            );
          if (/^\s*([-*]|\d+\.)\s/.test(l))
            return (
              <p
                key={i}
                className="pl-4 before:-ml-4 before:mr-2 before:text-accent before:content-['●']"
              >
                {bold(l.replace(/^\s*([-*]|\d+\.)\s/, ""))}
              </p>
            );
          return <p key={i}>{bold(l)}</p>;
        })}
    </div>
  );
}
