import { describe, it, expect } from "vitest";
import { summarize, budgetStatus, type Transaction } from "./budget";

const txs: Transaction[] = [
  { id: "1", type: "income", amount: 50000, category: "Allowance", note: "", date: "2026-11-01" },
  { id: "2", type: "expense", amount: 12000, category: "Food & Snacks", note: "", date: "2026-11-03" },
  { id: "3", type: "expense", amount: 3000, category: "Transport", note: "", date: "2026-10-20" },
];

describe("budget", () => {
  it("balance is all income minus all expenses", () => {
    expect(summarize(txs, "2026-11").balance).toBe(35000);
  });
  it("monthly expenses only count that month", () => {
    expect(summarize(txs, "2026-11").expenses).toBe(12000);
  });
  it("budget warns at 80% and flags over at 100%", () => {
    expect(budgetStatus(8000, 10000).level).toBe("warning");
    expect(budgetStatus(10000, 10000).level).toBe("over");
    expect(budgetStatus(5000, 10000).level).toBe("ok");
  });
});
