import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fb } from "@/lib/firebase";
import { EXPENSE_CATEGORIES } from "@/lib/budget";

export function Budgets({ uid, budgets }: { uid: string; budgets: Record<string, number> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const startEdit = () => {
    setDraft(
      Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c, budgets[c] ? String(budgets[c]) : ""])),
    );
    setEditing(true);
  };

  const save = async () => {
    const clean: Record<string, number> = {};
    for (const [k, v] of Object.entries(draft)) if (Number(v) > 0) clean[k] = Number(v);
    try {
      await setDoc(doc(fb().db, "users", uid, "settings", "budgets"), clean);
      setEditing(false);
      toast.success("Budgets saved");
    } catch (err) {
      toast.error("Couldn't save budgets: " + (err as Error).message.replace("Firebase: ", ""));
    }
  };

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Monthly budgets</p>
        {!editing && (
          <Button size="sm" variant="outline" onClick={startEdit}>
            Set limits
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          {EXPENSE_CATEGORIES.map((c) => (
            <div key={c} className="flex items-center gap-3">
              <Label className="flex-1 text-sm">{c}</Label>
              <Input
                className="w-32"
                type="number"
                min="0"
                placeholder="₦0"
                value={draft[c] ?? ""}
                onChange={(e) => setDraft({ ...draft, [c]: e.target.value })}
              />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={save}>
              Save
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Set a spending limit per category to get alerts before you overspend. Track progress on
          the Stats tab.
        </p>
      )}
    </section>
  );
}
