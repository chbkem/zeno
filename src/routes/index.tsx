import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { fb, isFirebaseConfigured } from "@/lib/firebase";
import { AuthCard } from "@/components/zeno/AuthCard";
import { Dashboard } from "@/components/zeno/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zeno — Budgeting for Nigerian students" },
      { name: "description", content: "Track your allowance, expenses and budgets in Naira, with AI tips to spend smarter on campus." },
      { property: "og:title", content: "Zeno — Budgeting for Nigerian students" },
      { property: "og:description", content: "Track income, expenses and monthly budgets, with Gemini-powered money tips." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (!isFirebaseConfigured) { setUser(null); return; }
    return onAuthStateChanged(fb().auth, setUser);
  }, []);

  if (user) return <Dashboard user={user} />;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between bg-hero p-8 text-primary-foreground lg:p-14">
        <span className="font-display text-3xl font-extrabold">zeno.</span>
        <div className="my-12">
          <h1 className="max-w-md text-5xl font-extrabold leading-[1.05] lg:text-6xl">
            Make your allowance last till month end.
          </h1>
          <p className="mt-5 max-w-sm text-lg opacity-85">
            Track every naira, set budgets for food, data and transport, and get AI tips that actually fit campus life.
          </p>
        </div>
        <p className="text-sm opacity-70">Built for Nigerian undergrads · ₦</p>
      </div>
      <div className="flex items-center justify-center p-6">
        {user === undefined ? null : isFirebaseConfigured ? (
          <AuthCard />
        ) : (
          <div className="max-w-sm rounded-3xl border bg-card p-7 text-sm shadow-soft">
            <h2 className="text-xl font-bold">Almost ready</h2>
            <p className="mt-2 text-muted-foreground">Sign-in will turn on once the Firebase project details are added.</p>
          </div>
        )}
      </div>
    </div>
  );
}
