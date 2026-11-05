import type { User } from "firebase/auth";
import { Budgets } from "./Budgets";
import { InstallAppCard } from "./InstallAppCard";

export function SettingsView({
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

      <InstallAppCard />
    </>
  );
}
