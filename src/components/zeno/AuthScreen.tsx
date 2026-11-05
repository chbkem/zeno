import { AuthCard } from "./AuthCard";
import { isFirebaseConfigured } from "@/lib/firebase";

export function AuthScreen() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between bg-hero p-8 text-primary-foreground lg:p-14">
        <span className="font-display text-3xl font-extrabold">zeno.</span>
        <div className="my-12">
          <h1 className="max-w-md text-5xl font-extrabold leading-[1.05] lg:text-6xl">
            Make your allowance last till month end.
          </h1>
          <p className="mt-5 max-w-sm text-lg opacity-85">
            Track every naira, set budgets for food, data and transport, and get AI tips that
            actually fit campus life.
          </p>
        </div>
        <p className="text-sm opacity-70">Built for Nigerian undergrads · ₦</p>
      </div>
      <div className="flex items-center justify-center p-6">
        {isFirebaseConfigured ? (
          <AuthCard />
        ) : (
          <div className="max-w-sm rounded-3xl border bg-card p-7 text-sm shadow-soft">
            <h2 className="text-xl font-bold">Almost ready</h2>
            <p className="mt-2 text-muted-foreground">
              Sign-in will turn on once the Firebase project details are added.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
