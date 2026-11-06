import type { User } from "firebase/auth";
import { Switch } from "@/components/ui/switch";
import type { UserProfile } from "@/lib/profile";
import { Budgets } from "./Budgets";
import { InstallAppCard } from "./InstallAppCard";
import { MoneyPlan } from "./MoneyPlan";

export function SettingsView({
  user,
  uid,
  budgets,
  profile,
  darkMode,
  onToggleDarkMode,
}: {
  user: User;
  uid: string;
  budgets: Record<string, number>;
  profile: UserProfile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}) {
  return (
    <>
      <section className="rounded-2xl border bg-card p-4">
        <p className="text-sm font-semibold">Account</p>
        <p className="mt-2 text-sm">{user.displayName || "Student"}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </section>

      <MoneyPlan uid={uid} profile={profile} />

      <Budgets uid={uid} budgets={budgets} />

      <section className="rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Appearance</p>
            <p className="text-sm text-muted-foreground">
              {darkMode ? "Dark mode is on" : "Dark mode is off"}
            </p>
          </div>
          <Switch
            checked={darkMode}
            onCheckedChange={onToggleDarkMode}
            aria-label="Toggle dark mode"
          />
        </div>
      </section>

      <InstallAppCard />
    </>
  );
}
