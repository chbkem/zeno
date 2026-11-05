import { useEffect, useMemo, useState } from "react";
import { signOut, type User } from "firebase/auth";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { toast } from "sonner";
import { fb } from "@/lib/firebase";
import { summarize, type Transaction } from "@/lib/budget";
import { AddTransactionSheet } from "./dashboard/AddTransactionSheet";
import { BottomNav } from "./dashboard/BottomNav";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { HomeView } from "./dashboard/HomeView";
import { SettingsView } from "./dashboard/SettingsView";
import { StatsView } from "./dashboard/StatsView";
import { today } from "./dashboard/shared";

export type DashboardPage = "home" | "stats" | "settings";

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
      <DashboardHeader
        month={month}
        onMonthChange={setMonth}
        onAdd={() => setAddOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onSignOut={() => signOut(auth)}
      />

      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-24">
        {page === "home" && <HomeView user={user} summary={summary} txs={monthTxs} />}
        {page === "stats" && (
          <StatsView month={month} summary={summary} txs={monthTxs} budgets={budgets} />
        )}
        {page === "settings" && <SettingsView user={user} uid={user.uid} budgets={budgets} />}
      </main>

      <BottomNav />

      <AddTransactionSheet uid={user.uid} open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
