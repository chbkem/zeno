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
import { toast } from "sonner";
import { Sparkles, Trash2, LogOut, ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const today = () => new Date().toISOString().slice(0, 10);

export function Dashboard({ user }: { user: User }) {
  const { db, auth } = fb();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [month, setMonth] = useState(today().slice(0, 7));

  useEffect(() => {
    const q = query(collection(db, "users", user.uid, "transactions"), orderBy("date", "desc"));
    const unsub1 = onSnapshot(q, (snap) =>
      setTxs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Transaction, "id">) }))),
    );
    const unsub2 = onSnapshot(doc(db, "users", user.uid, "settings", "budgets"), (snap) =>
      setBudgets((snap.data() as Record<string, number>) ?? {}),
    );
    return () => {
      unsub1();
      unsub2();
    };
  }, [db, user.uid]);

  const s = useMemo(() => summarize(txs, month), [txs, month]);
  const monthTxs = txs.filter((t) => t.date.startsWith(month));

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="font-display text-2xl font-extrabold text-primary">zeno.</span>
        <div className="flex items-center gap-3">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
          <Button variant="ghost" size="icon" onClick={() => signOut(auth)} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 pb-16">
        <section className="rounded-3xl bg-hero p-7 text-primary-foreground shadow-soft">
          <p className="text-sm opacity-80">Hi {user.displayName?.split(" ")[0] || "there"}, your available balance</p>
          <p className="mt-1 font-display text-5xl font-extrabold">{formatNaira(s.balance)}</p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:max-w-md">
            <Stat icon={<ArrowDownLeft className="h-4 w-4" />} label="Income this month" value={s.income} />
            <Stat icon={<ArrowUpRight className="h-4 w-4" />} label="Spent this month" value={s.expenses} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <AddTransaction uid={user.uid} />
            <TransactionList uid={user.uid} txs={monthTxs} />
          </div>
          <div className="space-y-6 lg:col-span-2">
            <AIInsights month={month} s={s} budgets={budgets} txs={monthTxs} />
            <Budgets uid={user.uid} budgets={budgets} spent={s.byCategory} />
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-primary-foreground/10 p-3">
      <div className="flex items-center gap-1.5 text-xs opacity-80">{icon}{label}</div>
      <p className="mt-1 text-lg font-semibold">{formatNaira(value)}</p>
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function AddTransaction({ uid }: { uid: string }) {
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]!);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());
  const cats = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) { toast.error("Enter an amount above ₦0"); return; }
    await addDoc(collection(fb().db, "users", uid, "transactions"), { type, amount: n, category, note, date });
    setAmount("");
    setNote("");
    toast.success(type === "expense" ? "Expense recorded" : "Income recorded");
  };

  return (
    <Panel title="Record a transaction">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="col-span-full flex gap-2">
          {(["expense", "income"] as TxType[]).map((t) => (
            <Button
              key={t}
              type="button"
              variant={type === t ? "default" : "outline"}
              className="flex-1 capitalize"
              onClick={() => {
                setType(t);
                setCategory((t === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES)[0]!);
              }}
            >
              {t}
            </Button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label>Amount (₦)</Label>
          <Input inputMode="numeric" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="2500" />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Note</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Jollof at cafeteria" />
        </div>
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Button type="submit" className="col-span-full">Save</Button>
      </form>
    </Panel>
  );
}

function TransactionList({ uid, txs }: { uid: string; txs: Transaction[] }) {
  return (
    <Panel title="This month's transactions">
      {txs.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nothing recorded for this month yet.</p>
      ) : (
        <ul className="divide-y">
          {txs.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${t.type === "income" ? "bg-secondary text-success" : "bg-muted text-destructive"}`}>
                {t.type === "income" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.note || t.category}</p>
                <p className="text-xs text-muted-foreground">{t.category} · {t.date}</p>
              </div>
              <p className={`text-sm font-semibold ${t.type === "income" ? "text-success" : "text-foreground"}`}>
                {t.type === "income" ? "+" : "−"}{formatNaira(t.amount)}
              </p>
              <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => deleteDoc(doc(fb().db, "users", uid, "transactions", t.id))}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Budgets({ uid, budgets, spent }: { uid: string; budgets: Record<string, number>; spent: Record<string, number> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const startEdit = () => {
    setDraft(Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c, budgets[c] ? String(budgets[c]) : ""])));
    setEditing(true);
  };
  const save = async () => {
    const clean: Record<string, number> = {};
    for (const [k, v] of Object.entries(draft)) if (Number(v) > 0) clean[k] = Number(v);
    await setDoc(doc(fb().db, "users", uid, "settings", "budgets"), clean);
    setEditing(false);
    toast.success("Budgets saved");
  };

  const rows = EXPENSE_CATEGORIES.filter((c) => budgets[c] || spent[c]);

  return (
    <Panel title="Monthly budgets" action={!editing && <Button size="sm" variant="outline" onClick={startEdit}>Set limits</Button>}>
      {editing ? (
        <div className="space-y-3">
          {EXPENSE_CATEGORIES.map((c) => (
            <div key={c} className="flex items-center gap-3">
              <Label className="flex-1 text-sm">{c}</Label>
              <Input className="w-32" type="number" min="0" placeholder="₦0" value={draft[c] ?? ""} onChange={(e) => setDraft({ ...draft, [c]: e.target.value })} />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={save}>Save</Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Set a spending limit per category to get alerts before you overspend.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((c) => {
            const used = spent[c] ?? 0;
            const limit = budgets[c] ?? 0;
            const st = budgetStatus(used, limit);
            return (
              <div key={c}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{c}</span>
                  <span className={st.level === "over" ? "font-semibold text-destructive" : "text-muted-foreground"}>
                    {formatNaira(used)}{limit ? ` / ${formatNaira(limit)}` : ""}
                  </span>
                </div>
                {limit > 0 && <Progress value={Math.min(st.pct, 100)} className={st.level === "over" ? "[&>div]:bg-destructive" : st.level === "warning" ? "[&>div]:bg-accent" : ""} />}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function AIInsights({ month, s, budgets, txs }: { month: string; s: ReturnType<typeof summarize>; budgets: Record<string, number>; txs: Transaction[] }) {
  const analyze = useServerFn(analyzeSpending);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (txs.length === 0) { toast.error("Record a few transactions first"); return; }
    setLoading(true);
    try {
      const r = await analyze({
        data: {
          month, income: s.income, expenses: s.expenses, balance: s.balance, byCategory: s.byCategory, budgets,
          recent: txs.map(({ type, amount, category, note, date }) => ({ type, amount, category, note, date })),
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
    <Panel
      title="Zeno AI coach"
      action={<Button size="sm" onClick={run} disabled={loading}><Sparkles className="mr-1 h-4 w-4" />{loading ? "Thinking…" : text ? "Refresh" : "Analyse"}</Button>}
    >
      {text ? <Markdown text={text} /> : (
        <div className="flex items-start gap-3 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
          <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          Get a summary of your month, your spending patterns and practical tips to stretch your allowance.
        </div>
      )}
    </Panel>
  );
}

function Markdown({ text }: { text: string }) {
  const bold = (l: string) =>
    l.split(/(\*\*[^*]+\*\*)/).map((p, i) => p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p);
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {text.split("\n").filter((l) => l.trim()).map((l, i) => {
        if (l.startsWith("#")) return <h4 key={i} className="pt-2 font-display font-bold text-primary">{l.replace(/^#+\s*/, "")}</h4>;
        if (/^\s*([-*]|\d+\.)\s/.test(l)) return <p key={i} className="pl-4 before:-ml-4 before:mr-2 before:text-accent before:content-['●']">{bold(l.replace(/^\s*([-*]|\d+\.)\s/, ""))}</p>;
        return <p key={i}>{bold(l)}</p>;
      })}
    </div>
  );
}
