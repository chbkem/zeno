export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  note: string;
  date: string; // YYYY-MM-DD
}

export const EXPENSE_CATEGORIES = [
  "Food & Snacks",
  "Transport",
  "Data & Airtime",
  "Rent & Hostel",
  "Books & School",
  "Fashion",
  "Hangouts",
  "Health",
  "Other",
];

export const INCOME_CATEGORIES = ["Allowance", "Side Hustle", "Scholarship", "Gift", "Other"];

export const formatNaira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");

/** Formats digits typed into a money input (e.g. "50000" -> "50,000"). */
export function formatNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-NG");
}

export const monthKey = (date: string) => date.slice(0, 7);

export function summarize(txs: Transaction[], month: string) {
  const inMonth = txs.filter((t) => monthKey(t.date) === month);
  const income = inMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = inMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const allIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const allExpense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const byCategory: Record<string, number> = {};
  for (const t of inMonth) {
    if (t.type === "expense") byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  }
  return { income, expenses, balance: allIncome - allExpense, byCategory, count: inMonth.length };
}

export function budgetStatus(spent: number, limit: number) {
  if (!limit || limit <= 0) return { pct: 0, level: "none" as const };
  const pct = (spent / limit) * 100;
  const level = pct >= 100 ? "over" : pct >= 80 ? "warning" : "ok";
  return { pct, level } as { pct: number; level: "ok" | "warning" | "over" };
}
