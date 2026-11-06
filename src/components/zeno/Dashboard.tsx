import { useEffect, useMemo, useState } from "react";
import { signOut, type User } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { toast } from "sonner";
import { fb } from "@/lib/firebase";
import { summarize, type Transaction } from "@/lib/budget";
import {
  EMPTY_PROFILE,
  normalizeProfile,
  profileFromAnswers,
  type UserProfile,
} from "@/lib/profile";
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
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
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

  // The plan saved during onboarding (and later edited in Settings).
  useEffect(() => {
    let active = true;
    const profileRef = doc(db, "users", user.uid, "settings", "profile");
    const onError = (err: Error) =>
      toast.error("Couldn't load your plan: " + err.message.replace("Firebase: ", ""));

    const unsub = onSnapshot(
      profileRef,
      (snap) => {
        if (!active) return;

        if (snap.exists()) {
          setProfile(normalizeProfile(snap.data()) ?? EMPTY_PROFILE);
          return;
        }

        // Accounts that onboarded before the profile doc existed keep their
        // answers in the onboarding doc, so use those as the starting plan.
        getDoc(doc(db, "users", user.uid, "onboarding", "status"))
          .then((status) => {
            if (!active) return;
            const legacy = profileFromAnswers(status.data()?.["answers"]);
            if (legacy) {
              setProfile((current) =>
                current.monthlyBudget > 0 || current.categories.length > 0 ? current : legacy,
              );
            }
          })
          .catch(() => {
            // Onboarding is optional; a missing plan just hides the budget card.
          });
      },
      onError,
    );

    return () => {
      active = false;
      unsub();
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
        onSignOut={() => signOut(auth)}
      />

      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-24">
        {page === "home" && (
          <HomeView user={user} summary={summary} txs={monthTxs} profile={profile} />
        )}
        {page === "stats" && (
          <StatsView
            month={month}
            summary={summary}
            txs={monthTxs}
            budgets={budgets}
            profile={profile}
          />
        )}
        {page === "settings" && (
          <SettingsView
            user={user}
            uid={user.uid}
            budgets={budgets}
            profile={profile}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
          />
        )}
      </main>

      <BottomNav />

      <AddTransactionSheet
        uid={user.uid}
        open={addOpen}
        onOpenChange={setAddOpen}
        focusCategories={profile.categories}
      />
    </div>
  );
}
