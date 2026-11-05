import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fb } from "@/lib/firebase";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type TxType } from "@/lib/budget";
import { today } from "./shared";

export function AddTransactionSheet({
  uid,
  open,
  onOpenChange,
}: {
  uid: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]!);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);

  const cats = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const changeType = (next: TxType) => {
    setType(next);
    const list = next === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    // Keep the current category only if it exists in the new list.
    if (!list.includes(category)) setCategory(list[0]!);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter an amount above ₦0");
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(fb().db, "users", uid, "transactions"), {
        type,
        amount: value,
        category,
        note,
        date,
      });
      setAmount("");
      setNote("");
      setDate(today());
      onOpenChange(false);
      toast.success(type === "expense" ? "Expense recorded" : "Income recorded");
    } catch (err) {
      toast.error("Couldn't save: " + (err as Error).message.replace("Firebase: ", ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Record a transaction</SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div className="flex gap-2">
            {(["expense", "income"] as TxType[]).map((t) => (
              <Button
                key={t}
                type="button"
                variant={type === t ? "default" : "outline"}
                className="flex-1 capitalize"
                onClick={() => changeType(t)}
              >
                {t}
              </Button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              inputMode="numeric"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="2500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cats.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Note</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Jollof at cafeteria"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
