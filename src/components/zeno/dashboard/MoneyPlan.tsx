import { useEffect, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatNumber } from "@/lib/budget";
import { fb } from "@/lib/firebase";
import { FOCUS_CATEGORIES, type UserProfile } from "@/lib/profile";

export function MoneyPlan({ uid, profile }: { uid: string; profile: UserProfile }) {
  const [budget, setBudget] = useState(() =>
    profile.monthlyBudget > 0 ? formatNumber(String(profile.monthlyBudget)) : "",
  );
  const [selected, setSelected] = useState<string[]>(profile.categories);
  const [synced, setSynced] = useState(profile.monthlyBudget > 0 || profile.categories.length > 0);
  const [saving, setSaving] = useState(false);

  // The profile arrives asynchronously on first load; fill the form once it does.
  useEffect(() => {
    if (synced) return;
    if (profile.monthlyBudget > 0 || profile.categories.length > 0) {
      setBudget(profile.monthlyBudget > 0 ? formatNumber(String(profile.monthlyBudget)) : "");
      setSelected(profile.categories);
      setSynced(true);
    }
  }, [profile, synced]);

  const save = async () => {
    const amount = budget.trim() ? Number(budget.replace(/,/g, "")) : 0;

    if (!Number.isSafeInteger(amount) || amount < 0 || (amount > 0 && amount < 1000)) {
      toast.error("Enter a monthly budget of at least ₦1,000, or leave it empty.");
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(fb().db, "users", uid, "settings", "profile"),
        { monthlyBudget: amount, categories: selected, updatedAt: serverTimestamp() },
        { merge: true },
      );
      toast.success("Monthly plan saved");
    } catch (err) {
      toast.error("Couldn't save your plan: " + (err as Error).message.replace("Firebase: ", ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border bg-card p-4">
      <p className="text-sm font-semibold">Monthly plan</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Your onboarding answers. Zeno uses these for budget progress and AI tips.
      </p>

      <div className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="plan-budget">Monthly budget (₦)</Label>
          <Input
            id="plan-budget"
            inputMode="numeric"
            value={budget}
            onChange={(event) => setBudget(formatNumber(event.target.value))}
            placeholder="e.g. 50,000"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Focus categories</p>
          <ToggleGroup
            type="multiple"
            value={selected}
            onValueChange={setSelected}
            className="flex flex-wrap justify-start gap-2"
          >
            {FOCUS_CATEGORIES.map((category) => (
              <ToggleGroupItem
                key={category.id}
                value={category.id}
                aria-label={category.label}
                className="rounded-md border px-3 py-1.5 text-sm"
              >
                {category.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save plan"}
        </Button>
      </div>
    </section>
  );
}
